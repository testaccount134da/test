import { pick } from '../../utils/helpers.js';

// !coinflip [heads|tails] [bet] — flip a coin, optionally betting coins.
export default {
  name: 'coinflip',
  description: 'Flip a coin. Optionally bet coins on heads or tails.',
  aliases: ['cf', 'flip'],
  usage: '!coinflip [heads|tails] [bet]',
  cooldown: 4,
  permission: 0,
  category: 'fun',
  async execute(ctx) {
    const { args, economy, sender, reply } = ctx;
    const result = pick(['heads', 'tails']);
    const guess = args[0]?.toLowerCase();

    // Plain flip with no wager.
    if (!guess || !['heads', 'tails', 'h', 't'].includes(guess)) {
      return reply(`The coin landed on ${result}!`);
    }
    const normalized = guess.startsWith('h') ? 'heads' : 'tails';

    // Optional wager.
    const betRaw = args[1];
    if (betRaw && economy.enabled) {
      const bet = Math.floor(Number(betRaw));
      if (!Number.isFinite(bet) || bet <= 0) return reply('Enter a valid bet.');
      if (economy.getBalance(sender) < bet) return reply('You cannot afford that bet.');
      if (normalized === result) {
        economy.add(sender, bet, 'coinflip win');
        return reply(`It's ${result}! You won ${economy.format(bet)}. Balance: ${economy.format(economy.getBalance(sender))}.`);
      }
      economy.spend(sender, bet, 'coinflip loss');
      return reply(`It's ${result}! You lost ${economy.format(bet)}. Balance: ${economy.format(economy.getBalance(sender))}.`);
    }

    reply(normalized === result ? `It's ${result}! You guessed right!` : `It's ${result}! You guessed wrong.`);
  }
};
