const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getUserSettings, updateUserSettings } = require('../modules/db.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('settings')
        .setDescription('customize your weenBot experience'),

    async execute(interaction) {
        const userId = interaction.user.id;
        
        try {
            const settings = await getUserSettings(userId);
            
            const embed = new EmbedBuilder()
                .setTitle('⚙️ weenBot Settings')
                .setDescription('customize your weenBot experience below')
                .setColor(0xb03000)
                .addFields(
                    {
                        name: '🔔 bot pings',
                        value: settings.allow_pings ? '✅ Enabled' : '❌ Disabled',
                        inline: true
                    },
                    {
                        name: '🔘 button color',
                        value: `${getButtonEmoji(settings.button_color)} ${settings.button_color}`,
                        inline: true
                    },
                    {
                        name: '📊 button count',
                        value: settings.button_count?.toString() || '0',
                        inline: true
                    }
                )
                .setFooter({ 
                    text: `settings for ${interaction.user.username}`, 
                    iconURL: interaction.user.displayAvatarURL() 
                })
                .setTimestamp();

            const pingSelect = new StringSelectMenuBuilder()
                .setCustomId('settings_pings')
                .setPlaceholder('change ping settings')
                .addOptions([
                    {
                        label: 'enable Pings',
                        description: 'allow weenBot to ping you',
                        value: 'enable_pings',
                        emoji: '🔔'
                    },
                    {
                        label: 'disable Pings',
                        description: 'stop weenBot from pinging you',
                        value: 'disable_pings',
                        emoji: '🔕'
                    }
                ]);

            const colorSelect = new StringSelectMenuBuilder()
                .setCustomId('settings_button_color')
                .setPlaceholder('change button color')
                .addOptions([
                    {
                        label: 'Primary (Blue)',
                        value: 'Primary',
                        emoji: '🔵'
                    },
                    {
                        label: 'Secondary (Gray)',
                        value: 'Secondary',
                        emoji: '⚫'
                    },
                    {
                        label: 'Success (Green)',
                        value: 'Success',
                        emoji: '🟢'
                    },
                    {
                        label: 'Danger (Red)',
                        value: 'Danger',
                        emoji: '🔴'
                    }
                ]);

            const resetButton = new ButtonBuilder()
                .setCustomId('settings_reset')
                .setLabel('reset all settings')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🗑️');

            const row1 = new ActionRowBuilder().addComponents(pingSelect);
            const row2 = new ActionRowBuilder().addComponents(colorSelect);
            const row3 = new ActionRowBuilder().addComponents(resetButton);

            const message = await interaction.reply({
                embeds: [embed],
                components: [row1, row2, row3],
                ephemeral: true,
                fetchReply: true
            });

            const collector = message.createMessageComponentCollector({
                filter: i => i.user.id === userId
            });

            collector.on('collect', async (i) => {
                try {
                    if (i.isStringSelectMenu()) {
                        if (i.customId === 'settings_pings') {
                            const newPingSetting = i.values[0] === 'enable_pings';
                            await updateUserSettings(userId, { allow_pings: newPingSetting });
                            
                            await i.reply({
                                content: `${newPingSetting ? '🔔' : '🔕'} pings ${newPingSetting ? 'enabled' : 'disabled'}!`,
                                ephemeral: true
                            });
                        } else if (i.customId === 'settings_button_color') {
                            const newColor = i.values[0];
                            await updateUserSettings(userId, { button_color: newColor });
                            
                            await i.reply({
                                content: `${getButtonEmoji(newColor)} button color changed to ${newColor}!`,
                                ephemeral: true
                            });
                        }
                    } else if (i.isButton() && i.customId === 'settings_reset') {
                        await updateUserSettings(userId, { 
                            allow_pings: true, 
                            button_color: 'Primary' 
                        });
                        
                        await i.reply({
                            content: '🔄 all settings reset to default!',
                            ephemeral: true
                        });
                    }

                    const updatedSettings = await getUserSettings(userId);
                    const updatedEmbed = new EmbedBuilder()
                        .setTitle('⚙️ weenBot settings')
                        .setDescription('customize your weenBot experience below')
                        .setColor(updatedSettings.button_color === 'Primary' ? 0x5865F2 : 
                                 updatedSettings.button_color === 'Secondary' ? 0x4F545C :
                                 updatedSettings.button_color === 'Success' ? 0x57F287 :
                                 updatedSettings.button_color === 'Danger' ? 0xED4245 : 0x5865F2)
                        .addFields(
                            {
                                name: '🔔 Bot Pings',
                                value: updatedSettings.allow_pings ? '✅ Enabled' : '❌ Disabled',
                                inline: true
                            },
                            {
                                name: '🔘 Button Color',
                                value: `${getButtonEmoji(updatedSettings.button_color)} ${updatedSettings.button_color}`,
                                inline: true
                            },
                            {
                                name: '📊 Button Count',
                                value: updatedSettings.button_count?.toString() || '0',
                                inline: true
                            }
                        )
                        .setFooter({ 
                            text: `settings for ${interaction.user.username}`, 
                            iconURL: interaction.user.displayAvatarURL() 
                        })
                        .setTimestamp();

                    await interaction.editReply({
                        embeds: [updatedEmbed]
                    });

                } catch (error) {
                    console.error('Error handling settings interaction:', error);
                    await i.reply({
                        content: 'we lost your changes, oops. try again?',
                        ephemeral: true
                    });
                }
            });

            collector.on('end', async () => {
                try {
                    const disabledRows = [row1, row2, row3].map(row => {
                        const newRow = new ActionRowBuilder();
                        row.components.forEach(component => {
                            if (component.data.type === 3) {
                                newRow.addComponents(
                                    StringSelectMenuBuilder.from(component).setDisabled(true)
                                );
                            } else if (component.data.type === 2) {
                                newRow.addComponents(
                                    ButtonBuilder.from(component).setDisabled(true)
                                );
                            }
                        });
                        return newRow;
                    });

                    await interaction.editReply({
                        components: disabledRows
                    });
                } catch (error) {
                    console.error('Error disabling components:', error);
                }
            });

        } catch (error) {
            console.error('Error executing settings command:', error);
            await interaction.reply({
                content: 'we lost them settings. try again lol',
                ephemeral: true
            });
        }
    }
};

function getButtonEmoji(color) {
    switch (color) {
        case 'Primary': return '🔵';
        case 'Secondary': return '⚫';
        case 'Success': return '🟢';
        case 'Danger': return '🔴';
        default: return '🔵';
    }
}