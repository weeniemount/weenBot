const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { 
    addRegexFilter,
    removeRegexFilter,
    updateRegexFilter,
    getServerRegexFilters,
    getAllRegexFilters
} = require('../modules/db.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('regexfilter')
        .setDescription('manage regex filters for automatic message deletion')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('add a new regex filter')
                .addStringOption(option =>
                    option
                        .setName('pattern')
                        .setDescription('the regex pattern to filter')
                        .setRequired(true))
                .addStringOption(option =>
                    option
                        .setName('name')
                        .setDescription('a name for this filter')
                        .setRequired(true))
                .addStringOption(option =>
                    option
                        .setName('action')
                        .setDescription('action to take when matched')
                        .setRequired(false)
                        .addChoices(
                            { name: 'delete', value: 'delete' },
                            { name: 'delete + warn', value: 'warn' },
                            { name: 'delete + timeout', value: 'timeout' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('remove a regex filter')
                .addIntegerOption(option =>
                    option
                        .setName('id')
                        .setDescription('the filter id to remove')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('update')
                .setDescription('update an existing regex filter')
                .addIntegerOption(option =>
                    option
                        .setName('id')
                        .setDescription('the filter id to update')
                        .setRequired(true))
                .addStringOption(option =>
                    option
                        .setName('pattern')
                        .setDescription('new regex pattern')
                        .setRequired(false))
                .addStringOption(option =>
                    option
                        .setName('name')
                        .setDescription('new name')
                        .setRequired(false))
                .addStringOption(option =>
                    option
                        .setName('action')
                        .setDescription('new action')
                        .setRequired(false)
                        .addChoices(
                            { name: 'delete', value: 'delete' },
                            { name: 'delete + warn', value: 'warn' },
                            { name: 'delete + timeout', value: 'timeout' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('list all active regex filters')),

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: 'you need administrator permissions to manage regex filters',
                ephemeral: true
            });
        }

        const botMember = interaction.guild.members.me;
        const hasPerms = botMember.permissions.has(PermissionFlagsBits.ManageMessages);
        
        if (!hasPerms && interaction.options.getSubcommand() !== 'list') {
            return interaction.reply({
                content: 'warning: i dont have the "manage messages" permission.\n\nyou can still configure filters, but they wont work until you give me that permission.',
                ephemeral: true
            });
        }

        await interaction.deferReply({ ephemeral: true });

        const subcommand = interaction.options.getSubcommand();
        const serverId = interaction.guild.id;

        try {
            switch (subcommand) {
                case 'add':
                    await handleAdd(interaction, serverId);
                    break;
                case 'remove':
                    await handleRemove(interaction, serverId);
                    break;
                case 'update':
                    await handleUpdate(interaction, serverId);
                    break;
                case 'list':
                    await handleList(interaction, serverId);
                    break;
            }
        } catch (error) {
            console.error('Error executing regexfilter command:', error);
            await interaction.editReply({
                content: 'an error occurred while processing your request'
            });
        }
    }
};

async function handleAdd(interaction, serverId) {
    const pattern = interaction.options.getString('pattern');
    const name = interaction.options.getString('name');
    const action = interaction.options.getString('action') || 'delete';

    try {
        new RegExp(pattern, 'i');
    } catch (error) {
        return interaction.editReply({
            content: `invalid regex pattern: ${error.message}`
        });
    }

    try {
        const filter = await addRegexFilter(serverId, pattern, name, action);

        const embed = new EmbedBuilder()
            .setColor(0x57F287)
            .setTitle('✅ regex filter added')
            .addFields(
                { name: 'id', value: `${filter.id}`, inline: true },
                { name: 'name', value: name, inline: true },
                { name: 'action', value: action, inline: true },
                { name: 'pattern', value: `\`${pattern}\`` }
            )
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        await interaction.editReply({
            content: `failed to add filter: ${error.message}`
        });
    }
}

async function handleRemove(interaction, serverId) {
    const filterId = interaction.options.getInteger('id');

    try {
        const removed = await removeRegexFilter(serverId, filterId);

        if (!removed) {
            return interaction.editReply({
                content: 'filter not found or already removed'
            });
        }

        const embed = new EmbedBuilder()
            .setColor(0xED4245)
            .setTitle('🗑️ regex filter removed')
            .setDescription(`filter id ${filterId} has been removed`)
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        await interaction.editReply({
            content: `failed to remove filter: ${error.message}`
        });
    }
}

async function handleUpdate(interaction, serverId) {
    const filterId = interaction.options.getInteger('id');
    const newPattern = interaction.options.getString('pattern');
    const newName = interaction.options.getString('name');
    const newAction = interaction.options.getString('action');

    if (!newPattern && !newName && !newAction) {
        return interaction.editReply({
            content: 'you must provide at least one field to update'
        });
    }

    if (newPattern) {
        try {
            new RegExp(newPattern, 'i');
        } catch (error) {
            return interaction.editReply({
                content: `invalid regex pattern: ${error.message}`
            });
        }
    }

    try {
        const updates = {};
        if (newPattern) updates.pattern = newPattern;
        if (newName) updates.name = newName;
        if (newAction) updates.action = newAction;

        const filter = await updateRegexFilter(serverId, filterId, updates);

        if (!filter) {
            return interaction.editReply({
                content: 'filter not found'
            });
        }

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('✏️ regex filter updated')
            .addFields(
                { name: 'id', value: `${filter.id}`, inline: true },
                { name: 'name', value: filter.name, inline: true },
                { name: 'action', value: filter.action, inline: true },
                { name: 'pattern', value: `\`${filter.pattern}\`` }
            )
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        await interaction.editReply({
            content: `failed to update filter: ${error.message}`
        });
    }
}

async function handleList(interaction, serverId) {
    try {
        const filters = await getServerRegexFilters(serverId);

        if (filters.length === 0) {
            return interaction.editReply({
                content: 'no regex filters configured for this server'
            });
        }

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('📋 active regex filters')
            .setDescription(`total filters: ${filters.length}`)
            .setTimestamp();

        for (const filter of filters.slice(0, 10)) {
            const actionEmoji = {
                'delete': '🗑️',
                'warn': '⚠️',
                'timeout': '⏰'
            }[filter.action] || '🗑️';

            embed.addFields({
                name: `${actionEmoji} ${filter.name} (ID: ${filter.id})`,
                value: `\`\`\`${filter.pattern}\`\`\``,
                inline: false
            });
        }

        if (filters.length > 10) {
            embed.setFooter({ text: `showing 10 of ${filters.length} filters` });
        }

        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        await interaction.editReply({
            content: `failed to list filters: ${error.message}`
        });
    }
}