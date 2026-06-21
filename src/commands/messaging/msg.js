import { isValidUsername, sanitizeChatArg } from '../../utils/helpers.js';

// !msg <player> <text> — relay a private message to another player via the bot.
export default {
  name: 'msg',
  description: 'Send a private message to another player through the bot.',
  aliases: ['message', 'whisper', 'w', 'tell'],
  usage: '!msg <player> <text>',
  cooldown: 3,
  permission: 0,
  category: 'messaging',
  async execute(ctx) {
    const { args, bot, db, sender, reply } = ctx;
    const target = args[0];
    const text = sanitizeChatArg(args.slice(1).join(' '));
    if (!target || !text) return reply(`Usage: ${ctx.prefix}msg <player> <text>`);
    if (!isValidUsername(target)) return reply('Invalid player name.');

    // Record who messaged the target last so they can use !reply.
    const targetUser = db.getUser(target);
    targetUser.lastMessenger = sender;
    db.saveUser(targetUser);

    bot.whisperTo(target, `[PM from ${sender}] ${text}`);
    reply(`Message sent to ${target}.`);
  }
};
