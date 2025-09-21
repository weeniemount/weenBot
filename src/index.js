const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('node:fs');
const dotenv = require('dotenv');
const { initializeDB, getWeenSpeakChannels } = require('./modules/db.js');
const { handleWeenSpeakMessage } = require('./modules/weenspeak.js');
dotenv.config();

// express server to keep render and similar services happy
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent
    ] 
});
client.commands = new Collection();
let weenspeakChannels = new Set();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  try {
    console.log(`Loading command: ${file}`);
    const command = require(`./commands/${file}`);
    console.log(`Successfully loaded command: ${command.data.name}`);
    client.commands.set(command.data.name, command);
  } catch (error) {
    console.error(`Error loading command ${file}:`, error);
  }
}

client.once('ready', async () => {
    console.log('weenBot is ready!');

    await initializeDB();
    
    const channels = await getWeenSpeakChannels();
    weenspeakChannels = new Set(channels);
    console.log(`Loaded ${weenspeakChannels.size} weenspeak channels`);

    updatePresence();
    setInterval(updatePresence, 10 * 60 * 1000);
});

function updatePresence() {
    client.user.setPresence({
        activities: [
            {
                name: `over ${client.guilds.cache.size} ween™ servers!`,
                type: 3 // WATCHING
            }
        ],
        status: 'online'
    });
}

client.on('guildCreate', () => updatePresence());
client.on('guildDelete', () => updatePresence());

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    console.log(`Command received: ${interaction.commandName}`);
    console.log(`Available commands: ${Array.from(client.commands.keys()).join(', ')}`);

    const command = client.commands.get(interaction.commandName);

    if (!command) {
        console.log(`Command ${interaction.commandName} not found!`);
        return;
    }

    try {
        console.log(`Executing command: ${interaction.commandName}`);
        await command.execute(interaction);
        
        if (interaction.commandName === 'weenspeak') {
            const channels = await getWeenSpeakChannels();
            weenspeakChannels = new Set(channels);
            console.log(`Refreshed weenspeak channels: ${weenspeakChannels.size} total`);
        }
    } catch (error) {
        console.error(`Error executing command ${interaction.commandName}:`, error);
        try {
            if (interaction.deferred) {
                await interaction.editReply({ content: 'There was an error while executing this command!' });
            } else {
                await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
            }
        } catch (replyError) {
            console.error('Error sending error message:', replyError);
        }
    }
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !weenspeakChannels.has(message.channel.id)) {
        return;
    }
    
    if (!process.env.GEMINI_API_KEY) {
        return;
    }

    try {
        await handleWeenSpeakMessage(message);
    } catch (error) {
        console.error('Error handling weenspeak message:', error);
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