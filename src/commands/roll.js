const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('roll')
		.setDescription('roll thy dice (1-6)'),
	async execute(interaction) {
		const roll = Math.floor(Math.random() * 6) + 1;
		await interaction.reply(`🎲 **${roll}**`);
	},
};
