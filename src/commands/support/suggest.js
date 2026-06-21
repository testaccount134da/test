import { sanitizeChatArg } from '../../utils/helpers.js';

// !suggest <idea> — submit a suggestion for the server.
export default {
  name: 'suggest',
  description: 'Submit a suggestion for the server.',
  aliases: ['suggestion', 'idea'],
  usage: '!suggest <idea>',
  cooldown: 10,
  permission: 0,
  category: 'support',
  async execute(ctx) {
    const { args, db, sender, reply, logger } = ctx;
    const idea = sanitizeChatArg(args.join(' '));
    if (!idea) return reply(`Usage: ${ctx.prefix}suggest <idea>`);
    const record = db.insert('suggestions', { author: sender, idea, status: 'open', votes: 0 });
    logger.category('ticket', `Suggestion #${record.id} from ${sender}: ${idea}`);
    reply(`Suggestion #${record.id} submitted. Thank you!`);
  }
};
