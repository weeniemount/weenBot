const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const GIFEncoder = require('gifencoder');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder({ integration_types: [0, 1], contexts: [0, 1, 2] })
        .setName('imagetools')
        .setDescription('various ways to mess with an image with weenBot lol')
        .addSubcommand(subcommand =>
            subcommand
                .setName('speech-bubble')
                .setDescription('add a speech bubble overlay to an image')
                .addAttachmentOption(option =>
                    option.setName('image')
                        .setDescription('the image to add speech bubble to')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('mode')
                        .setDescription('how to apply the speech bubble')
                        .setRequired(true)
                        .addChoices(
                            { name: 'transparent overlay (cuts into image)', value: 'transparent' },
                            { name: 'solid overlay (on top)', value: 'solid' },
                            { name: 'white tinted overlay', value: 'tinted' }
                        ))
                .addBooleanOption(option =>
                    option.setName('as_gif')
                        .setDescription('output as gif format')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('to-gif')
                .setDescription('convert an image to a still frame gif')
                .addAttachmentOption(option =>
                    option.setName('image')
                        .setDescription('the image to convert to gif')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('qr-code')
                .setDescription('generate a qr code')
                .addStringOption(option =>
                    option.setName('text')
                        .setDescription('text or url to encode in qr code')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('size')
                        .setDescription('qr code size')
                        .setRequired(false)
                        .addChoices(
                            { name: 'small (200x200)', value: '200' },
                            { name: 'medium (400x400)', value: '400' },
                            { name: 'large (600x600)', value: '600' }
                        ))),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const subcommand = interaction.options.getSubcommand();

            if (subcommand === 'speech-bubble') {
                await handleSpeechBubble(interaction);
            } else if (subcommand === 'to-gif') {
                await handleToGif(interaction);
            } else if (subcommand === 'qr-code') {
                await handleQrCode(interaction);
            }
        } catch (error) {
            console.error('Error in imagetools command:', error);
            await interaction.editReply({ content: 'an error occurred while processing your request.' });
        }
    },
};

