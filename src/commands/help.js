const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('weenBot commands!'),
	async execute(interaction) {
        const guildId = process.env.DEV_GUILD_ID;
        let currentserverid = null;

        if (interaction.guild) {
            currentserverid = interaction.guild.id;
        }

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
        
        const updateInteraction = async (interaction) => {
            const filter = i => i.user.id === interaction.user.id;
            const collector = interaction.channel.createMessageComponentCollector({ filter});

            collector.on('collect', async confirmation => {
                if (confirmation.customId === 'fun') {
                    const helpinfoembed = new EmbedBuilder()
                        .setColor(0xb03000)
                        .setTitle(`fun category`)
                        .addFields({ name: `fun`, value: '/bubblewrap - make some spoiler bubble wrap!\n/button - a button to increment that can be personal, global or server count.\n/coinflip - flip a coin!\n/gary - get a picture of gary the cat!\n/goober - get a picture of goober the cat!\n/nuke - nuke someone out of boredom\n/roll - roll a dice from 1-6\n/slots - the slots\n/tictactoe - play tictactoe with someone (or weenBot)\n/weenie - send a weenie'})
                    await confirmation.update({ embeds: [helpinfoembed], components: [new ActionRowBuilder().addComponents(backButton)] });
                } else if (confirmation.customId === 'useful') {
                    const helpinfoembed = new EmbedBuilder()
                        .setColor(0xb03000)
                        .setTitle(`useful category`)
                        .addFields({ name: `useful`, value: '/achievements - view all your achievements\n/settings - customize your weenBot user settings\n/calculator - a calculator\n/stats - view your peak stats\n/gemini - ask gemini a question\n/help - the thing you are viewing right now\n/ping - check if weenBot is even responding\n/weenspeak - for server admins! set up/remove weenspeak for weenBot to yap in a channel' })
                    await confirmation.update({ embeds: [helpinfoembed], components: [new ActionRowBuilder().addComponents(backButton)] });
                } else if (confirmation.customId === 'devcommands') {
                    const helpinfoembed = new EmbedBuilder()
                        .setColor(0xb03000)
                        .setTitle(`dev commands category`)
                        .addFields({ name: `dev commands`, value: '/restart - restart weenBot. this will only work if ran with PM2.' })
                    await confirmation.update({ embeds: [helpinfoembed], components: [new ActionRowBuilder().addComponents(backButton)] });
                } else if (confirmation.customId === 'back') {
                    await confirmation.update({ embeds: [helpembed], components: [currentserverid == guildId ? devrow : row] });
                }
            });
        }

        const replyOptions = { embeds: [helpembed], components: [currentserverid == guildId ? devrow : row] };

        await interaction.reply(replyOptions);
        updateInteraction(interaction);
	},
};