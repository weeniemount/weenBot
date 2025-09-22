const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { privateButtonReplies } = require('../modules/globals.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('calculator')
        .setDescription('open a simple calculator')
        .addBooleanOption(option =>
            option.setName('ephemeral')
                .setDescription('make the calculator private to you')
                .setRequired(false)),

    async execute(interaction) {
        const ephemeral = interaction.options.getBoolean('ephemeral') || false;
        let display = '0';
        let firstNumber = null;
        let operation = null;
        let newNumber = true;

        function createCalculatorButtons() {
            const rows = [];
            const buttons = [
                ['7', '8', '9', '÷'],
                ['4', '5', '6', '×'],
                ['1', '2', '3', '-'],
                ['C', '0', '=', '+']
            ];

            buttons.forEach(rowButtons => {
                const row = new ActionRowBuilder();
                rowButtons.forEach(button => {
                    const style = isNaN(button) ? 
                        (button === 'C' ? ButtonStyle.Danger : ButtonStyle.Primary) : 
                        ButtonStyle.Secondary;
                    row.addComponents(
                        new ButtonBuilder()
                            .setCustomId(`calc_${button}`)
                            .setLabel(button)
                            .setStyle(style)
                    );
                });
                rows.push(row);
            });
            return rows;
        }

        function calculate(a, b, op) {
            a = parseFloat(a);
            b = parseFloat(b);
            switch(op) {
                case '+': return a + b;
                case '-': return a - b;
                case '×': return a * b;
                case '÷': return b !== 0 ? a / b : 'error';
                default: return b;
            }
        }

        const message = await interaction.reply({
            content: '\`\`\`\n' + display + '\n\`\`\`',
            components: createCalculatorButtons(),
            ephemeral: ephemeral,
            fetchReply: true
        });

        const collector = message.createMessageComponentCollector();

        collector.on('collect', async i => {
            if (i.user.id !== interaction.user.id) {
                await i.reply({ content: privateButtonReplies(), ephemeral: true });
                return;
            }

            const button = i.customId.replace('calc_', '');

            if (button === 'C') {
                display = '0';
                firstNumber = null;
                operation = null;
                newNumber = true;
            }
            else if ('+-×÷'.includes(button)) {
                if (firstNumber === null) {
                    firstNumber = display;
                } else if (!newNumber) {
                    const result = calculate(firstNumber, display, operation);
                    firstNumber = result.toString();
                    display = result.toString();
                }
                operation = button;
                newNumber = true;
            }
            else if (button === '=') {
                if (firstNumber !== null && !newNumber) {
                    display = calculate(firstNumber, display, operation).toString();
                    firstNumber = null;
                    operation = null;
                    newNumber = true;
                }
            }
            else { // number
                if (newNumber) {
                    display = button;
                    newNumber = false;
                } else {
                    if (display === '0') {
                        display = button;
                    } else {
                        display += button;
                    }
                }
            }

            if (display.length > 15) {
                display = display.substring(0, 15);
            }

            await i.update({
                content: '\`\`\`\n' + display + '\n\`\`\`',
                components: createCalculatorButtons()
            });
        });

        collector.on('end', () => {
            const disabledButtons = createCalculatorButtons().map(row => {
                row.components.forEach(button => button.setDisabled(true));
                return row;
            });

            interaction.editReply({
                content: '\`\`\`\n' + display + '\n\`\`\`',
                components: disabledButtons
            }).catch(console.error);
        });
    }
};