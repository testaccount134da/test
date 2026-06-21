import { sanitizeChatArg } from '../../utils/helpers.js';

// !contact <message> / !staff — request help from online staff.
export default {
  name: 'contact',
  description: 'Send a message to all online staff members.',
  aliases: ['staffrequest', 'helpop'],
  usage: '!contact <message>',
  cooldown: 15,
  permission: 0,
  category: 'support',
  async execute(ctx) {
    const { args, config, permissions, sender, reply, bot, logger } = ctx;
    const message = sanitizeChatArg(args.join(' '));
    if (!message) return reply(`Usage: ${ctx.prefix}contact <message>`);

    const level = config.support?.staffPingRankLevel ?? 20;
    const staffOnline = bot.onlinePlayers().filter((p) => permissions.has(p, level));
    for (const p of staffOnline) {
      bot.whisperTo(p, `[STAFF REQUEST] ${sender}: ${message}`);
    }
    logger.category('moderation', `Staff request from ${sender}: ${message}`);
    reply(staffOnline.length
      ? `Your message was sent to ${staffOnline.length} online staff member(s).`
      : 'No staff are online right now, but your request has been logged.');
  }
};
