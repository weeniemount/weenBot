const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('node:fs');
const dotenv = require('dotenv');
const { initializeDB, incrementCommandsRun } = require('./modules/db.js');
dotenv.config();

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent
    ] 
});

// express server to keep render and similar services happy
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    try {
        const command = require(`./commands/${file}`);
        client.commands.set(command.data.name, command);
    } catch (error) {
        console.error(`Error loading command ${file}:`, error);
    }
}

const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    try {
        const event = require(`./events/${file}`);
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args));
        } else {
            client.on(event.name, (...args) => event.execute(...args));
        }
        console.log(`Loaded event: ${event.name}`);
    } catch (error) {
        console.error(`Error loading event ${file}:`, error);
    }
}

client.once('ready', async () => {
    console.log('weenBot is ready!');

    await initializeDB();

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

    const command = client.commands.get(interaction.commandName);

    if (!command) {
        console.log(`Command ${interaction.commandName} not found!`);
        return;
    }

    try {
        await command.execute(interaction);
        
        await incrementCommandsRun();

        if (interaction.commandName === 'weenspeak') {
            // Refresh weenspeak channels in the event handler
            const { refreshWeenspeakChannels } = require('./events/messageCreate.js');
            await refreshWeenspeakChannels();
        }
    } catch (error) {
        console.error(`Error executing command ${interaction.commandName}:`, error);
        
        try {
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ 
                    content: 'There was an error while executing this command!', 
                    ephemeral: true 
                });
            } else if (interaction.deferred) {
                await interaction.editReply({ 
                    content: 'There was an error while executing this command!' 
                });
            }
        } catch (replyError) {
            console.error('Error sending error message:', replyError);
        }
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