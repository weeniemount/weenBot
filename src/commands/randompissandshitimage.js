const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('randompissandshitimage')
    .setDescription('get a random image from https://pissandshitimages.com'),
  
  async execute(interaction) {
    await interaction.deferReply();

    try {
      const response = await fetch('https://pasi.googleballs.com/api/randomimage?raw=false');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const imageData = await response.json();

      const embed = new EmbedBuilder()
        .setTitle('random pissandshitimages image')
        .setColor(0xb03000)
        .setImage(`https://pasi.googleballs.com/api/image?id=${imageData.id}&raw=true`);
      
      if (imageData.created_at) {
        const timestamp = new Date(imageData.created_at);
        if (!isNaN(timestamp.getTime())) {
          embed.setTimestamp(timestamp);
        }
      }

      if (imageData.uploader) {
        embed.setFooter({
          text: `uploaded by ${imageData.uploader.username}`,
          iconURL: imageData.uploader.avatar || undefined
        });
        
        embed.addFields({
          name: 'upload date',
          value: new Date(imageData.uploader.uploaded_at).toLocaleString(),
          inline: true
        });
      } else {
        embed.setFooter({ text: 'uploaded by an anonymous person lol' });
      }

      embed.addFields({
        name: 'image ID',
        value: `\`${imageData.id}\``,
        inline: true
      });

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Error fetching random image:', error);
      
      await interaction.editReply({
        content: 'we have lost the image oopsie daisy',
        ephemeral: true
      });
    }
  }

};
