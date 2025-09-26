const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require('discord.js');
const { privateButtonReplies } = require('../modules/globals.js');
const { updateAchievementProgress } = require('../modules/achievements.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('bubblewrap')
		.setDescription('makes a board of spoilers that look like bubble wrap!')
		.addStringOption(option =>
			option.setName('poptext')
				.setDescription('text that should be spoilered')
				.setRequired(false))
		.addIntegerOption(option =>
			option.setName("rows")
				.setDescription("number of rows (max 25)")
				.setRequired(false)
				.setMinValue(1)
				.setMaxValue(25))
		.addIntegerOption(option =>
			option.setName("columns")
				.setDescription("number of columns (max 25)")
				.setRequired(false)
				.setMinValue(1)
				.setMaxValue(25))
		.addBooleanOption(option =>
		option.setName('ephemeral')
			.setDescription('bubble wrap only meant for your eyes!')
			.setRequired(false)),
	async execute(interaction) {
		let text = interaction.options.getString("poptext") || "      ";
		let rowsreal = interaction.options.getInteger("rows") || 6;
		let columnsreal = interaction.options.getInteger("columns") || 6;
    	let ephemeral = interaction.options.getBoolean("ephemeral") || false;

		if (text.length > 10) {
			return interaction.reply({ content: "text cant be 10 or more characters vro..", ephemeral: true });
		}

		function genBubblewrap(popText, rows, columns) {
			return(`||${popText}||`.repeat(columns)+"\n").repeat(rows).slice(0,-1)
		} // made by grad man™

		let bubblewrap = genBubblewrap(text,rowsreal,columnsreal);

		if (bubblewrap.length > 2000) {
			const result = await updateAchievementProgress(
				interaction.user.id,
				'BIG_BUBBLEWRAP',
				1,
				interaction
			);
			return interaction.reply({ content: "output bubble wrap is too long for Discord!", ephemeral: true });
		}

		const toCodeBlock = new ButtonBuilder()
			.setCustomId('to_codeblock')
			.setLabel('re-send as code block')
			.setStyle(ButtonStyle.Success);

		const toBubblewrap = new ButtonBuilder()
			.setCustomId('to_bubblewrap')
			.setLabel('re-send as bubblewrap')
			.setStyle(ButtonStyle.Primary);

		const rowCode = new ActionRowBuilder().addComponents(toCodeBlock);
		const rowBubble = new ActionRowBuilder().addComponents(toBubblewrap);

		const sent = await interaction.reply({
			content: bubblewrap,
			components: [rowCode],
			fetchReply: true,
			ephemeral: ephemeral
		});

		const collector = sent.createMessageComponentCollector({
			filter: i => i.user.id === interaction.user.id
		});

		collector.on('collect', async (confirmation) => {
			if (confirmation.user.id !== interaction.user.id) {
				return confirmation.reply({ content: privateButtonReplies(), ephemeral: true });
			}

			if (confirmation.customId === 'to_codeblock') {
				await confirmation.update({
					content: "```" + bubblewrap + "```",
					components: [rowBubble]
				});
			} else if (confirmation.customId === 'to_bubblewrap') {
				await confirmation.update({
					content: bubblewrap,
					components: [rowCode]
				});
			}
		});

		collector.on('end', () => {
			console.log('collector stopped after 60s');
		});
	},
};
