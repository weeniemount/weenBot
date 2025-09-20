const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong!'),
  async execute(interaction) {
    const pingEmbed = new EmbedBuilder()
        .setColor(0xb03000)
        .setTitle("pong!")
        .setAuthor(
            { 
                name: "weenBot"
            }
        )


    await interaction.reply({embeds: [pingEmbed]});
  },
};
