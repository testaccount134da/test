import { pick } from '../../utils/helpers.js';
import { TRIVIA } from '../../data/content.js';

// In-memory active trivia games keyed by lowercase username.
const games = new Map();
const REWARD = 50;

// !trivia — start a trivia question; !trivia <answer> to answer your question.
export default {
  name: 'trivia',
  description: 'Start a trivia question, then answer with "!trivia <answer>".',
  aliases: ['quiz'],
  usage: '!trivia [your answer]',
  cooldown: 3,
  permission: 0,
  category: 'fun',
  async execute(ctx) {
    const { args, sender, economy, reply } = ctx;
    const key = sender.toLowerCase();
    const active = games.get(key);

    // Answering an existing question.
    if (active && args.length) {
      const guess = args.join(' ').trim().toLowerCase();
      games.delete(key);
      if (guess === active.a.toLowerCase()) {
        if (economy.enabled) economy.add(sender, REWARD, 'trivia win');
        return reply(`Correct! ${economy.enabled ? `+${economy.format(REWARD)}` : 'Nice!'}`);
      }
      return reply(`Wrong! The answer was "${active.a}".`);
    }

    // Starting a new question (or re-showing the current one).
    if (active) return reply(`Your question: ${active.q} (answer with !trivia <answer>)`);
    const q = pick(TRIVIA);
    games.set(key, q);
    // Expire the question after 60 seconds.
    setTimeout(() => games.delete(key), 60000);
    reply(`Trivia: ${q.q}`);
    reply('Answer with !trivia <your answer> within 60 seconds.');
  }
};
