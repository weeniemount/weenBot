const { SlashCommandBuilder } = require('discord.js');
const { updateAchievementProgress } = require('../modules/achievements.js');

const facts = [
    "did you know i made this bot on september 20th 2025",
    "i keep running out of command ideas",
    "weenBot",
    "this bot was made by @weeniemount on discord. go figure.",
    "aside from the ping command, this command is prob the most basic one yet",
    "i have no weenfact ideas",
    "made with discord.js because idk its cool",
    "set up weenspeak for weenbot to yap idk",
    "fact of the fun: this is a fact",
    "also check out Cat Bot",
    "also check out Biscord",
    "this bot was born after the slash commands migration",
    "this is my 2nd ever public discord bot, right after the dancing h discord bot"
]

module.exports = {
    data: new SlashCommandBuilder({ integration_types: [0,1] })
        .setName('weenfact')
        .setDescription('fun ween fact of the day'),
    async execute(interaction) {
        await interaction.reply({ content: facts[Math.floor(Math.random() * facts.length)] });

        const result = await updateAchievementProgress(
            interaction.user.id,
            'WEENFACT_ADDICT',
            1,
            interaction
        );
        
        if (result === null) {
            console.error('Failed to update achievement progress for user:', interaction.user.id);
        }
    },
};  