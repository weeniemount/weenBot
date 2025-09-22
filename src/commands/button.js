const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getButtonCount, updateButtonCount, resetButtonCount, getUserSettings } = require('../modules/db.js');
const { privateButtonReplies } = require('../modules/globals.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('button')
        .setDescription('buttons to press and count!')
        .addSubcommand(subcommand =>
            subcommand
                .setName('personal')
                .setDescription('show your personal button')
                .addBooleanOption(option =>
                    option.setName('ephemeral')
                        .setDescription('button only meant for your eyes!')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('server')
                .setDescription('show the server button that everyone can press')
                .addBooleanOption(option =>
                    option.setName('ephemeral')
                        .setDescription('button only meant for your eyes!')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('global')
                .setDescription('show the global button that everyone across all servers can press')
                .addBooleanOption(option =>
                    option.setName('ephemeral')
                        .setDescription('button only meant for your eyes!')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('reset')
                .setDescription('reset your personal button count')
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const userId = interaction.user.id;
        const serverId = interaction.guild?.id;

        if (subcommand === 'reset') {
            try {
                await resetButtonCount('personal', userId);
                await interaction.reply('rip your personal button count');
            } catch (error) {
                console.error('Error resetting personal button count:', error);
                await interaction.reply('sorry, couldnt reset your button (maybe thats a good thing)');
            }
            return;
        }

        try {
            let buttonType, referenceId, buttonDescription;
            
            switch (subcommand) {
                case 'personal':
                    buttonType = 'personal';
                    referenceId = userId;
                    buttonDescription = 'your personal button';
                    break;
                case 'server':
                    if (!serverId) {
                        await interaction.reply('server buttons can only be used in servers!');
                        return;
                    }
                    buttonType = 'server';
                    referenceId = serverId;
                    break;
                case 'global':
                    buttonType = 'global';
                    referenceId = 'global';
                    break;
            }

            const count = await getButtonCount(buttonType, referenceId);
            
            let buttonColor = 'Primary';
            if (buttonType === 'personal') {
                const settings = await getUserSettings(userId);
                buttonColor = settings.button_color;
            }
            
            const getButtonStyle = (colorString) => {
                switch (colorString) {
                    case 'Primary': return ButtonStyle.Primary;
                    case 'Secondary': return ButtonStyle.Secondary;
                    case 'Success': return ButtonStyle.Success;
                    case 'Danger': return ButtonStyle.Danger;
                    default: return ButtonStyle.Primary;
                }
            };
            
            const button = new ButtonBuilder()
                .setCustomId(`${buttonType}_button_click`)
                .setLabel(`${count}`)
                .setStyle(getButtonStyle(buttonColor));

            const row = new ActionRowBuilder()
                .addComponents(button);

            const sent = await interaction.reply({
                components: [row],
                flags: interaction.options.getBoolean('ephemeral') ? 64 : undefined
            }).then(() => interaction.fetchReply());

            const collector = sent.createMessageComponentCollector();

            collector.on('collect', async (buttonInteraction) => {
                if (buttonInteraction.customId === `${buttonType}_button_click`) {
                    try {
                        if (buttonType === 'personal' && buttonInteraction.user.id !== userId) {
                            await buttonInteraction.reply({
                                content: privateButtonReplies(),
                                ephemeral: true
                            });
                            return;
                        }
                        const clickerId = buttonInteraction.user.id;
                        const newCount = await updateButtonCount(buttonType, referenceId);
                        
                        let updatedButtonColor = 'Primary';
                        if (buttonType === 'personal' && clickerId === userId) {
                            const updatedSettings = await getUserSettings(userId);
                            updatedButtonColor = updatedSettings.button_color;
                        }
                        
                        const updatedButton = new ButtonBuilder()
                            .setCustomId(`${buttonType}_button_click`)
                            .setLabel(`${newCount}`)
                            .setStyle(getButtonStyle(updatedButtonColor));

                        const updatedRow = new ActionRowBuilder()
                            .addComponents(updatedButton);

                        await buttonInteraction.update({
                            components: [updatedRow]
                        });
                    } catch (error) {
                        console.error('Error updating button count:', error);
                        await buttonInteraction.reply({
                            content: 'sorry, something went wrong updating the button',
                            ephemeral: true
                        });
                    }
                }
            });

        } catch (error) {
            console.error('Error showing button:', error);
            await interaction.reply('your button isnt buttoning');
        }
    }
};