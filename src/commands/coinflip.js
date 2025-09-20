const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('coinflip')
		.setDescription('flip a coin'),
	async execute(interaction) {
		const result = Math.random() < 0.5 ? 'heads' : 'tails';
		await interaction.reply(`${interaction.user} flipped a coin and got **${result}**! 🪙`);
	},
};
