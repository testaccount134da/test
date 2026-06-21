import { pick } from '../../utils/helpers.js';
import { FACTS } from '../../data/content.js';

// !fact — share a random Minecraft fact.
export default {
  name: 'fact',
  description: 'Share a random Minecraft fact.',
  aliases: ['facts', 'randomfact'],
  usage: '!fact',
  cooldown: 4,
  permission: 0,
  category: 'fun',
  async execute(ctx) {
    ctx.reply(`Did you know? ${pick(FACTS)}`);
  }
};
