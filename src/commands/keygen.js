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
                            { name: 'Windows 95 Retail', value: 'win95' },
                            { name: 'Windows 95 OEM', value: 'win95oem' }
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
                .setDescription('validate a Windows 95 product key')
                .addStringOption(option =>
                    option.setName('key')
                        .setDescription('the key to validate')
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

function generateWin95OEMKey() {
    const first3 = Math.floor(Math.random() * 367);
    const first3Str = first3.toString().padStart(3, '0');
    
    const year = Math.floor(Math.random() * 90) + 4;
    const yearStr = year.toString().padStart(2, '0');
    
    let middle7;
    let sum;
    do {
        middle7 = [];
        sum = 0;
        for (let i = 0; i < 7; i++) {
            const digit = Math.floor(Math.random() * 10);
            middle7.push(digit);
            sum += digit;
        }
    } while (sum % 7 !== 0);
    
    const middle7Str = middle7.join('');
    
    const last5 = Math.floor(Math.random() * 100000);
    const last5Str = last5.toString().padStart(5, '0');
    
    return `${first3Str}${yearStr}-OEM-${middle7Str}-${last5Str}`;
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
        keyType: 'Retail',
        details: `all checks passed! sum: ${sum} (divisible by 7)`
    };
}

function validateWin95OEMKey(key) {
    key = key.trim().toUpperCase();

    const formatRegex = /^(\d{5})-OEM-(\d{7})-(\d{5})$/;
    const match = key.match(formatRegex);

    if (!match) {
        return {
            valid: false,
            reason: 'invalid format. expected: XXXXX-OEM-XXXXXXX-XXXXX (e.g., 12345-OEM-0123456-78901)'
        };
    }

    const first5 = match[1];
    const first3 = parseInt(first5.substring(0, 3));
    const year = parseInt(first5.substring(3, 5));
    const middle7 = match[2];
    const last5 = match[3];

    if (first3 > 366) {
        return {
            valid: false,
            reason: `first 3 digits must be 0-366, got ${first3}`
        };
    }

    if (year < 4 || year > 93) {
        return {
            valid: false,
            reason: `characters 4-5 must be 04-93 (year code), got ${year.toString().padStart(2, '0')}`
        };
    }

    const sum = middle7.split('').reduce((acc, digit) => acc + parseInt(digit), 0);
    if (sum % 7 !== 0) {
        return {
            valid: false,
            reason: `sum of middle 7 digits (${sum}) is not divisible by 7 (remainder: ${sum % 7})`
        };
    }

    return {
        valid: true,
        sum: sum,
        keyType: 'OEM',
        details: `all checks passed! day code: ${first3}, year: ${year.toString().padStart(2, '0')}, sum: ${sum} (divisible by 7)`
    };
}

function detectAndValidateKey(key) {
    key = key.trim().toUpperCase();
    
    if (key.includes('-OEM-')) {
        return validateWin95OEMKey(key);
    } else {
        return validateWin95Key(key);
    }
}

async function handleGenerate(interaction) {
    const type = interaction.options.getString('type') || 'win95';
    const count = interaction.options.getInteger('count') || 1;

    const keys = [];
    const keyTypeName = type === 'win95oem' ? 'Windows 95 OEM' : 'Windows 95 Retail';
    
    for (let i = 0; i < count; i++) {
        if (type === 'win95oem') {
            keys.push(generateWin95OEMKey());
        } else {
            keys.push(generateWin95Key());
        }
    }

    const embed = new EmbedBuilder()
        .setColor(0xb03000)
        .setTitle(`${keyTypeName} product key(s)`)
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
    const result = detectAndValidateKey(key);

    const embed = new EmbedBuilder()
        .setColor(0xb03000)
        .setTitle(`key validation: ${result.valid ? '✅ valid' : '❌ invalid'}`)
        .addFields({
            name: 'product key',
            value: `\`${key}\``,
            inline: false
        });

    if (result.valid) {
        embed.addFields(
            {
                name: 'type',
                value: result.keyType,
                inline: true
            },
            {
                name: 'details',
                value: result.details,
                inline: false
            }
        );
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