async function handleSpeechBubble(interaction) {
    const attachment = interaction.options.getAttachment('image');
    const mode = interaction.options.getString('mode');
    const asGif = interaction.options.getBoolean('as_gif') || false;

    if (!attachment.contentType?.startsWith('image/')) {
        return await interaction.editReply({ content: 'so... wheres the image?' });
    }

    try {
        const userImage = await loadImage(attachment.url);

        const speechBubblePath = path.join(__dirname, '../images/speech-bubble.jpg');
        const speechBubble = await loadImage(speechBubblePath);

        const canvas = createCanvas(userImage.width, userImage.height);
        const ctx = canvas.getContext('2d');

        ctx.drawImage(userImage, 0, 0);

        const bubbleWidth = userImage.width;
        const bubbleHeight = Math.floor(userImage.height * 0.3);

        if (mode === 'transparent') {
            const bubbleCanvas = createCanvas(bubbleWidth, bubbleHeight);
            const bubbleCtx = bubbleCanvas.getContext('2d');

            bubbleCtx.drawImage(speechBubble, 0, 0, bubbleWidth, bubbleHeight);

            const bubbleData = bubbleCtx.getImageData(0, 0, bubbleWidth, bubbleHeight);
            
            for (let i = 0; i < bubbleData.data.length; i += 4) {
                const brightness = (bubbleData.data[i] + bubbleData.data[i + 1] + bubbleData.data[i + 2]) / 3;
                bubbleData.data[i + 3] = brightness;
            }
            
            bubbleCtx.putImageData(bubbleData, 0, 0);
            
            ctx.globalCompositeOperation = 'destination-out';
            ctx.drawImage(bubbleCanvas, 0, 0);

            ctx.globalCompositeOperation = 'source-over';
        } else if (mode === 'solid') {
            ctx.drawImage(speechBubble, 0, 0, bubbleWidth, bubbleHeight);
        } else if (mode === 'tinted') {
            const imageData = ctx.getImageData(0, 0, bubbleWidth, bubbleHeight);
            ctx.drawImage(speechBubble, 0, 0, bubbleWidth, bubbleHeight);
            
            const tintData = ctx.getImageData(0, 0, bubbleWidth, bubbleHeight);
            
            ctx.putImageData(imageData, 0, 0);
            
            const tintCanvas = createCanvas(bubbleWidth, bubbleHeight);
            const tintCtx = tintCanvas.getContext('2d');
            tintCtx.drawImage(speechBubble, 0, 0, bubbleWidth, bubbleHeight);
            
            const tintMask = tintCtx.getImageData(0, 0, bubbleWidth, bubbleHeight);
            
            for (let i = 0; i < tintMask.data.length; i += 4) {
                const brightness = (tintMask.data[i] + tintMask.data[i + 1] + tintMask.data[i + 2]) / 3;
                const tintAmount = brightness / 255;
                
                tintMask.data[i] = 255;
                tintMask.data[i + 1] = 255;
                tintMask.data[i + 2] = 255;
                tintMask.data[i + 3] = tintAmount * 200;
            }
            
            tintCtx.putImageData(tintMask, 0, 0);
            
            ctx.drawImage(tintCanvas, 0, 0);
        }

        let buffer;
        let filename;

        if (asGif) {
            const encoder = new GIFEncoder(canvas.width, canvas.height);
            encoder.start();
            encoder.setRepeat(0);
            encoder.setDelay(1000);
            encoder.setQuality(10);
            encoder.addFrame(ctx);
            encoder.finish();

            buffer = encoder.out.getData();
            filename = 'speech-bubble-result.gif';
        } else {
            buffer = canvas.toBuffer('image/png');
            filename = 'speech-bubble-result.png';
        }

        const resultAttachment = new AttachmentBuilder(buffer, { name: filename });
        await interaction.editReply({ files: [resultAttachment] });

    } catch (error) {
        console.error('Error processing speech bubble:', error);
        await interaction.editReply({ content: 'failed to process the image. please try again with a different image.' });
    }
}

async function handleToGif(interaction) {
    const attachment = interaction.options.getAttachment('image');

    if (!attachment.contentType?.startsWith('image/')) {
        return await interaction.editReply({ content: 'please provide a valid image file.' });
    }

    try {
        const image = await loadImage(attachment.url);

        const canvas = createCanvas(image.width, image.height);
        const ctx = canvas.getContext('2d');

        ctx.drawImage(image, 0, 0);

        const encoder = new GIFEncoder(canvas.width, canvas.height);
        encoder.start();
        encoder.setRepeat(0);
        encoder.setDelay(1000);
        encoder.setQuality(10);
        encoder.addFrame(ctx);
        encoder.finish();

        const buffer = encoder.out.getData();
        const resultAttachment = new AttachmentBuilder(buffer, { name: 'converted.gif' });

        await interaction.editReply({ files: [resultAttachment] });

    } catch (error) {
        console.error('Error converting to GIF:', error);
        await interaction.editReply({ content: 'failed to convert the image to gif. please try again.' });
    }
}

async function handleQrCode(interaction) {
    const text = interaction.options.getString('text');
    const size = parseInt(interaction.options.getString('size') || '400');

    try {
        const qrBuffer = await QRCode.toBuffer(text, {
            width: size,
            height: size,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });

        const resultAttachment = new AttachmentBuilder(qrBuffer, { name: 'qrcode.png' });
        await interaction.editReply({
            content: `qr code generated for: \`${text.length > 50 ? text.substring(0, 50) + '...' : text}\``,
            files: [resultAttachment]
        });

    } catch (error) {
        console.error('Error generating QR code:', error);
        await interaction.editReply({ content: 'failed to generate qr code. please check your input and try again.' });
    }
}