const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
dotenv = require('dotenv');
dotenv.config();

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	const json = command.data.toJSON();

	const extras = {
		integration_types: [0, 1],
		contexts: [0, 1, 2],
	};
	Object.assign(json, extras);

	commands.push(json);
}

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
	try {
		console.log('Started refreshing application (/) commands.');

		// Send array of objects, not a string
		await rest.put(
			Routes.applicationCommands(process.env.CLIENT_ID),
			{ body: commands }
		);

		console.log('Successfully reloaded application (/) commands.');
	} catch (error) {
		console.error(error);
	}
})();
