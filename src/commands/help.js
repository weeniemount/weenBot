const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder({ integration_types: [0, 1], contexts: [0, 1, 2] })
        .setName('help')
        .setDescription('weenBot commands!'),
    async execute(interaction) {
        const guildId = process.env.DEV_GUILD_ID;
        
        const isInDM = !interaction.guild;
        const isDevGuild = interaction.guild && interaction.guild.id === guildId;
        
        const showDevCommands = isDevGuild && !isInDM;

        const fun = new ButtonBuilder()
            .setCustomId(`fun`)
            .setLabel(`fun stuff`)
            .setStyle(ButtonStyle.Primary);
        const useful = new ButtonBuilder()
            .setCustomId(`useful`)
            .setLabel(`useful`)
            .setStyle(ButtonStyle.Primary);

        const devcommands = new ButtonBuilder()
            .setCustomId(`devcommands`)
            .setLabel(`dev commands`)
            .setStyle(ButtonStyle.Primary);
        
        const adminstuff = new ButtonBuilder()
            .setCustomId(`adminstuff`)
            .setLabel(`admin stuff`)
            .setStyle(ButtonStyle.Primary);
        
        const backButton = new ButtonBuilder()
            .setCustomId('back')
            .setLabel('back')
            .setStyle(ButtonStyle.Secondary);
        
        const devrow = new ActionRowBuilder()
            .addComponents(fun, useful, devcommands);
        const row = new ActionRowBuilder()
            .addComponents(fun, useful);

        const helpembed = new EmbedBuilder()
            .setColor(0xb03000)
            .setTitle(`weenBot help`)
            .addFields(
                { name: 'choose a category!', value: 'press a button to display that category!' },
            )
        
        const updateInteraction = async (confirmation) => {
            const filter = i => i.user.id === confirmation.user.id;

            if (confirmation.user.id !== interaction.user.id) {
                return confirmation.reply({ content: 'These buttons are not for you!', ephemeral: true });
            }

            let collectorChannel;

            if (confirmation.channel) {
                collectorChannel = confirmation.channel;
            } else if (confirmation.guild) {
                collectorChannel = confirmation.guild.channels.cache.get(confirmation.channelId);
            }

            const collector = collectorChannel ? collectorChannel.createMessageComponentCollector({ filter }) : null;

            if (!collector) return;

            collector.on('collect', async confirmation => {
                if (confirmation.customId === 'fun') {
                    const helpinfoembed = new EmbedBuilder()
                        .setColor(0xb03000)
                        .setTitle(`fun category`)
                        .addFields({ name: `fun`, value: '/bubblewrap - make some spoiler bubble wrap!\n/button - a button to increment that can be personal, global or server count.\n/coinflip - flip a coin!\n/gary - get a picture of gary the cat!\n/goober - get a picture of goober the cat!\n/nuke - nuke someone out of boredom\n/roll - roll a dice from 1-6\n/slots - the slots\n/tictactoe - play tictactoe with someone (or weenBot)\n/weenie - send a weenie\n/randompissandshitimage - send a random pissandshitimages image'})
                    await confirmation.update({ embeds: [helpinfoembed], components: [new ActionRowBuilder().addComponents(backButton)] });
                } else if (confirmation.customId === 'useful') {
                    const helpinfoembed = new EmbedBuilder()
                        .setColor(0xb03000)
                        .setTitle(`useful category`)
                        .addFields({ name: `useful`, value: '/achievements - view all your achievements\n/settings - customize your weenBot user settings\n/calculator - a calculator\n/stats - view your peak stats\n/gemini - ask gemini a question\n/help - the thing you are viewing right now\n/imagetools - image manipulation tools (speech bubble, gif converter, qr codes)\n/ping - check if weenBot is even responding\n/weenspeak - for server admins! set up/remove weenspeak for weenBot to yap in a channel\n/weenbotinfo - view some info about weenbot\n/leaderboard - weenBot global and server leaderboards!' })
                    await confirmation.update({ embeds: [helpinfoembed], components: [new ActionRowBuilder().addComponents(backButton)] });
                } else if (confirmation.customId === 'adminstuff') {
                    const helpinfoembed = new EmbedBuilder()
                        .setColor(0xb03000)
                        .setTitle(`admin stuff category`)
                        .addFields({ name: `admin stuff`, value: '/permissions - check what permissions weenBot has\n/regexfilter - basically discords automod regex filter thing but better ig' })
                    await confirmation.update({ embeds: [helpinfoembed], components: [new ActionRowBuilder().addComponents(backButton)] });
                } else if (confirmation.customId === 'devcommands') {
                    const helpinfoembed = new EmbedBuilder()
                        .setColor(0xb03000)
                        .setTitle(`dev commands category`)
                        .addFields({ name: `dev commands`, value: '/restart - restart weenBot. this will only work if ran with PM2.' })
                    await confirmation.update({ embeds: [helpinfoembed], components: [new ActionRowBuilder().addComponents(backButton)] });
                } else if (confirmation.customId === 'back') {
                    const currentIsInDM = !confirmation.guild;
                    const currentIsDevGuild = confirmation.guild && confirmation.guild.id === guildId;
                    const currentShowDevCommands = currentIsDevGuild && !currentIsInDM;
                    
                    await confirmation.update({ embeds: [helpembed], components: [currentShowDevCommands ? devrow : row] });
                }
            });
        }

        const replyOptions = { embeds: [helpembed], components: [showDevCommands ? devrow : row] };

        await interaction.reply(replyOptions);
        updateInteraction(interaction);
    },
};