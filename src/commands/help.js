const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('weenBot commands!'),
	async execute(interaction) {
        const currentserverid = message.guild.id
        const guildId = process.env.DEV_GUILD_ID;

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
                        .addFields({ name: `fun`, value: 'TBD'})
                    await confirmation.update({ embeds: [helpinfoembed], components: [new ActionRowBuilder().addComponents(backButton)] });
                } else if (confirmation.customId === 'useful') {
                    const helpinfoembed = new EmbedBuilder()
                        .setColor(0xb03000)
                        .setTitle(`useful category`)
                        .addFields({ name: `useful`, value: 'TBD' })
                    await confirmation.update({ embeds: [helpinfoembed], components: [new ActionRowBuilder().addComponents(backButton)] });
                } else if (confirmation.customId === 'devcommands') {
                    const helpinfoembed = new EmbedBuilder()
                        .setColor(0xb03000)
                        .setTitle(`dev commands category`)
                        .addFields({ name: `dev commands`, value: 'TBD' })
                    await confirmation.update({ embeds: [helpinfoembed], components: [new ActionRowBuilder().addComponents(backButton)] });
                } else if (confirmation.customId === 'back') {
                    await confirmation.update({ embeds: [helpembed], components: [currentserverid == guildId ? devrow : row], ephemeral: true });
                }
            });
        }
        await interaction.reply({ embeds: [helpembed], components: [currentserverid == guildId ? devrow : row], ephemeral: true });
        updateInteraction(interaction);
	},
};