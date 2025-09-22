const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { addWeenSpeakChannel, removeWeenSpeakChannel, checkUserAllowsPings } = require('../modules/db.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('weenspeak')
        .setDescription('manage weenspeak channels')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('add a channel for weenspeak')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('the channel to add')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('remove a channel from weenspeak')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('the channel to remove')
                        .setRequired(true)))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: 'no.', ephemeral: true });
        }
        
        if (!process.env.GEMINI_API_KEY) {
            return interaction.reply({
                content: "the bot's gemini api key isnt setup! if you are the owner of the bot, set it in your .env file to use weenspeak functionality",
                ephemeral: true
            });
        }
        
        const subcommand = interaction.options.getSubcommand();
        const channel = interaction.options.getChannel('channel');

        const userAllowsPings = await checkUserAllowsPings(interaction.user.id);
        const replyOptions = {
            ephemeral: !userAllowsPings
        };

        if (subcommand === 'add') {
            try {
                await addWeenSpeakChannel(channel.id);
                await interaction.reply({ 
                    content: `successfully added ${channel} as a weenspeak channel!`,
                    ...replyOptions
                });
                console.log(`added ${channel.id} to weenspeak channels`);
            } catch (error) {
                if (error.message.includes('already a weenspeak channel')) {
                    await interaction.reply({ 
                        content: `${channel} is already a weenspeak channel!`,
                        ...replyOptions
                    });
                } else {
                    console.error('error adding weenspeak channel:', error);
                    await interaction.reply({
                        content: 'an error occurred while adding the weenspeak channel srry man',
                        ...replyOptions
                    });
                }
                console.log(`failed to add ${channel.id} to weenspeak channels`);
            }
        } else if (subcommand === 'remove') {
            try {
                const removed = await removeWeenSpeakChannel(channel.id);
                if (removed) {
                    await interaction.reply({
                        content: `removed ${channel} from weenspeak channels!`,
                        ...replyOptions
                    });
                    console.log(`removed ${channel.id} from weenspeak channels`);
                } else {
                    await interaction.reply({
                        content: `${channel} was never a weenspeak channel in the first place dude.`,
                        ...replyOptions
                    });
                    console.log(`attempted to remove ${channel.id} but it wasn't a weenspeak channel`);
                }
            } catch (error) {
                console.error('error removing weenspeak channel:', error);
                await interaction.reply({
                    content: 'an error occurred while removing the weenspeak channel srry man',
                    ...replyOptions
                });
            }
        }
    }
};