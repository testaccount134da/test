import { pick } from '../../utils/helpers.js';
import { EIGHTBALL } from '../../data/content.js';

// !8ball <question> — ask the magic 8-ball.
export default {
  name: '8ball',
  description: 'Ask the magic 8-ball a yes/no question.',
  aliases: ['eightball', '8b'],
  usage: '!8ball <question>',
  cooldown: 3,
  permission: 0,
  category: 'fun',
  async execute(ctx) {
    if (!ctx.args.length) return ctx.reply('Ask me a question! e.g. !8ball will I find diamonds?');
    ctx.reply(`🎱 ${pick(EIGHTBALL)}`);
  }
};
