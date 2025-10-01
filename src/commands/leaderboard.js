const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const { 
    getButtonCount,
    getLeaderboardPersonalButtons,
    getLeaderboardServerButtons,
    getLeaderboardAchievements,
    getServerPersonalButtons,
    getServerAchievements
} = require('../modules/db.js');
const { privateButtonReplies } = require('../modules/globals.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('view various leaderboards'),

    async execute(interaction) {
        const serverId = interaction.guild?.id;

        if (!interaction.channel) {
            return interaction.reply({ 
                content: 'this command must be used in a server channel',
                ephemeral: true 
            });
        }

        await interaction.deferReply();

        try {
            let currentScope = 'global';
            let currentType = 'personal_buttons';

            const leaderboards = await fetchLeaderboards(interaction, currentScope, serverId);
            
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('lb_select')
                .setPlaceholder('choose leaderboard type')
                .addOptions(
                    {
                        label: 'personal button clicks',
                        description: 'most personal button clicks',
                        value: 'personal_buttons',
                        emoji: '🔘'
                    },
                    {
                        label: 'server buttons',
                        description: 'biggest server buttons',
                        value: 'server_buttons',
                        emoji: '🖥️'
                    },
                    {
                        label: 'achievements',
                        description: 'most achievements unlocked',
                        value: 'achievements',
                        emoji: '🏆'
                    }
                );

            const selectRow = new ActionRowBuilder().addComponents(selectMenu);

            const buttonRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('lb_global')
                        .setLabel('global')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('🌍'),
                    new ButtonBuilder()
                        .setCustomId('lb_server')
                        .setLabel('server')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('🏠')
                        .setDisabled(!serverId)
                );

            const embed = createLeaderboardEmbed(leaderboards, currentScope, currentType, interaction);
            const message = await interaction.editReply({ 
                embeds: [embed], 
                components: [selectRow, buttonRow] 
            });

            const collector = message.createMessageComponentCollector({ 
                time: 120000 
            });

            collector.on('collect', async (componentInteraction) => {
                if (componentInteraction.user.id !== interaction.user.id) {
                    return componentInteraction.reply({ 
                        content: privateButtonReplies(), 
                        ephemeral: true 
                    });
                }

                await componentInteraction.deferUpdate();

                if (componentInteraction.isStringSelectMenu()) {
                    currentType = componentInteraction.values[0];
                } else if (componentInteraction.isButton()) {
                    if (componentInteraction.customId === 'lb_global') {
                        currentScope = 'global';
                    } else if (componentInteraction.customId === 'lb_server') {
                        currentScope = 'server';
                    }
                }

                try {
                    const newLeaderboards = await fetchLeaderboards(interaction, currentScope, serverId);

                    const newButtonRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('lb_global')
                                .setLabel('global')
                                .setStyle(currentScope === 'global' ? ButtonStyle.Primary : ButtonStyle.Secondary)
                                .setEmoji('🌍'),
                            new ButtonBuilder()
                                .setCustomId('lb_server')
                                .setLabel('server')
                                .setStyle(currentScope === 'server' ? ButtonStyle.Primary : ButtonStyle.Secondary)
                                .setEmoji('🏠')
                                .setDisabled(!serverId)
                        );

                    const newEmbed = createLeaderboardEmbed(newLeaderboards, currentScope, currentType, interaction);
                    await componentInteraction.editReply({ 
                        embeds: [newEmbed], 
                        components: [selectRow, newButtonRow] 
                    });
                } catch (error) {
                    console.error('Error updating leaderboard:', error);
                }
            });

            collector.on('end', async () => {
                try {
                    const disabledSelectMenu = new StringSelectMenuBuilder()
                        .setCustomId('lb_select_disabled')
                        .setPlaceholder('choose leaderboard type')
                        .setDisabled(true)
                        .addOptions(
                            {
                                label: 'personal button clicks',
                                value: 'personal_buttons',
                                emoji: '🔘'
                            }
                        );

                    const disabledSelectRow = new ActionRowBuilder().addComponents(disabledSelectMenu);

                    const disabledButtonRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('lb_global_disabled')
                                .setLabel('global')
                                .setStyle(ButtonStyle.Secondary)
                                .setEmoji('🌍')
                                .setDisabled(true),
                            new ButtonBuilder()
                                .setCustomId('lb_server_disabled')
                                .setLabel('server')
                                .setStyle(ButtonStyle.Secondary)
                                .setEmoji('🏠')
                                .setDisabled(true)
                        );

                    await interaction.editReply({ 
                        components: [disabledSelectRow, disabledButtonRow] 
                    });
                } catch (error) {
                    console.error('Error disabling components:', error);
                }
            });

        } catch (error) {
            console.error('Error fetching leaderboards:', error);
            await interaction.editReply({ 
                content: 'couldnt load the leaderboards sorry',
                components: []
            });
        }
    }
};

