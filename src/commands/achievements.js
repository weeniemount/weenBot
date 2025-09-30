const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getUserAchievements, ACHIEVEMENTS, updateAchievementProgress } = require('../modules/achievements.js');
const { emojiTable, privateButtonReplies } = require('../modules/globals.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('achievements')
        .setDescription('view your achievements')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('view someone else perhaps?')
                .setRequired(false)),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        
        try {
            const { unlocked, tracking } = await getUserAchievements(targetUser.id);
            
            const allAchievements = Object.values(ACHIEVEMENTS);
            const unlockedIds = unlocked.map(achievement => achievement.id);
            const lockedAchievements = allAchievements.filter(achievement => !unlockedIds.includes(achievement.id));

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`achievements_unlocked_${targetUser.id}`)
                        .setLabel('unlocked')
                        .setStyle(ButtonStyle.Success)
                        .setEmoji(emojiTable["weenachievement"]),
                    new ButtonBuilder()
                        .setCustomId(`achievements_locked_${targetUser.id}`)
                        .setLabel('locked')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('🔒')
                );

            const unlockedEmbed = createUnlockedEmbed(targetUser, unlocked);

            await interaction.reply({ 
                embeds: [unlockedEmbed], 
                components: [row] 
            });

            if (interaction.options.getUser('user') == interaction.client.user.id) {
                const result = await updateAchievementProgress(
                    interaction.user.id,
                    'ACHIEVEMENT_ACHIEVEMENT',
                    1,
                    interaction
                );
            }

            const filter = (buttonInteraction) => {
                return buttonInteraction.customId.startsWith('achievements_') && 
                       buttonInteraction.customId.endsWith(`_${targetUser.id}`);
            };

            const collector = interaction.channel.createMessageComponentCollector({ filter });

            collector.on('collect', async (buttonInteraction) => {
                if (buttonInteraction.user.id !== interaction.user.id) {
                    return buttonInteraction.reply({ content: privateButtonReplies(), ephemeral: true });
                }
                if (buttonInteraction.customId.includes('unlocked')) {
                    const embed = createUnlockedEmbed(targetUser, unlocked);
                    
                    const newRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`achievements_unlocked_${targetUser.id}`)
                                .setLabel('unlocked')
                                .setStyle(ButtonStyle.Success)
                                .setEmoji(emojiTable["weenachievement"]),
                            new ButtonBuilder()
                                .setCustomId(`achievements_locked_${targetUser.id}`)
                                .setLabel('locked')
                                .setStyle(ButtonStyle.Secondary)
                                .setEmoji('🔒')
                        );

                    await buttonInteraction.update({ 
                        embeds: [embed], 
                        components: [newRow] 
                    });
                } else if (buttonInteraction.customId.includes('locked')) {
                    const embed = createLockedEmbed(targetUser, lockedAchievements, tracking);
                    
                    const newRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`achievements_unlocked_${targetUser.id}`)
                                .setLabel('unlocked')
                                .setStyle(ButtonStyle.Secondary)
                                .setEmoji(emojiTable["weenachievement"]),
                            new ButtonBuilder()
                                .setCustomId(`achievements_locked_${targetUser.id}`)
                                .setLabel('locked')
                                .setStyle(ButtonStyle.Success)
                                .setEmoji('🔒')
                        );

                    await buttonInteraction.update({ 
                        embeds: [embed], 
                        components: [newRow] 
                    });
                }
            });            
        } catch (error) {
            console.error('Error fetching achievements:', error);
            await interaction.reply({ 
                content: 'i lost them achievements sorry try again',
                ephemeral: true 
            });
        }
    }
};

function createUnlockedEmbed(targetUser, unlocked) {
    const embed = new EmbedBuilder()
        .setColor(0xFFD700) // gold color
        .setTitle(`${targetUser.username}'s achievements`)
        .setThumbnail(targetUser.displayAvatarURL())
        .setTimestamp();

    if (unlocked.length > 0) {
        const unlockedText = unlocked
            .map(achievement => `<:weenachievement:${emojiTable["weenachievement"]}> **${achievement.name}**\n${achievement.description}`)
            .join('\n\n');
        embed.addFields({ name: `unlocked achievements (${unlocked.length})`, value: unlockedText });
    } else {
        embed.setDescription('you dont got any of em');
    }

    return embed;
}

function createLockedEmbed(targetUser, lockedAchievements, tracking) {
    const embed = new EmbedBuilder()
        .setColor(0x808080)
        .setTitle(`${targetUser.username}'s achievements`)
        .setThumbnail(targetUser.displayAvatarURL())
        .setTimestamp();

    if (lockedAchievements.length > 0) {
        const lockedText = lockedAchievements
            .map(achievement => {
                return `🔒 **${achievement.name}**\n${achievement.description}`;
            })
            .join('\n\n');
        embed.addFields({ name: `locked achievements (${lockedAchievements.length})`, value: lockedText });
    } else {
        embed.setDescription('theres none of em you havent got yet lol');
    }

    return embed;
}