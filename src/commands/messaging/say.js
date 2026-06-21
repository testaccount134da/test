import { sanitizeChatArg } from '../../utils/helpers.js';

// !say <text> — make the bot speak in public chat.
// Restricted to Helper+ since it lets a player put words in the bot's mouth.
export default {
  name: 'say',
  description: 'Make the bot say something in public chat.',
  aliases: ['echo'],
  usage: '!say <text>',
  cooldown: 3,
  permission: 'helper',
  category: 'messaging',
  async execute(ctx) {
    const text = sanitizeChatArg(ctx.args.join(' '));
    if (!text) return ctx.reply(`Usage: ${ctx.prefix}say <text>`);
    // Never let !say be used to issue server commands through the bot.
    if (text.startsWith('/')) return ctx.reply('I will not send server commands via !say.');
    ctx.bot.sendMessage(text);
  }
};
