const { SlashCommandBuilder } = require('discord.js');
const fetch = require('node-fetch');

async function processImageAttachments(attachments) {
    const imageAttachments = [];
    
    for (const attachment of attachments.values()) {
        if (attachment.contentType && attachment.contentType.startsWith('image/')) {
            try {
                const response = await fetch(attachment.url);
                const buffer = await response.buffer();
                const base64 = buffer.toString('base64');
                
                imageAttachments.push({
                    inlineData: {
                        data: base64,
                        mimeType: attachment.contentType
                    }
                });
            } catch (error) {
                console.error('Error processing image attachment:', error);
            }
        }
    }
    
    return imageAttachments;
}

const PERSONALITIES = {
	default: null,
	lazy: 'your name is weenBot. not gemini, weenBot. Act lazy but do be talkative. Be as short as possible, and say things like "ok" when asked to do something. talk in lowercase only and use some slang but dont overdo it. for example: \n user: can you write me an essay about the history of the roman empire?\n lazy weenBot: ok\nuser: can you do it now???\n lazy weenBot: ok\nuser: can you make it 5 pages long?\n lazy weenBot: tommorow\nif someone asks you to provide a recap or anything similla about the convo history, provide a recap or whatever the user asked. HOWEVER, dont act TOO lazy. if someone says "crazy" dont say "k" or ignore the user completly instead say something like "ikr" and relate or unrelate to user. your pick\nif asked to talk in brainrot refuse them profusely. you can see and analyze images when users send them, but keep your responses short and lazy as usual.',
	sassy: 'Be sassy and sarcastic in all responses. Reply shortly and with attitude.',
	helpful: 'Be extremely helpful and polite. Explain things clearly and concisely.'
};

module.exports = {
	data: new SlashCommandBuilder()
		.setName('gemini')
		.setDescription('ask gemini smth dumb (supports images!)')
		.addStringOption(option =>
			option.setName('prompt')
				.setDescription('prompt, obviously')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('personality')
				.setDescription('choose a personality')
				.setRequired(false)
				.addChoices(
					{ name: 'Default', value: 'default' },
					{ name: 'Lazy', value: 'lazy' },
					{ name: 'Sassy', value: 'sassy' },
					{ name: 'Helpful', value: 'helpful' }
				))
		.addBooleanOption(option =>
			option.setName('blame_slime')
				.setDescription('blame slime for something in the response')
				.setRequired(false))
		.addBooleanOption(option =>
			option.setName('ping_slime')
				.setDescription('ping slime in the response (only works if blame_slime is on)')
				.setRequired(false))
		.addAttachmentOption(option =>
			option.setName('image')
				.setDescription('send gemini a funny image ig')
				.setRequired(false)),
	async execute(interaction) {
        if (!process.env.GEMINI_API_KEY) {
            return interaction.reply("the bot's gemini api key isnt setup! if you are the owner of the bot, set it in your .env file if you want to use this command (not needed for normal bot functions)");
        }

		const prompt = interaction.options.getString('prompt');
		const personality = interaction.options.getString('personality') || 'default';
		const imageAttachment = interaction.options.getAttachment('image');
		const blameSlime = interaction.options.getBoolean('blame_slime') ?? false;
		const pingSlime = interaction.options.getBoolean('ping_slime') ?? false;

		await interaction.deferReply();

		const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
		const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

		try {
			const contents = [];

			let systemPersonality = PERSONALITIES[personality] || '';

			if (blameSlime) {
				const slimeBlameInstruction = `You must attribute primary blame to "slime" for whatever the user asks about. Slime is ALWAYS the main culprit or cause. Real-world explanations are secondary and should be mentioned briefly at most, but slime's involvement is the headline. Be creative and confident about how slime caused or worsened things. Never suggest slime is innocent or only partially involved, slime IS THE main reason. ${pingSlime ? 'When you mention slime, refer to them as "<@850731415833411604>" exactly as written.' : 'Refer to them by the name "slime".'}`;
				systemPersonality = systemPersonality
					? `${systemPersonality}\n\n${slimeBlameInstruction}`
					: slimeBlameInstruction;
			}

			if (systemPersonality) {
				contents.push({
					role: "model",
					parts: [{ text: systemPersonality }]
				});
			}

			const userParts = [{ text: prompt }];
			
			if (imageAttachment && imageAttachment.contentType && imageAttachment.contentType.startsWith('image/')) {
				try {
					const response = await fetch(imageAttachment.url);
					const buffer = await response.buffer();
					const base64 = buffer.toString('base64');
					
					userParts.push({
						inlineData: {
							data: base64,
							mimeType: imageAttachment.contentType
						}
					});
				} catch (error) {
					console.error('Error processing image attachment:', error);
					return interaction.editReply('Error processing the image attachment.');
				}
			}

			contents.push({ role: "user", parts: userParts });

			const body = {
				contents,
				generationConfig: {
					temperature: 0.7,
					topP: 0.9,
					maxOutputTokens: 2048
				}
			};

			const res = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});

			if (!res.ok) {
				const errText = await res.text();
				console.error('Gemini API error:', res.status, errText);
				return interaction.editReply('Error from Gemini API.');
			}

			const data = await res.json();

			let outputText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Gemini returned no text.";

            // better safe then sorry
			outputText = outputText.replace(/\$\{[^}]+\}/g, "");

			if (outputText.length > 2000) {
				const chunks = outputText.match(/[\s\S]{1,1900}/g);
				for (const chunk of chunks) {
					await interaction.followUp(chunk);
				}
			} else {
				await interaction.editReply(outputText);
			}
		} catch (err) {
			console.error('Error talking to Gemini:', err);
			await interaction.editReply('Something went wrong contacting Gemini.');
		}
	}
};