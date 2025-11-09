const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { 
    createVirtualDisk, 
    getUserDisks, 
    deleteDisk, 
    getDisk,
    uploadFileToDisk,
    getFileFromDisk,
    listDiskFiles,
    deleteFileFromDisk
} = require('../modules/db.js');

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatPath(path) {
    return path.startsWith('/') ? path : '/' + path;
}

module.exports = {
    data: new SlashCommandBuilder({ integration_types: [0, 1], contexts: [0, 1, 2] })
        .setName('disks')
        .setDescription('manage your virtual disks (max 5 disks, 100MB each, 5MB per file)')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('create a new virtual disk')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('name for your funny disk')
                        .setRequired(true)
                        .setMaxLength(32)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('list all your virtual disks'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('delete a virtual disk')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('name of the disk to delete')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('info')
                .setDescription('get information about a disk')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('name of the disk')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('upload')
                .setDescription('upload a file to a disk')
                .addStringOption(option =>
                    option.setName('disk')
                        .setDescription('name of the disk')
                        .setRequired(true))
                .addAttachmentOption(option =>
                    option.setName('file')
                        .setDescription('file to upload (max 5MB)')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('path')
                        .setDescription('path on disk (e.g., /folder/file.txt)')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('download')
                .setDescription('download a file from a disk')
                .addStringOption(option =>
                    option.setName('disk')
                        .setDescription('name of the disk')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('path')
                        .setDescription('path to the file')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('ls')
                .setDescription('list files in a disk directory')
                .addStringOption(option =>
                    option.setName('disk')
                        .setDescription('name of the disk')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('directory')
                        .setDescription('directory to list (default: /)')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('rm')
                .setDescription('remove a file from a disk')
                .addStringOption(option =>
                    option.setName('disk')
                        .setDescription('name of the disk')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('path')
                        .setDescription('path to the file to remove')
                        .setRequired(true))),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const userId = interaction.user.id;

        try {
            switch (subcommand) {
                case 'create': {
                    const diskName = interaction.options.getString('name');
                    
                    if (!/^[a-zA-Z0-9_-]+$/.test(diskName)) {
                        return interaction.reply({ 
                            content: 'disk name can only contain letters, numbers, underscores, and hyphens you silly goose', 
                            ephemeral: true 
                        });
                    }

                    const disk = await createVirtualDisk(userId, diskName);
                    
                    const embed = new EmbedBuilder()
                        .setColor(0xb03000)
                        .setTitle('💾 disk created')
                        .setDescription(`successfully created disk **${diskName}**`)
                        .addFields(
                            { name: 'size', value: '0 MB / 100 MB', inline: true },
                            { name: 'files', value: '0', inline: true },
                            { name: 'created', value: `<t:${Math.floor(new Date(disk.created_at).getTime() / 1000)}:R>`, inline: true }
                        );

                    return interaction.reply({ embeds: [embed] });
                }

                case 'list': {
                    const disks = await getUserDisks(userId);
                    
                    if (disks.length === 0) {
                        return interaction.reply({ 
                            content: 'you have no virtual disks. use `/disks create` to create one! where else are you gonna store the files smh', 
                            ephemeral: true 
                        });
                    }

                    const embed = new EmbedBuilder()
                        .setColor(0xb03000)
                        .setTitle('💾 your virtual disks')
                        .setDescription(`you have ${disks.length}/5 disks`);

                    for (const disk of disks) {
                        const sizePercent = Math.round((disk.size_mb / 100) * 100);
                        const progressBar = '█'.repeat(Math.floor(sizePercent / 10)) + '░'.repeat(10 - Math.floor(sizePercent / 10));
                        
                        embed.addFields({
                            name: `📀 ${disk.disk_name}`,
                            value: `${progressBar} ${disk.size_mb}/100 MB (${sizePercent}%)\ncreated: <t:${Math.floor(new Date(disk.created_at).getTime() / 1000)}:R>`,
                            inline: true
                        });
                    }

                    return interaction.reply({ embeds: [embed] });
                }

                case 'delete': {
                    const diskName = interaction.options.getString('name');
                    const deleted = await deleteDisk(userId, diskName);
                    
                    if (!deleted) {
                        return interaction.reply({ 
                            content: `disk **${diskName}** not found.`, 
                            ephemeral: true 
                        });
                    }

                    const embed = new EmbedBuilder()
                        .setColor(0xb03000)
                        .setTitle('🗑️ disk deleted')
                        .setDescription(`successfully deleted disk **${diskName}** and all its files.`);

                    return interaction.reply({ embeds: [embed] });
                }

                case 'info': {
                    const diskName = interaction.options.getString('name');
                    const disk = await getDisk(userId, diskName);
                    
                    if (!disk) {
                        return interaction.reply({ 
                            content: `disk **${diskName}** not found.`, 
                            ephemeral: true 
                        });
                    }

                    const files = await listDiskFiles(userId, diskName);
                    const fileCount = files.length;
                    const sizePercent = Math.round((disk.size_mb / 100) * 100);
                    const progressBar = '█'.repeat(Math.floor(sizePercent / 10)) + '░'.repeat(10 - Math.floor(sizePercent / 10));

                    const embed = new EmbedBuilder()
                        .setColor(0xb03000)
                        .setTitle(`💾 disk: ${diskName}`)
                        .addFields(
                            { name: 'storage', value: `${progressBar}\n${disk.size_mb}/100 MB (${sizePercent}%)`, inline: true },
                            { name: 'files', value: fileCount.toString(), inline: true },
                            { name: 'created', value: `<t:${Math.floor(new Date(disk.created_at).getTime() / 1000)}:R>`, inline: true },
                            { name: 'last modified', value: `<t:${Math.floor(new Date(disk.updated_at).getTime() / 1000)}:R>`, inline: true }
                        );

                    return interaction.reply({ embeds: [embed] });
                }

                case 'upload': {
                    const diskName = interaction.options.getString('disk');
                    const attachment = interaction.options.getAttachment('file');
                    let filePath = interaction.options.getString('path') || `/${attachment.name}`;
                    
                    filePath = formatPath(filePath);

                    if (attachment.size > 5242880) {
                        return interaction.reply({ 
                            content: 'file size exceeds 5MB limit lol', 
                            ephemeral: true 
                        });
                    }

                    await interaction.deferReply();

                    try {
                        const response = await fetch(attachment.url);
                        const fileData = Buffer.from(await response.arrayBuffer());

                        await uploadFileToDisk(userId, diskName, filePath, attachment.name, fileData, attachment.contentType);

                        const embed = new EmbedBuilder()
                            .setColor(0xb03000)
                            .setTitle('📤 file uploaded')
                            .setDescription(`successfully uploaded **${attachment.name}** to disk **${diskName}**`)
                            .addFields(
                                { name: 'path', value: filePath, inline: true },
                                { name: 'size', value: formatBytes(attachment.size), inline: true },
                                { name: 'type', value: attachment.contentType || 'unknown', inline: true }
                            );

                        return interaction.editReply({ embeds: [embed] });
                    } catch (error) {
                        return interaction.editReply({ 
                            content: `upload failed: ${error.message}` 
                        });
                    }
                }

                case 'download': {
                    const diskName = interaction.options.getString('disk');
                    let filePath = interaction.options.getString('path');
                    
                    filePath = formatPath(filePath);

                    await interaction.deferReply();

                    try {
                        const file = await getFileFromDisk(userId, diskName, filePath);
                        
                        if (!file) {
                            return interaction.editReply({ 
                                content: `file **${filePath}** not found on disk **${diskName}**.` 
                            });
                        }

                        const attachment = new AttachmentBuilder(file.file_data, { name: file.file_name });

                        const embed = new EmbedBuilder()
                            .setColor(0xb03000)
                            .setTitle('📥 file downloaded')
                            .setDescription(`downloaded **${file.file_name}** from disk **${diskName}**`)
                            .addFields(
                                { name: 'path', value: filePath, inline: true },
                                { name: 'size', value: formatBytes(file.file_size), inline: true },
                                { name: 'type', value: file.mime_type || 'unknown', inline: true }
                            );

                        return interaction.editReply({ embeds: [embed], files: [attachment] });
                    } catch (error) {
                        return interaction.editReply({ 
                            content: `download failed: ${error.message}` 
                        });
                    }
                }

                case 'ls': {
                    const diskName = interaction.options.getString('disk');
                    let directory = interaction.options.getString('directory') || '/';
                    
                    directory = formatPath(directory);
                    if (!directory.endsWith('/')) directory += '/';

                    const disk = await getDisk(userId, diskName);
                    if (!disk) {
                        return interaction.reply({ 
                            content: `disk **${diskName}** not found.`, 
                            ephemeral: true 
                        });
                    }

                    const files = await listDiskFiles(userId, diskName, directory);
                    
                    if (files.length === 0) {
                        return interaction.reply({ 
                            content: `directory **${directory}** is empty or doesn't exist.`, 
                            ephemeral: true 
                        });
                    }

                    const embed = new EmbedBuilder()
                        .setColor(0xb03000)
                        .setTitle(`📁 ${diskName}:${directory}`)
                        .setDescription(`found ${files.length} file(s)`);

                    let fileList = '';
                    for (const file of files.slice(0, 20)) {
                        const size = formatBytes(file.file_size);
                        const date = new Date(file.created_at).toLocaleDateString();
                        fileList += `📄 \`${file.file_path}\` (${size}) - ${date}\n`;
                    }

                    if (files.length > 20) {
                        fileList += `\n... and ${files.length - 20} more files`;
                    }

                    embed.addFields({ name: 'files', value: fileList || 'no files found' });

                    return interaction.reply({ embeds: [embed] });
                }

                case 'rm': {
                    const diskName = interaction.options.getString('disk');
                    let filePath = interaction.options.getString('path');
                    
                    filePath = formatPath(filePath);

                    const deleted = await deleteFileFromDisk(userId, diskName, filePath);
                    
                    if (!deleted) {
                        return interaction.reply({ 
                            content: `file **${filePath}** not found on disk **${diskName}**.`, 
                            ephemeral: true 
                        });
                    }

                    const embed = new EmbedBuilder()
                        .setColor(0xb03000)
                        .setTitle('🗑️ file deleted')
                        .setDescription(`successfully deleted **${filePath}** from disk **${diskName}**`);

                    return interaction.reply({ embeds: [embed] });
                }

                default:
                    return interaction.reply({ 
                        content: 'unknown subcommand.', 
                        ephemeral: true 
                    });
            }
        } catch (error) {
            console.error('Disks command error:', error);
            
            const errorMessage = error.message || 'an unexpected error occurred.';
            const content = `${errorMessage}`;
            
            if (interaction.deferred) {
                return interaction.editReply({ content });
            } else {
                return interaction.reply({ content, ephemeral: true });
            }
        }
    },
};