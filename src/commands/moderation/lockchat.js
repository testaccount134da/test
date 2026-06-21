// !lockchat — flag chat as locked. The bot announces it and ignores non-staff
// commands while locked (full server-chat locking needs a server plugin).
export default {
  name: 'lockchat',
  description: 'Lock public chat (bot announces and restricts itself).',
  aliases: ['chatlock'],
  usage: '!lockchat',
  cooldown: 3,
  permission: 'moderator',
  category: 'moderation',
  async execute(ctx) {
    const { db, sender, reply, bot, logger } = ctx;
    db.set('settings', 'chatLocked', true);
    logger.category('moderation', `${sender} locked chat`);
    bot.sendMessage('[CHAT LOCKED] Only staff may use bot commands now.');
    reply('Chat locked.');
  }
};
