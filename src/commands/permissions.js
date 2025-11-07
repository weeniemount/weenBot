const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('permissions')
        .setDescription('check what permissions the bot has and what features need them'),

    async execute(interaction) {
        const botMember = interaction.guild.members.me;
        
        const perms = {
            manageMessages: botMember.permissions.has(PermissionFlagsBits.ManageMessages),
            moderateMembers: botMember.permissions.has(PermissionFlagsBits.ModerateMembers),
            sendMessages: botMember.permissions.has(PermissionFlagsBits.SendMessages),
            embedLinks: botMember.permissions.has(PermissionFlagsBits.EmbedLinks),
            readMessageHistory: botMember.permissions.has(PermissionFlagsBits.ReadMessageHistory)
        };

        const embed = new EmbedBuilder()
            .setColor(0xb03000)
            .setTitle('🔒 bot permissions status')
            .setDescription('heres what permissions the bot currently has and what theyre used for')
            .addFields(
                {
                    name: `${perms.manageMessages ? '✅' : '❌'} manage messages`,
                    value: perms.manageMessages 
                        ? '**enabled** - regex filters will work' 
                        : '**disabled** - regex filters wont work (optional)',
                    inline: false
                },
                {
                    name: `${perms.moderateMembers ? '✅' : '❌'} timeout members`,
                    value: perms.moderateMembers 
                        ? '**enabled** - timeout action for filters will work' 
                        : '**disabled** - timeout action wont work (optional)',
                    inline: false
                },
                {
                    name: `${perms.sendMessages ? '✅' : '❌'} send messages`,
                    value: perms.sendMessages 
                        ? '**enabled** - required for bot to function' 
                        : '**disabled** - bot wont be able to respond',
                    inline: false
                },
                {
                    name: `${perms.embedLinks ? '✅' : '❌'} embed links`,
                    value: perms.embedLinks 
                        ? '**enabled** - required for rich embeds' 
                        : '**disabled** - commands will look plain',
                    inline: false
                },
                {
                    name: `${perms.readMessageHistory ? '✅' : '❌'} read message history`,
                    value: perms.readMessageHistory 
                        ? '**enabled** - required for some features' 
                        : '**disabled** - some features may not work',
                    inline: false
                }
            )
            .setFooter({ 
                text: 'permissions marked (optional) are not required but enable extra features' 
            })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};