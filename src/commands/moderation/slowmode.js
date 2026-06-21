// !slowmode <seconds|off> — set a chat slowmode the bot announces and tracks.
// Note: real enforcement requires a server plugin; the bot stores + announces
// the setting and warns players who chat too quickly.
export default {
  name: 'slowmode',
  description: 'Set chat slowmode in seconds (0/off to disable).',
  aliases: ['slow'],
  usage: '!slowmode <seconds|off>',
  cooldown: 3,
  permission: 'moderator',
  category: 'moderation',
  async execute(ctx) {
    const { args, db, sender, logger, reply, bot } = ctx;
    const arg = args[0]?.toLowerCase();
    if (!arg) {
      const current = db.get('settings', 'slowmode', 0);
      return reply(`Slowmode is currently ${current ? current + 's' : 'off'}.`);
    }
    const seconds = arg === 'off' ? 0 : Math.max(0, Math.floor(Number(arg)));
    if (!Number.isFinite(seconds)) return reply('Provide a number of seconds or "off".');
    db.set('settings', 'slowmode', seconds);
    logger.category('moderation', `${sender} set slowmode to ${seconds}s`);
    bot.sendMessage(seconds ? `Chat slowmode enabled: ${seconds}s between messages.` : 'Chat slowmode disabled.');
    reply(`Slowmode set to ${seconds ? seconds + 's' : 'off'}.`);
  }
};
