const { EmbedBuilder, AttachmentBuilder, SlashCommandBuilder} = require('discord.js');
const { getCommandsRun } = require('../modules/db.js');

const file = new AttachmentBuilder('images/pfp.png');
const weeniemount = new AttachmentBuilder(`images/weeniemount.png`);

module.exports = {
    data: new SlashCommandBuilder({ integration_types: [0,1] })
        .setName('weenbotinfo')
        .setDescription('some info about weenBot'),
    async execute(interaction) {
        const uptime = process.uptime();

        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        
        const uptimemsg = `${hours}h ${minutes}m ${seconds}s`;
        
        let commandsran = await getCommandsRun();
        if (!commandsran) commandsran = 0;

        const infoembed = new EmbedBuilder()
            .setColor(0xb03000)
            .setTitle(`weenBot info`)
            .setThumbnail('attachment://pfp.png')
            .addFields(
                { name: 'bot uptime', value: uptimemsg },
                { name: 'commands ran', value: String(commandsran) },
                { name: 'version', value: 'idk yet' },
            )
            .setFooter({ text: `made with love and ween by @weeniemount`, iconURL: 'attachment://weeniemount.png' });
        await interaction.reply({ embeds: [infoembed], files: [file, weeniemount] });
    },
};