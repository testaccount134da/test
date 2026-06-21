// !unlockchat — re-open chat after a lockchat.
export default {
  name: 'unlockchat',
  description: 'Unlock public chat.',
  aliases: ['chatunlock'],
  usage: '!unlockchat',
  cooldown: 3,
  permission: 'moderator',
  category: 'moderation',
  async execute(ctx) {
    const { db, sender, reply, bot, logger } = ctx;
    db.set('settings', 'chatLocked', false);
    logger.category('moderation', `${sender} unlocked chat`);
    bot.sendMessage('[CHAT UNLOCKED] Commands are open to everyone again.');
    reply('Chat unlocked.');
  }
};
