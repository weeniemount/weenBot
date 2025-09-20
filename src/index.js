const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('node:fs');
dotenv = require('dotenv');
dotenv.config();

// express server to keep render and similar services happy
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

client.once('ready', () => {
  console.log('Bot is online!');
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
  }
});

client.login(process.env.TOKEN);

app.get('/', (req, res) => {
  res.send('weenBot is alive!');
  console.log("ping!")
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});