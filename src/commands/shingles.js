const { SlashCommandBuilder } = require('discord.js');
const { AttachmentBuilder } = require('discord.js');

const file = new AttachmentBuilder('images/shingles.mp4');
module.exports = {
	data: new SlashCommandBuilder({ integration_types: [0,1] })
		.setName('shingles')
		.setDescription("i didn't even think i was at risk of having shingles. i was wrong. talk to your doctor today"),
	async execute(interaction) {
		await interaction.reply({ files: [file] });
	},
};