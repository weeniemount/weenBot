const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('roll')
		.setDescription('roll thy dice (1-6)'),
	async execute(interaction) {
		const roll = Math.floor(Math.random() * 6) + 1;
		const embed = new EmbedBuilder()
			.setTitle('the dice')
			.setDescription(`🎲 **${roll}**`)
			.setColor(0xb03000);

		await interaction.reply({ embeds: [embed] });
	},
};