const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const {
    createVirtualDisk,
    getUserDisks,
    deleteDisk,
    getDisk,
    uploadFileToDisk,
    getFileFromDisk,
    listDiskFiles,
    deleteFileFromDisk,
    createDirectory,
    moveFile,
    copyFile
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
                .setName('bulk')
                .setDescription('upload multiple files to a disk (up to 10 files)')
                .addStringOption(option =>
                    option.setName('disk')
                        .setDescription('name of the disk')
                        .setRequired(true))
                .addAttachmentOption(option =>
                    option.setName('file1')
                        .setDescription('first file to upload (max 5MB each)')
                        .setRequired(true))
                .addAttachmentOption(option =>
                    option.setName('file2')
                        .setDescription('second file to upload')
                        .setRequired(false))
                .addAttachmentOption(option =>
                    option.setName('file3')
                        .setDescription('third file to upload')
                        .setRequired(false))
                .addAttachmentOption(option =>
                    option.setName('file4')
                        .setDescription('fourth file to upload')
                        .setRequired(false))
                .addAttachmentOption(option =>
                    option.setName('file5')
                        .setDescription('fifth file to upload')
                        .setRequired(false))
                .addAttachmentOption(option =>
                    option.setName('file6')
                        .setDescription('sixth file to upload')
                        .setRequired(false))
                .addAttachmentOption(option =>
                    option.setName('file7')
                        .setDescription('seventh file to upload')
                        .setRequired(false))
                .addAttachmentOption(option =>
                    option.setName('file8')
                        .setDescription('eighth file to upload')
                        .setRequired(false))
                .addAttachmentOption(option =>
                    option.setName('file9')
                        .setDescription('ninth file to upload')
                        .setRequired(false))
                .addAttachmentOption(option =>
                    option.setName('file10')
                        .setDescription('tenth file to upload')
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('directory')
                        .setDescription('directory to upload files to (default: /)')
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
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('mkdir')
                .setDescription('create a directory on a disk')
                .addStringOption(option =>
                    option.setName('disk')
                        .setDescription('name of the disk')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('path')
                        .setDescription('directory path to create (e.g., /folder/subfolder)')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('cd')
                .setDescription('change directory and list contents')
                .addStringOption(option =>
                    option.setName('disk')
                        .setDescription('name of the disk')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('directory')
                        .setDescription('directory to enter (default: /)')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('mv')
                .setDescription('move a file to a new location')
                .addStringOption(option =>
                    option.setName('disk')
                        .setDescription('name of the disk')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('source')
                        .setDescription('source file path')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('destination')
                        .setDescription('destination file path')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('rename')
                .setDescription('rename a file on a disk')
                .addStringOption(option =>
                    option.setName('disk')
                        .setDescription('name of the disk')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('path')
                        .setDescription('current file path')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('newname')
                        .setDescription('new filename (just the name, not full path)')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('cp')
                .setDescription('copy a file to another location or disk')
                .addStringOption(option =>
                    option.setName('source_disk')
                        .setDescription('source disk name')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('source_path')
                        .setDescription('source file path')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('dest_disk')
                        .setDescription('destination disk name')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('dest_path')
                        .setDescription('destination file path')
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
                    let filePath = interaction.options.getString('path');

                    if (!filePath || filePath === '/') {
                        filePath = `/${attachment.name}`;
                    } else {
                        filePath = formatPath(filePath);
                        if (filePath.endsWith('/')) {
                            filePath = filePath + attachment.name;
                        }
                        if (!filePath.includes('.') || filePath.lastIndexOf('/') > filePath.lastIndexOf('.')) {
                            if (!filePath.endsWith('/')) filePath += '/';
                            filePath += attachment.name;
                        }
                    }

                    if (attachment.size > 10485760) {
                        return interaction.reply({
                            content: 'file size exceeds 10MB limit lol',
                            ephemeral: true
                        });
                    }

                    await interaction.deferReply();

                    try {
                        const progressEmbed1 = new EmbedBuilder()
                            .setColor(0xb03000)
                            .setTitle('📤 uploading file')
                            .setDescription(`downloading **${attachment.name}** from discord...`)
                            .addFields({ name: 'progress', value: '🔄 downloading...', inline: true });

                        await interaction.editReply({ embeds: [progressEmbed1] });

                        const response = await fetch(attachment.url);
                        const fileData = Buffer.from(await response.arrayBuffer());

                        const progressEmbed2 = new EmbedBuilder()
                            .setColor(0xb03000)
                            .setTitle('📤 uploading file')
                            .setDescription(`processing and uploading **${attachment.name}** to disk **${diskName}**...`)
                            .addFields({ name: 'progress', value: '🔄 uploading to disk...', inline: true });

                        await interaction.editReply({ embeds: [progressEmbed2] });

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

                case 'bulk': {
                    const diskName = interaction.options.getString('disk');
                    let directory = interaction.options.getString('directory') || '/';

                    directory = formatPath(directory);
                    if (!directory.endsWith('/')) directory += '/';

                    const attachments = [];
                    for (let i = 1; i <= 10; i++) {
                        const attachment = interaction.options.getAttachment(`file${i}`);
                        if (attachment) {
                            if (attachment.size > 5242880) {
                                return interaction.reply({
                                    content: `file **${attachment.name}** exceeds 5MB limit`,
                                    ephemeral: true
                                });
                            }
                            attachments.push(attachment);
                        }
                    }

                    if (attachments.length === 0) {
                        return interaction.reply({
                            content: 'no files provided for bulk upload',
                            ephemeral: true
                        });
                    }

                    await interaction.deferReply();

                    const results = {
                        successful: [],
                        failed: []
                    };

                    let totalSize = 0;

                    try {
                        for (let i = 0; i < attachments.length; i++) {
                            const attachment = attachments[i];
                            const filePath = directory + attachment.name;

                            try {
                                const progressEmbed = new EmbedBuilder()
                                    .setColor(0xb03000)
                                    .setTitle('📤 bulk upload in progress')
                                    .setDescription(`uploading file ${i + 1}/${attachments.length}: **${attachment.name}**`)
                                    .addFields(
                                        { name: 'progress', value: `🔄 ${i}/${attachments.length} completed`, inline: true },
                                        { name: 'current', value: `downloading **${attachment.name}**...`, inline: true }
                                    );

                                await interaction.editReply({ embeds: [progressEmbed] });

                                const response = await fetch(attachment.url);
                                const fileData = Buffer.from(await response.arrayBuffer());

                                progressEmbed.setFields(
                                    { name: 'progress', value: `🔄 ${i}/${attachments.length} completed`, inline: true },
                                    { name: 'current', value: `uploading **${attachment.name}** to disk...`, inline: true }
                                );
                                await interaction.editReply({ embeds: [progressEmbed] });

                                await uploadFileToDisk(userId, diskName, filePath, attachment.name, fileData, attachment.contentType);

                                results.successful.push({
                                    name: attachment.name,
                                    path: filePath,
                                    size: attachment.size
                                });
                                totalSize += attachment.size;

                            } catch (error) {
                                results.failed.push({
                                    name: attachment.name,
                                    error: error.message
                                });
                            }
                        }

                        const embed = new EmbedBuilder()
                            .setColor(results.failed.length === 0 ? 0x00ff00 : 0xffaa00)
                            .setTitle('📤 bulk upload completed')
                            .setDescription(`uploaded ${results.successful.length}/${attachments.length} files to disk **${diskName}**`);

                        if (results.successful.length > 0) {
                            let successList = '';
                            for (const file of results.successful.slice(0, 10)) {
                                successList += `✅ \`${file.name}\` (${formatBytes(file.size)})\n`;
                            }
                            if (results.successful.length > 10) {
                                successList += `... and ${results.successful.length - 10} more files`;
                            }
                            embed.addFields({ name: 'successful uploads', value: successList });
                        }

                        if (results.failed.length > 0) {
                            let failList = '';
                            for (const file of results.failed.slice(0, 5)) {
                                failList += `❌ \`${file.name}\`: ${file.error}\n`;
                            }
                            if (results.failed.length > 5) {
                                failList += `... and ${results.failed.length - 5} more failures`;
                            }
                            embed.addFields({ name: 'failed uploads', value: failList });
                        }

                        embed.addFields(
                            { name: 'total size uploaded', value: formatBytes(totalSize), inline: true },
                            { name: 'directory', value: directory, inline: true }
                        );

                        return interaction.editReply({ embeds: [embed] });

                    } catch (error) {
                        return interaction.editReply({
                            content: `bulk upload failed: ${error.message}`
                        });
                    }
                }

                case 'download': {
                    const diskName = interaction.options.getString('disk');
                    let filePath = interaction.options.getString('path');

                    filePath = formatPath(filePath);

                    await interaction.deferReply();

                    try {
                        const progressEmbed = new EmbedBuilder()
                            .setColor(0xb03000)
                            .setTitle('📥 downloading file')
                            .setDescription(`retrieving **${filePath}** from disk **${diskName}**...`)
                            .addFields({ name: 'progress', value: '🔄 retrieving from disk...', inline: true });

                        await interaction.editReply({ embeds: [progressEmbed] });

                        const file = await getFileFromDisk(userId, diskName, filePath);

                        if (!file) {
                            return interaction.editReply({
                                content: `file **${filePath}** not found on disk **${diskName}**.`
                            });
                        }

                        const fileBuffer = Buffer.from(file.file_data, 'base64');
                        const attachment = new AttachmentBuilder(fileBuffer, { name: file.file_name });

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
                    const dirs = new Set();
                    const regularFiles = [];

                    for (const file of files) {
                        const relativePath = file.file_path.substring(directory.length);
                        if (relativePath.includes('/')) {
                            const dirName = relativePath.split('/')[0];
                            dirs.add(dirName);
                        } else if (file.file_name !== '.directory') {
                            regularFiles.push(file);
                        }
                    }

                    for (const dir of Array.from(dirs).sort()) {
                        fileList += `📁 \`${dir}/\`\n`;
                    }

                    for (const file of regularFiles.slice(0, 15)) {
                        const size = formatBytes(file.file_size);
                        const date = new Date(file.created_at).toLocaleDateString();
                        fileList += `📄 \`${file.file_name}\` (${size}) - ${date}\n`;
                    }

                    if (regularFiles.length > 15) {
                        fileList += `\n... and ${regularFiles.length - 15} more files`;
                    }

                    embed.addFields({ name: 'contents', value: fileList || 'no files found' });

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

                case 'mkdir': {
                    const diskName = interaction.options.getString('disk');
                    let dirPath = interaction.options.getString('path');

                    dirPath = formatPath(dirPath);

                    try {
                        await createDirectory(userId, diskName, dirPath);

                        const embed = new EmbedBuilder()
                            .setColor(0xb03000)
                            .setTitle('📁 directory created')
                            .setDescription(`successfully created directory **${dirPath}** on disk **${diskName}**`);

                        return interaction.reply({ embeds: [embed] });
                    } catch (error) {
                        return interaction.reply({
                            content: `❌ ${error.message}`,
                            ephemeral: true
                        });
                    }
                }

                case 'cd': {
                    const diskName = interaction.options.getString('disk');
                    let directory = interaction.options.getString('directory') || '/';

                    directory = formatPath(directory);
                    if (!directory.endsWith('/')) directory += '/';

                    const disk = await getDisk(userId, diskName);
                    if (!disk) {
                        return interaction.reply({
                            content: `❌ disk **${diskName}** not found.`,
                            ephemeral: true
                        });
                    }

                    const files = await listDiskFiles(userId, diskName, directory);

                    const embed = new EmbedBuilder()
                        .setColor(0xb03000)
                        .setTitle(`📁 ${diskName}:${directory}`)
                        .setDescription(`current directory contents`);

                    if (files.length === 0) {
                        embed.addFields({ name: 'contents', value: 'empty directory' });
                    } else {
                        let fileList = '';
                        const dirs = new Set();
                        const regularFiles = [];

                        for (const file of files) {
                            const relativePath = file.file_path.substring(directory.length);
                            if (relativePath.includes('/')) {
                                const dirName = relativePath.split('/')[0];
                                dirs.add(dirName);
                            } else if (file.file_name !== '.directory') {
                                regularFiles.push(file);
                            }
                        }

                        for (const dir of Array.from(dirs).sort()) {
                            fileList += `📁 \`${dir}/\`\n`;
                        }

                        for (const file of regularFiles.slice(0, 15)) {
                            const size = formatBytes(file.file_size);
                            fileList += `📄 \`${file.file_name}\` (${size})\n`;
                        }

                        if (regularFiles.length > 15) {
                            fileList += `\n... and ${regularFiles.length - 15} more files`;
                        }

                        embed.addFields({ name: 'contents', value: fileList || 'empty directory' });
                    }

                    return interaction.reply({ embeds: [embed] });
                }

                case 'mv': {
                    const diskName = interaction.options.getString('disk');
                    let sourcePath = interaction.options.getString('source');
                    let destPath = interaction.options.getString('destination');

                    sourcePath = formatPath(sourcePath);
                    destPath = formatPath(destPath);

                    try {
                        await moveFile(userId, diskName, sourcePath, destPath);

                        const embed = new EmbedBuilder()
                            .setColor(0xb03000)
                            .setTitle('📁 file moved')
                            .setDescription(`successfully moved **${sourcePath}** to **${destPath}** on disk **${diskName}**`);

                        return interaction.reply({ embeds: [embed] });
                    } catch (error) {
                        return interaction.reply({
                            content: `❌ ${error.message}`,
                            ephemeral: true
                        });
                    }
                }

                case 'rename': {
                    const diskName = interaction.options.getString('disk');
                    let filePath = interaction.options.getString('path');
                    const newName = interaction.options.getString('newname');

                    filePath = formatPath(filePath);

                    const lastSlashIndex = filePath.lastIndexOf('/');
                    const directory = filePath.substring(0, lastSlashIndex + 1);
                    const currentName = filePath.substring(lastSlashIndex + 1);

                    const newPath = directory + newName;

                    try {
                        await moveFile(userId, diskName, filePath, newPath);

                        const embed = new EmbedBuilder()
                            .setColor(0xb03000)
                            .setTitle('✏️ file renamed')
                            .setDescription(`successfully renamed **${currentName}** to **${newName}** on disk **${diskName}**`)
                            .addFields(
                                { name: 'old path', value: filePath, inline: true },
                                { name: 'new path', value: newPath, inline: true }
                            );

                        return interaction.reply({ embeds: [embed] });
                    } catch (error) {
                        return interaction.reply({
                            content: `❌ ${error.message}`,
                            ephemeral: true
                        });
                    }
                }

                case 'cp': {
                    const sourceDisk = interaction.options.getString('source_disk');
                    const destDisk = interaction.options.getString('dest_disk');
                    let sourcePath = interaction.options.getString('source_path');
                    let destPath = interaction.options.getString('dest_path');

                    sourcePath = formatPath(sourcePath);
                    destPath = formatPath(destPath);

                    await interaction.deferReply();

                    try {
                        const progressEmbed = new EmbedBuilder()
                            .setColor(0xb03000)
                            .setTitle('📋 copying file')
                            .setDescription(`copying **${sourcePath}** from **${sourceDisk}** to **${destPath}** on **${destDisk}**...`)
                            .addFields({ name: 'progress', value: '🔄 copying...', inline: true });

                        await interaction.editReply({ embeds: [progressEmbed] });

                        await copyFile(userId, sourceDisk, destDisk, sourcePath, destPath);

                        const embed = new EmbedBuilder()
                            .setColor(0xb03000)
                            .setTitle('📋 file copied')
                            .setDescription(`successfully copied **${sourcePath}** from disk **${sourceDisk}** to **${destPath}** on disk **${destDisk}**`);

                        return interaction.editReply({ embeds: [embed] });
                    } catch (error) {
                        return interaction.editReply({
                            content: `❌ ${error.message}`
                        });
                    }
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