const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('gary')
		.setDescription('send a picture of gary the cat!'),
	async execute(interaction) {
		try {
			const res = await fetch('https://api.garythe.cat/gary', {
				method: 'GET',
				headers: { 'Content-Type': 'application/json' }
			});

			const gary = await res.json();

			console.log(gary);

			const embed = new EmbedBuilder()
				.setTitle(`gary #${gary.number}`)
				.setImage(gary.url)
				.setColor(0xb03000)
				.setFooter({ text: 'powered by garythe.cat API' });

			await interaction.reply({ embeds: [embed] });
		} catch (err) {
			console.error(err);
			await interaction.reply('failed to fetch a gary...');
		}
	},
};
