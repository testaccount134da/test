import { sanitizeChatArg } from '../../utils/helpers.js';

// !announce <message> — send a single highlighted announcement to chat.
export default {
  name: 'announce',
  description: 'Send an announcement to public chat.',
  aliases: ['ann'],
  usage: '!announce <message>',
  cooldown: 5,
  permission: 'moderator',
  category: 'moderation',
  async execute(ctx) {
    const text = sanitizeChatArg(ctx.args.join(' '));
    if (!text) return ctx.reply(`Usage: ${ctx.prefix}announce <message>`);
    if (text.startsWith('/')) return ctx.reply('Announcements cannot start with "/".');
    ctx.bot.sendMessage(`[ANNOUNCEMENT] ${text}`);
    ctx.logger.category('moderation', `${ctx.sender} announced: ${text}`);
  }
};
