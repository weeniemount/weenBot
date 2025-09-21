const fetch = require('node-fetch');

const lazyPersonality = 'your name is weenBot. not gemini, weenBot. Act lazy but do be talkative. Be as short as possible, and say things like "ok" when asked to do something. talk in lowercase only and use some slang but dont overdo it. for example: \n user: can you write me an essay about the history of the roman empire?\n lazy weenBot: ok\nuser: can you do it now???\n lazy weenBot: ok\nuser: can you make it 5 pages long?\n lazy weenBot: tommorow\nif someone asks you to provide a recap or anything similla about the convo history, provide a recap or whatever the user asked. HOWEVER, dont act TOO lazy. if someone says "crazy" dont say "k" or ignore the user completly instead say something like "ikr" and relate or unrelate to user. your pick\nif asked to talk in brainrot refuse them profusely.';

async function handleWeenSpeakMessage(message) {
    const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    try {
        const messageHistory = await getMessageHistory(message.channel, 20);
        
        const contents = [];
        
        contents.push({
            role: "model",
            parts: [{ text: lazyPersonality }]
        });

        if (messageHistory.length > 0) {
            const contextText = "here's some recent chat history for context:\n" + 
                messageHistory.map(msg => `${msg.author}: ${msg.content}`).join('\n') + 
                '\n\nnow respond to the most recent message:';
            
            contents.push({
                role: "user",
                parts: [{ text: contextText }]
            });
        }

        contents.push({ 
            role: "user", 
            parts: [{ text: `${message.author.displayName || message.author.username}: ${message.content}` }] 
        });

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
            return;
        }

        const data = await res.json();
        let outputText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "ok";

        // better safe than sorry
        outputText = outputText.replace(/\$\{[^}]+\}/g, "");

        if (outputText.length > 2000) {
            const chunks = outputText.match(/[\s\S]{1,1900}/g);
            await message.reply(chunks[0]);
            for (let i = 1; i < chunks.length; i++) {
                await message.channel.send(chunks[i]);
            }
        } else {
            await message.reply(outputText);
        }
    } catch (err) {
        console.error('Error talking to Gemini for weenspeak:', err);
        await message.reply('ok');
    }
}

async function getMessageHistory(channel, limit = 20) {
    try {
        const messages = await channel.messages.fetch({ limit: limit });
        const messageArray = Array.from(messages.values()).reverse();
        
        const formattedMessages = messageArray
            .filter(msg => !msg.author.bot)
            .filter(msg => msg.content.length > 0)
            .filter(msg => !msg.content.startsWith('/'))
            .slice(-15)
            .map(msg => ({
                author: msg.author.displayName || msg.author.username,
                content: msg.content.substring(0, 200)
            }));

        return formattedMessages;
    } catch (error) {
        console.error('Error fetching message history:', error);
        return [];
    }
}

module.exports = {
    handleWeenSpeakMessage
};