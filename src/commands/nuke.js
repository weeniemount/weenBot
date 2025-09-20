const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nuke')
    .setDescription('nuke someone because your funny')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('the user to nuke')
        .setRequired(true)),
  async execute(interaction) {
    await interaction.reply(`${interaction.options.getUser('target')} prepare to get nuked`);
    setTimeout(async function(){
        await interaction.followUp(`3`);
    }, 2000);
    setTimeout(async function(){
        await interaction.followUp(`2`);
    }, 2000);
    setTimeout(async function(){
        await interaction.followUp(`1`);
    }, 2000);
    setTimeout(async function(){
        await interaction.followUp(`# yeah your done for 💥💥💥💥💥💥💥💥`);
    }, 2000);
  },
};
