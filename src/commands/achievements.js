const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUserAchievements, ACHIEVEMENTS } = require('../modules/achievements.js');

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
            
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle(`${targetUser.username}'s achievements`)
                .setThumbnail(targetUser.displayAvatarURL())
                .setTimestamp();

            if (unlocked.length > 0) {
                const unlockedText = unlocked
                    .map(achievement => `🏆 **${achievement.name}**\n${achievement.description}`)
                    .join('\n\n');
                embed.addFields({ name: 'unlocked achievements', value: unlockedText });
            }

            const inProgress = Object.entries(tracking)
                .filter(([id, progress]) => !unlocked.find(a => a.id === id))
                .map(([id, progress]) => {
                    const achievement = ACHIEVEMENTS[id];
                    if (!achievement) return null;
                    return `🔄 **${achievement.name}**\nprogress: ${progress}/${achievement.requiredProgress}`;
                })
                .filter(text => text !== null);

            if (inProgress.length > 0) {
                embed.addFields({ name: 'achievements in progress', value: inProgress.join('\n\n') });
            }

            if (unlocked.length === 0 && inProgress.length === 0) {
                embed.setDescription('you dont got any of em');
            }

            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error fetching achievements:', error);
            await interaction.reply({ 
                content: 'i lost them achievements sorry try again',
                ephemeral: true 
            });
        }
    }
};