const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent
    ] 
});

function getEmoji(name) {
    return `<:${name}:${client.emojis.cache.find(e => e.name === name)}>`
}

const privateButtonRepliesTable = [
    "why dont you go press your own command buttons",
    "no",
    "nope",
    "not gonna happen",
    "stop",
    "denied",
    "its not gonna happen so stop",
    "yo bro",
    "bro",
    "yo",
    "nuh",
    "nuh uh",
    "STOP",
]

function privateButtonReplies() {
    return privateButtonRepliesTable[Math.floor(Math.random() * privateButtonRepliesTable.length)];
}

module.exports = { privateButtonReplies, getEmoji, client };