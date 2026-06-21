// !purge [lines] — clear visible chat by pushing blank lines (common bot trick;
// the bot cannot delete server-side history without a plugin).
export default {
  name: 'purge',
  description: 'Clear visible chat by sending blank lines.',
  aliases: ['clearchat', 'cc'],
  usage: '!purge [lines]',
  cooldown: 10,
  permission: 'moderator',
  category: 'moderation',
  async execute(ctx) {
    const { args, bot, sender, logger, reply } = ctx;
    const lines = Math.min(100, Math.max(10, Math.floor(Number(args[0]) || 50)));
    for (let i = 0; i < lines; i++) bot.sendMessage('.');
    bot.sendMessage(`[Chat cleared by ${sender}]`);
    logger.category('moderation', `${sender} purged ${lines} lines of chat`);
    reply(`Cleared ~${lines} lines of chat.`);
  }
};
