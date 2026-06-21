import { sanitizeChatArg } from '../../utils/helpers.js';

// !reply <text> — reply to the last player who privately messaged you.
export default {
  name: 'reply',
  description: 'Reply to the last person who messaged you via the bot.',
  aliases: ['r'],
  usage: '!reply <text>',
  cooldown: 3,
  permission: 0,
  category: 'messaging',
  async execute(ctx) {
    const { args, bot, db, sender, reply } = ctx;
    const me = db.getUser(sender);
    const target = me.lastMessenger;
    if (!target) return reply('Nobody has messaged you recently.');
    const text = sanitizeChatArg(args.join(' '));
    if (!text) return reply(`Usage: ${ctx.prefix}reply <text>`);

    const targetUser = db.getUser(target);
    targetUser.lastMessenger = sender;
    db.saveUser(targetUser);

    bot.whisperTo(target, `[PM from ${sender}] ${text}`);
    reply(`Replied to ${target}.`);
  }
};
