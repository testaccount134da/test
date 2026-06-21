import { sanitizeChatArg } from '../../utils/helpers.js';

// !bug <description> — submit a bug report.
export default {
  name: 'bug',
  description: 'Report a bug to the server team.',
  aliases: ['bugreport'],
  usage: '!bug <description>',
  cooldown: 10,
  permission: 0,
  category: 'support',
  async execute(ctx) {
    const { args, db, sender, reply, logger } = ctx;
    const desc = sanitizeChatArg(args.join(' '));
    if (!desc) return reply(`Usage: ${ctx.prefix}bug <description>`);
    const record = db.insert('bugs', { author: sender, description: desc, status: 'open' });
    logger.category('ticket', `Bug #${record.id} from ${sender}: ${desc}`);
    reply(`Bug report #${record.id} submitted. Thanks for helping improve the server!`);
  }
};
