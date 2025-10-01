const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
dotenv = require('dotenv');
dotenv.config();

const commands = [];
function getCommandFiles(dir) {
	let files = [];
	const entries = fs.readdirSync(dir, { withFileTypes: true });

	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			files = files.concat(getCommandFiles(fullPath));
		} else if (entry.isFile() && entry.name.endsWith('.js')) {
			files.push(fullPath);
		}
	}

	return files;
}

const commandFiles = getCommandFiles('./commands');

for (const file of commandFiles) {
	const command = require(path.resolve(file));
	const json = command.data.toJSON();

	const extras = {
		integration_types: [0, 1],
		contexts: [0, 1, 2],
	};
	Object.assign(json, extras);

	if (json.name === 'restart' && process.env.DEV_GUILD_ID) {
		json.guild_ids = [process.env.DEV_GUILD_ID];
	}

	commands.push(json);
}
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
	try {
		let thecountofemall = commands.length;
		console.log(`Started refreshing ${thecountofemall} application (/) commands.`);

		// Send array of objects, not a string
		await rest.put(
			Routes.applicationCommands(process.env.CLIENT_ID),
			{ body: commands }
		);

		console.log(`Successfully reloaded ${thecountofemall} application (/) commands.`);
	} catch (error) {
		console.error(error);
	}
})();