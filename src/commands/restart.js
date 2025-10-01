const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('restart')
		.setDescription('restarts the bot (DEV COMMAND! GUILD SPECIFIC, ONLY WORKS IF YOU STARTED THE BOT WITH PM2.'),
	async execute(interaction) {
		if (interaction.user.id == ownerUserID) {
			await interaction.reply('brb');
			process.exit();
		} else {
			await interaction.reply('no');
		}
	},
};