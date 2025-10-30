const { Events, PermissionFlagsBits } = require('discord.js');
const { getServerRegexFilters } = require('../modules/db.js');

const filterCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000;

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.author.bot || !message.guild) return;

        const botMember = message.guild.members.me;
        if (!botMember.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return;
        }

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

        if (!filters || filters.length === 0) return;

        for (const filter of filters) {
            try {
                const regex = new RegExp(filter.pattern, 'i');
                
                if (regex.test(message.content)) {
                    console.log(`Filter matched: "${filter.name}" triggered by ${message.author.tag}`);

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
                                    setTimeout(() => msg.delete().catch(() => {}), 5000);
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
                                        setTimeout(() => msg.delete().catch(() => {}), 5000);
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

module.exports.clearFilterCache = clearFilterCache;