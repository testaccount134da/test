import { sanitizeChatArg, sleep } from '../../utils/helpers.js';

// !broadcast <message> — emphasised, repeated broadcast to chat.
export default {
  name: 'broadcast',
  description: 'Broadcast an important message (sent with emphasis).',
  aliases: ['bc'],
  usage: '!broadcast <message>',
  cooldown: 10,
  permission: 'administrator',
  category: 'moderation',
  async execute(ctx) {
    const text = sanitizeChatArg(ctx.args.join(' '));
    if (!text) return ctx.reply(`Usage: ${ctx.prefix}broadcast <message>`);
    if (text.startsWith('/')) return ctx.reply('Broadcasts cannot start with "/".');
    const bot = ctx.bot;
    bot.sendMessage('========================================');
    bot.sendMessage(`>> ${text}`);
    bot.sendMessage('========================================');
    ctx.logger.category('moderation', `${ctx.sender} broadcast: ${text}`);
    await sleep(0);
  }
};
