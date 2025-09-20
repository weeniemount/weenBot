const { SlashCommandBuilder } = require('discord.js');
const { AttachmentBuilder } = require('discord.js');

const file = new AttachmentBuilder('images/weenie.gif');
module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder({ integration_types: [0,1] })
		.setName('weenie')
		.setDescription('send a weenie in chat'),
	async execute(interaction) {
		await interaction.reply({ files: [file] });
	},
};