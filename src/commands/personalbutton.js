const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getButtonCount, updateButtonCount, resetButtonCount } = require('../modules/db.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('personalbutton')
        .setDescription('your own personal button to press and count lol')
        .addSubcommand(subcommand =>
            subcommand
                .setName('show')
                .setDescription('show your personal button')
                .addBooleanOption(option =>
                    option.setName('ephemeral')
                        .setDescription('button only meant for your eyes!')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('reset')
                .setDescription('remove your count....')
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const userId = interaction.user.id;

        if (subcommand === 'reset') {
            try {
                await resetButtonCount(userId);
                await interaction.reply('rip your button count');
            } catch (error) {
                console.error('Error resetting button count:', error);
                await interaction.reply('sorry, couldnt reset your button (maybe thats a good thing)');
            }
        } else {
            try {
                const count = await getButtonCount(userId);
                
                const button = new ButtonBuilder()
                    .setCustomId('personal_button_click')
                    .setLabel(count.toString())
                    .setStyle(ButtonStyle.Primary);

                const row = new ActionRowBuilder()
                    .addComponents(button);

                const sent = await interaction.reply({
                    components: [row],
                    fetchReply: true,
                    ephemeral: interaction.options.getBoolean('ephemeral') || false
                });

                const collector = sent.createMessageComponentCollector({
                    filter: i => i.user.id === userId
                });

                collector.on('collect', async (buttonInteraction) => {
                    if (buttonInteraction.customId === 'personal_button_click') {
                        try {
                            const newCount = await updateButtonCount(userId);
                            
                            const updatedButton = new ButtonBuilder()
                                .setCustomId('personal_button_click')
                                .setLabel(newCount.toString())
                                .setStyle(ButtonStyle.Primary);

                            const updatedRow = new ActionRowBuilder()
                                .addComponents(updatedButton);

                            await buttonInteraction.update({
                                components: [updatedRow]
                            });
                        } catch (error) {
                            console.error('Error updating button count:', error);
                            await buttonInteraction.reply({
                                content: 'sorry, something went wrong updating your button',
                                ephemeral: true
                            });
                        }
                    }
                });

            } catch (error) {
                console.error('Error showing personal button:', error);
                await interaction.reply('yur button isnt buttoning');
            }
        }
    }
};