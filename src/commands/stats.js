const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUserSettings } = require('../modules/db.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('view your bot usage statistics')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('user to view stats for (defaults to you)')
                .setRequired(false)),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        
        try {
            const userSettings = await getUserSettings(targetUser.id);
            
            const embed = new EmbedBuilder()
                .setColor(0xb03000)
                .setTitle(`${targetUser.username}'s stats`)
                .setThumbnail(targetUser.displayAvatarURL())
                .addFields(
                    {
                        name: '🔘 button stats',
                        value: `pressed ${userSettings.button_count || 0} times`,
                        inline: true
                    }
                )
                .setFooter({ text: 'stats tracked since joining' })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error fetching user stats:', error);
            await interaction.reply({ 
                content: 'the stats have been lost while i was trying to run back to discords api',
                ephemeral: true 
            });
        }
    }
};