const { Events, PermissionFlagsBits } = require('discord.js');
const { getServerRegexFilters, getWeenSpeakChannels } = require('../modules/db.js');
const { handleWeenSpeakMessage } = require('../modules/weenspeak.js');

const filterCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000;

let weenspeakChannels = new Set();

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.author.bot) return;

        console.log(`Message received from ${message.author.tag}: "${message.content}"`);

        if (weenspeakChannels.size === 0) {
            try {
                const channels = await getWeenSpeakChannels();
                weenspeakChannels = new Set(channels);
                console.log(`Loaded ${weenspeakChannels.size} weenspeak channels`);
            } catch (error) {
                console.error('Error loading weenspeak channels:', error);
            }
        }

        if (weenspeakChannels.has(message.channel.id) && process.env.GEMINI_API_KEY) {
            try {
                await handleWeenSpeakMessage(message);
            } catch (error) {
                console.error('Error handling weenspeak message:', error);
            }
        }

        if (!message.guild) return;

        const serverId = message.guild.id;

        let filters;
        const cached = filterCache.get(serverId);

        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            filters = cached.filters;
        } else {
            try {
                filters = await getServerRegexFilters(serverId);
                filterCache.set(serverId, {
                    filters: filters,
                    timestamp: Date.now()
                });
            } catch (error) {
                console.error('Error fetching regex filters:', error);
                return;
            }
        }

        if (!filters || filters.length === 0) {
            return;
        }

        const botMember = message.guild.members.me;
        if (!botMember.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return;
        }

        console.log(`Checking ${filters.length} regex filters for server ${serverId}`);
        const isAdmin = message.member.permissions.has(PermissionFlagsBits.Administrator);

        for (const filter of filters) {
            try {
                if (isAdmin && !filter.affects_admins) {
                    continue;
                }

                const regex = new RegExp(filter.pattern, 'gim');

                if (regex.test(message.content)) {
                    console.log(`Filter matched: "${filter.name}" triggered by ${message.author.tag} (admin: ${isAdmin}, affects_admins: ${filter.affects_admins})`);

                    try {
                        await message.delete();
                    } catch (err) {
                        console.error('Failed to delete message:', err);
                        continue;
                    }

                    switch (filter.action) {
                        case 'warn':
                            try {
                                await message.channel.send(
                                    `${message.author}, your message was removed for violating server rules: **${filter.name}**`
                                ).then(msg => {
                                    setTimeout(() => msg.delete().catch(() => { }), 5000);
                                });
                            } catch (err) {
                                console.error('Failed to send warning:', err);
                            }
                            break;

                        case 'timeout':
                            try {
                                if (message.member.moderatable) {
                                    await message.member.timeout(5 * 60 * 1000, `Regex filter: ${filter.name}`);
                                    await message.channel.send(
                                        `${message.author} has been timed out for 5 minutes for violating: **${filter.name}**`
                                    ).then(msg => {
                                        setTimeout(() => msg.delete().catch(() => { }), 5000);
                                    });
                                }
                            } catch (err) {
                                console.error('Failed to timeout user:', err);
                            }
                            break;

                        case 'delete':
                        default:
                            break;
                    }
                    break;
                }
            } catch (error) {
                console.error(`Error testing regex filter "${filter.name}":`, error);
                continue;
            }
        }
    }
};

function clearFilterCache(serverId) {
    if (serverId) {
        filterCache.delete(serverId);
    } else {
        filterCache.clear();
    }
}

async function refreshWeenspeakChannels() {
    try {
        const channels = await getWeenSpeakChannels();
        weenspeakChannels = new Set(channels);
        console.log(`Refreshed weenspeak channels: ${weenspeakChannels.size} total`);
        return weenspeakChannels;
    } catch (error) {
        console.error('Error refreshing weenspeak channels:', error);
        return weenspeakChannels;
    }
}

module.exports.clearFilterCache = clearFilterCache;
module.exports.refreshWeenspeakChannels = refreshWeenspeakChannels;