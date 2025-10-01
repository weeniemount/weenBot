const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('coinflip')
		.setDescription('flip a coin'),
	async execute(interaction) {
		const result = Math.random() < 0.5 ? 'heads' : 'tails';
		const embed = new EmbedBuilder()
			.setTitle('the coin')
			.setDescription(`${interaction.user} flipped a coin and got **${result}**! 🪙`)
			.setColor(0xb03000);

		await interaction.reply({ embeds: [embed] });
	},
};
