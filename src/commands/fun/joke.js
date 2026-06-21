import { pick } from '../../utils/helpers.js';
import { JOKES } from '../../data/content.js';

// !joke — tell a random Minecraft-themed joke.
export default {
  name: 'joke',
  description: 'Tell a random joke.',
  aliases: ['jokes'],
  usage: '!joke',
  cooldown: 4,
  permission: 0,
  category: 'fun',
  async execute(ctx) {
    ctx.reply(pick(JOKES));
  }
};