async function fetchLeaderboards(interaction, scope, serverId) {
    const leaderboards = {
        personalButtons: [],
        serverButtons: [],
        achievements: []
    };

    try {
        if (scope === 'global') {
            const personalData = await getLeaderboardPersonalButtons(10);
            
            for (const entry of personalData) {
                try {
                    const user = await interaction.client.users.fetch(entry.reference_id);
                    leaderboards.personalButtons.push({
                        name: user.username,
                        id: entry.reference_id,
                        count: entry.count
                    });
                } catch (err) {
                    leaderboards.personalButtons.push({
                        name: 'unknown user',
                        id: entry.reference_id,
                        count: entry.count
                    });
                }
            }

            const serverData = await getLeaderboardServerButtons(10);
            
            for (const entry of serverData) {
                try {
                    const guild = await interaction.client.guilds.fetch(entry.reference_id);
                    leaderboards.serverButtons.push({
                        name: guild.name,
                        id: entry.reference_id,
                        count: entry.count
                    });
                } catch (err) {
                    leaderboards.serverButtons.push({
                        name: 'unknown server',
                        id: entry.reference_id,
                        count: entry.count
                    });
                }
            }

            const achievementData = await getLeaderboardAchievements(10);
            
            for (const entry of achievementData) {
                try {
                    const user = await interaction.client.users.fetch(entry.user_id);
                    leaderboards.achievements.push({
                        name: user.username,
                        id: entry.user_id,
                        count: entry.count
                    });
                } catch (err) {
                    leaderboards.achievements.push({
                        name: 'unknown user',
                        id: entry.user_id,
                        count: entry.count
                    });
                }
            }

        } else {
            const guild = interaction.guild;
            
            const memberIds = Array.from(guild.members.cache.keys());
            
            if (memberIds.length < 10) {
                try {
                    await guild.members.fetch({ limit: 100 });
                    memberIds.length = 0;
                    memberIds.push(...Array.from(guild.members.cache.keys()));
                } catch (err) {
                    console.error('Could not fetch additional members:', err);
                }
            }

            const personalData = await getServerPersonalButtons(memberIds, 10);
            
            for (const entry of personalData) {
                const member = guild.members.cache.get(entry.reference_id);
                leaderboards.personalButtons.push({
                    name: member ? member.user.username : 'unknown user',
                    id: entry.reference_id,
                    count: entry.count
                });
            }

            const serverButtonCount = await getButtonCount('server', serverId);
            if (serverButtonCount > 0) {
                leaderboards.serverButtons.push({
                    name: guild.name,
                    id: serverId,
                    count: serverButtonCount
                });
            }

            const achievementData = await getServerAchievements(memberIds, 10);
            
            for (const entry of achievementData) {
                const member = guild.members.cache.get(entry.user_id);
                leaderboards.achievements.push({
                    name: member ? member.user.username : 'unknown user',
                    id: entry.user_id,
                    count: entry.count
                });
            }
        }

    } catch (error) {
        console.error('Error fetching leaderboard data:', error);
    }

    return leaderboards;
}

function createLeaderboardEmbed(leaderboards, scope, type, interaction) {
    const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTimestamp();

    if (scope === 'server' && interaction.guild) {
        embed.setFooter({ text: interaction.guild.name });
    }

    let title, data, emoji;

    switch (type) {
        case 'personal_buttons':
            title = 'personal button clicks';
            data = leaderboards.personalButtons;
            emoji = '🔘';
            break;
        case 'server_buttons':
            title = 'server buttons';
            data = leaderboards.serverButtons;
            emoji = '🖥️';
            break;
        case 'achievements':
            title = 'achievements';
            data = leaderboards.achievements;
            emoji = '🏆';
            break;
    }

    embed.setTitle(`${emoji} ${scope === 'global' ? 'global' : 'server'} ${title} leaderboard`);

    if (data.length === 0) {
        embed.setDescription('no data available yet');
    } else {
        const medals = ['🥇', '🥈', '🥉'];
        const text = data
            .map((entry, index) => {
                const medal = index < 3 ? medals[index] : `${index + 1}.`;
                
                if (type === 'achievements') {
                    const plural = entry.count === 1 ? 'achievement' : 'achievements';
                    return `${medal} **${entry.name}** - ${entry.count} ${plural}`;
                } else if (type === 'server_buttons' && scope === 'server') {
                    return `${medal} **${entry.name}** - ${entry.count} clicks`;
                } else {
                    return `${medal} **${entry.name}** - ${entry.count} clicks`;
                }
            })
            .join('\n');
        
        embed.setDescription(text);
    }

    return embed;
}