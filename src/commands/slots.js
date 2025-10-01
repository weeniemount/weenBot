const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('slots')
		.setDescription('spin thy slot machine'),
	async execute(interaction) {
		const symbols = ['🍋', '🍊', '🍇', '🍉', '🍒', '7️⃣'];
		const reels = [
			symbols[Math.floor(Math.random() * symbols.length)],
			symbols[Math.floor(Math.random() * symbols.length)],
			symbols[Math.floor(Math.random() * symbols.length)]
		];

		let message = `🎰 ${reels.join(' | ')} 🎰`;

		if (reels[0] === reels[1] && reels[1] === reels[2]) {
			message += `\nyou freaking won money ey ey ey ey `;
		} else if ((reels[0] === reels[1]) || (reels[1] === reels[2])) {
			message += `\nnot a win but still 2 symbols!!!!!`;
		} else {
			message += `\nyou got nothing`;
		}

		const embed = new EmbedBuilder()
			.setTitle('the slots')
			.setDescription(message)
			.setColor(0xb03000);

		await interaction.reply({ embeds: [embed] });
	},
};