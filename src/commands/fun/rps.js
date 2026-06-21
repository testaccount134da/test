import { pick } from '../../utils/helpers.js';
import { RPS_CHOICES } from '../../data/content.js';

// !rps <rock|paper|scissors> — play rock-paper-scissors against the bot.
export default {
  name: 'rps',
  description: 'Play rock-paper-scissors against the bot.',
  aliases: ['rockpaperscissors'],
  usage: '!rps <rock|paper|scissors>',
  cooldown: 3,
  permission: 0,
  category: 'fun',
  async execute(ctx) {
    const { args, reply } = ctx;
    const player = args[0]?.toLowerCase();
    if (!RPS_CHOICES.includes(player)) {
      return reply('Choose one: rock, paper, or scissors.');
    }
    const bot = pick(RPS_CHOICES);
    let outcome;
    if (player === bot) outcome = "It's a tie!";
    else if (
      (player === 'rock' && bot === 'scissors') ||
      (player === 'paper' && bot === 'rock') ||
      (player === 'scissors' && bot === 'paper')
    ) outcome = 'You win!';
    else outcome = 'You lose!';
    reply(`You: ${player} | Me: ${bot} — ${outcome}`);
  }
};
