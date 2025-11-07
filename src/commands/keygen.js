/*
this code is educational so microsoft or whatever please dont kill me :cry:
and like windows 95 is discontinued and isnt used anywhere today probably
kay thanks
*/

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder({ integration_types: [0, 1], contexts: [0, 1, 2] })
        .setName('keygen')
        .setDescription('generate or validate Windows 95 product keys')
        .addSubcommand(subcommand =>
            subcommand
                .setName('generate')
                .setDescription('generate a valid product key')
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('type of product key to generate')
                        .setRequired(false)
                        .addChoices(
                            { name: 'Windows 95', value: 'win95' }
                        ))
                .addIntegerOption(option =>
                    option.setName('count')
                        .setDescription('number of keys to generate (1-10)')
                        .setRequired(false)
                        .setMinValue(1)
                        .setMaxValue(10)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('validate')
                .setDescription('validate a Windows 95 retail product key')
                .addStringOption(option =>
                    option.setName('key')
                        .setDescription('the key to validate (format: XXX-XXXXXXX)')
                        .setRequired(true))),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'generate') {
            await handleGenerate(interaction);
        } else if (subcommand === 'validate') {
            await handleValidate(interaction);
        }
    },
};

function generateWin95Key() {
    const forbidden = [333, 444, 555, 666, 777, 888, 999];
    let first3;
    do {
        first3 = Math.floor(Math.random() * 1000);
    } while (forbidden.includes(first3));

    let last7;
    let sum;
    do {
        last7 = [];
        sum = 0;
        for (let i = 0; i < 7; i++) {
            const digit = Math.floor(Math.random() * 9);
            last7.push(digit);
            sum += digit;
        }
    } while (sum % 7 !== 0);

    const first3Str = first3.toString().padStart(3, '0');
    const last7Str = last7.join('');
    
    return `${first3Str}-${last7Str}`;
}

function validateWin95Key(key) {
    key = key.trim().toUpperCase();

    const formatRegex = /^(\d{3})-(\d{7})$/;
    const match = key.match(formatRegex);

    if (!match) {
        return {
            valid: false,
            reason: 'invalid format. expected: XXX-XXXXXXX (e.g., 123-4567890)'
        };
    }

    const first3 = parseInt(match[1]);
    const last7 = match[2];

    const forbidden = [333, 444, 555, 666, 777, 888, 999];
    if (forbidden.includes(first3)) {
        return {
            valid: false,
            reason: `first 3 digits cannot be ${first3} (forbidden values: 333, 444, 555, 666, 777, 888, 999)`
        };
    }

    for (let i = 0; i < last7.length; i++) {
        const digit = parseInt(last7[i]);
        if (digit > 8) {
            return {
                valid: false,
                reason: `digit at position ${i + 1} in the last 7 digits is ${digit}, but must be 0-8`
            };
        }
    }

    const sum = last7.split('').reduce((acc, digit) => acc + parseInt(digit), 0);
    if (sum % 7 !== 0) {
        return {
            valid: false,
            reason: `sum of last 7 digits (${sum}) is not divisible by 7 (remainder: ${sum % 7})`
        };
    }

    return {
        valid: true,
        sum: sum,
        details: `all checks passed! sum: ${sum} (divisible by 7)`
    };
}

async function handleGenerate(interaction) {
    const count = interaction.options.getInteger('count') || 1;

    const keys = [];
    for (let i = 0; i < count; i++) {
        keys.push(generateWin95Key());
    }

    const embed = new EmbedBuilder()
        .setColor(0xb03000)
        .setTitle('Windows 95 retail product key(s)')
        .setDescription(`generated ${count} valid key${count > 1 ? 's' : ''}:`)
        .addFields({
            name: 'key(s)',
            value: keys.map((key, i) => `\`${i + 1}. ${key}\``).join('\n'),
            inline: false
        })
        .setTimestamp();

    await interaction.reply({ embeds: [embed] });
}

async function handleValidate(interaction) {
    const key = interaction.options.getString('key');
    const result = validateWin95Key(key);

    const embed = new EmbedBuilder()
        .setColor(0xb03000)
        .setTitle(`key validation: ${result.valid ? '✅ valid' : '❌ invalid'}`)
        .addFields({
            name: 'product key',
            value: `\`${key}\``,
            inline: false
        });

    if (result.valid) {
        embed.addFields({
            name: 'details',
            value: result.details,
            inline: false
        });
    } else {
        embed.addFields({
            name: 'reason',
            value: result.reason,
            inline: false
        });
    }

    embed.setTimestamp();

    await interaction.reply({ embeds: [embed] });
}