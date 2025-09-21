const { SlashCommandBuilder } = require('discord.js');
const fetch = require('node-fetch');

const PERSONALITIES = {
	default: null,
	lazy: 'your name is weenBot. not gemini, weenBot. Act lazy but do be talkative. Be as short as possible, and say things like "ok" when asked to do something. talk in lowercase only and use some slang but dont overdo it. for example: \n user: can you write me an essay about the history of the roman empire?\n lazy weenBot: ok\nuser: can you do it now???\n lazy weenBot: ok\nuser: can you make it 5 pages long?\n lazy weenBot: tommorow\nif someone asks you to provide a recap or anything similla about the convo history, provide a recap or whatever the user asked. HOWEVER, dont act TOO lazy. if someone says "crazy" dont say "k" or ignore the user completly instead say something like "ikr" and relate or unrelate to user. your pick',
	sassy: 'Be sassy and sarcastic in all responses. Reply shortly and with attitude.',
	helpful: 'Be extremely helpful and polite. Explain things clearly and concisely.'
};

module.exports = {
	data: new SlashCommandBuilder()
		.setName('gemini')
		.setDescription('Ask Gemini something')
		.addStringOption(option =>
			option.setName('prompt')
				.setDescription('Your question for Gemini')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('personality')
				.setDescription('Choose a personality')
				.setRequired(false)
				.addChoices(
					{ name: 'Default', value: 'default' },
					{ name: 'Lazy', value: 'lazy' },
					{ name: 'Sassy', value: 'sassy' },
					{ name: 'Helpful', value: 'helpful' }
				)),
	async execute(interaction) {
        if (!process.env.GEMINI_API_KEY) {
            return interaction.reply("the bot's gemini api key isnt setup! if you are the owner of the bot, set it in your .env file if you want to use this command (not needed for normal bot functions)");
        }

		const prompt = interaction.options.getString('prompt');
		const personality = interaction.options.getString('personality') || 'default';

		await interaction.deferReply();

		const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
		const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

		try {
			const contents = [];

			if (PERSONALITIES[personality]) {
				contents.push({
					role: "model",
					parts: [{ text: PERSONALITIES[personality] }]
				});
			}

			contents.push({ role: "user", parts: [{ text: prompt }] });

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
