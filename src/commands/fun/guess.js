import { randInt } from '../../utils/helpers.js';

// In-memory number-guessing games keyed by lowercase username.
const games = new Map();

// !guess — start a 1-100 guessing game; !guess <number> to guess.
export default {
  name: 'guess',
  description: 'Guess a number 1-100. Start with !guess, then !guess <number>.',
  aliases: ['guessgame'],
  usage: '!guess [number]',
  cooldown: 2,
  permission: 0,
  category: 'fun',
  async execute(ctx) {
    const { args, sender, economy, reply } = ctx;
    const key = sender.toLowerCase();
    let game = games.get(key);

    if (!game) {
      game = { number: randInt(1, 100), tries: 0 };
      games.set(key, game);
      return reply('I picked a number between 1 and 100. Guess with !guess <number>.');
    }

    const guess = Math.floor(Number(args[0]));
    if (!Number.isFinite(guess)) return reply('Guess with !guess <number> (1-100).');
    game.tries++;

    if (guess === game.number) {
      games.delete(key);
      const reward = Math.max(10, 100 - game.tries * 10);
      if (economy.enabled) economy.add(sender, reward, 'guess win');
      return reply(`Correct in ${game.tries} tries!${economy.enabled ? ` +${economy.format(reward)}` : ''}`);
    }
    reply(guess < game.number ? 'Higher!' : 'Lower!');
  }
};
