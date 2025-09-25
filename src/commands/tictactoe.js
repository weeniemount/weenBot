const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { checkUserAllowsPings } = require('../modules/db.js');
const { privateButtonReplies, emojiTable } = require('../modules/globals.js');
const { updateAchievementProgress } = require('../modules/achievements.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('tictactoe')
		.setDescription('play tic tac toe with someone lol')
		.addUserOption(option =>
			option.setName('opponent')
				.setDescription('the challenger')
				.setRequired(true)),
	async execute(interaction) {
		const opponent = interaction.options.getUser('opponent');
		const playerX = interaction.user;
		const playerO = opponent;

		const isPlayingAgainstBot = playerO.id === interaction.client.user.id || playerO.id === process.env.BOT_ID;
		const isPlayingAgainstSelf = playerX.id === playerO.id;

		// Check ping settings for both players
		const [playerXAllowsPings, playerOAllowsPings] = await Promise.all([
			checkUserAllowsPings(playerX.id),
			checkUserAllowsPings(playerO.id)
		]);

		const formatPlayer = (player, allowsPings) => allowsPings ? `${player}` : player.username;

		let board = Array(9).fill(null);
		const symbols = { [playerX.id]: '❌', [playerO.id]: '⭕' };

		let currentPlayer = Math.random() < 0.5 ? playerX : playerO;
		let gameActive = true;
		let botThinking = false;

		const generateButtons = () => {
			const rows = [];
			for (let i = 0; i < 3; i++) {
				const row = new ActionRowBuilder();
				for (let j = 0; j < 3; j++) {
					const idx = i * 3 + j;
					row.addComponents(
						new ButtonBuilder()
							.setCustomId(`ttt_${idx}`)
							.setLabel(board[idx] || '\u200B')
							.setStyle(ButtonStyle.Secondary)
							.setDisabled(board[idx] !== null || !gameActive || botThinking)
					);
				}
				rows.push(row);
			}
			return rows;
		};

		const checkWin = (symbol) => {
			const wins = [
				[0,1,2],[3,4,5],[6,7,8],
				[0,3,6],[1,4,7],[2,5,8],
				[0,4,8],[2,4,6]
			];
			return wins.some(combo => combo.every(i => board[i] === symbol));
		};

		const findWinningMove = (symbol) => {
			for (let i = 0; i < 9; i++) {
				if (!board[i]) {
					board[i] = symbol;
					if (checkWin(symbol)) {
						board[i] = null;
						return i;
					}
					board[i] = null;
				}
			}
			return null;
		};

		const makeAIMove = async () => {
			if (!board.includes(null) || !gameActive) return false;

			botThinking = true;
			await interaction.editReply({ 
				content: `tic tac toe: ${formatPlayer(playerX, playerXAllowsPings)} (❌) vs ${formatPlayer(playerO, playerOAllowsPings)} (⭕)\nweenBot is thinking...`, 
				components: generateButtons() 
			});

			await new Promise(resolve => setTimeout(resolve, 500));

			let move = findWinningMove(symbols[playerO.id]);

			if (move === null) move = findWinningMove(symbols[playerX.id]);

			if (move === null) {
				const emptyIndices = board.map((v, i) => v === null ? i : null).filter(v => v !== null);
				move = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
			}

			board[move] = symbols[playerO.id];
			botThinking = false;

			if (checkWin(symbols[playerO.id])) {
				gameActive = false;
				await interaction.editReply({ content: `weenBot won! <a:weenie:${emojiTable["weenie"]}>`, components: generateButtons() });
				collector.stop();
				return true;
			}

			if (!board.includes(null)) {
				gameActive = false;
				await interaction.editReply({ content: `no one wins lmfao`, components: generateButtons() });
				collector.stop();
				return true;
			}

			currentPlayer = playerX;
			await interaction.editReply({ content: `tic tac toe: ${formatPlayer(playerX, playerXAllowsPings)} (❌) vs ${formatPlayer(playerO, playerOAllowsPings)} (⭕)\nit's your turn`, components: generateButtons() });
			return false;
		};

		const message = await interaction.reply({
			content: `tic tac toe: ${formatPlayer(playerX, playerXAllowsPings)} (❌) vs ${formatPlayer(playerO, playerOAllowsPings)} (⭕)\nit's ${formatPlayer(currentPlayer, currentPlayer.id === playerX.id ? playerXAllowsPings : playerOAllowsPings)}'s turn`,
			components: generateButtons(),
			fetchReply: true
		});

		const collector = message.createMessageComponentCollector();

		if (currentPlayer.id === interaction.client.user.id || currentPlayer.id === process.env.BOT_ID) {
			setTimeout(makeAIMove, 1000);
		}

		collector.on('collect', async i => {
			if (!gameActive || botThinking) {
				return i.reply({ content: privateButtonReplies(), ephemeral: true });
			}

			if (i.user.id !== currentPlayer.id) {
				return i.reply({ content: privateButtonReplies(), ephemeral: true });
			}

			const idx = parseInt(i.customId.split('_')[1]);
			board[idx] = symbols[currentPlayer.id];

			if (checkWin(symbols[currentPlayer.id])) {
				gameActive = false;
				
				if (isPlayingAgainstBot && currentPlayer.id === playerX.id) {
					const result = await updateAchievementProgress(
						interaction.user.id,
						'TICTACTOE_WEENBOT',
						1,
						interaction
					);
				}
				
				if (isPlayingAgainstSelf) {
					const result = await updateAchievementProgress(
						interaction.user.id,
						'TICTACTOE_SELF',
						1,
						interaction
					);
				}
				
				await i.update({ 
					content: `${formatPlayer(currentPlayer, currentPlayer.id === playerX.id ? playerXAllowsPings : playerOAllowsPings)} won!`, 
					components: generateButtons() 
				});
				collector.stop();
				return;
			}

			if (!board.includes(null)) {
				gameActive = false;
				await i.update({ content: `no one wins lmfao`, components: generateButtons() });
				collector.stop();
				return;
			}

			currentPlayer = currentPlayer.id === playerX.id ? playerO : playerX;
			await i.update({ 
				content: `tic tac toe: ${formatPlayer(playerX, playerXAllowsPings)} (❌) vs ${formatPlayer(playerO, playerOAllowsPings)} (⭕)\nit's ${formatPlayer(currentPlayer, currentPlayer.id === playerX.id ? playerXAllowsPings : playerOAllowsPings)}'s turn`, 
				components: generateButtons() 
			});

			if (currentPlayer.id === interaction.client.user.id) {
				setTimeout(makeAIMove, 1000);
			}
		});

		collector.on('end', async () => {
			gameActive = false;
			const disabledRows = generateButtons().map(row => {
				row.components.forEach(btn => btn.setDisabled(true));
				return row;
			});
			await interaction.editReply({ components: disabledRows });
		});
	},
};