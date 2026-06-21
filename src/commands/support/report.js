import { sanitizeChatArg, isValidUsername } from '../../utils/helpers.js';

// !report <player> <reason> — report a player to staff.
export default {
  name: 'report',
  description: 'Report a player to the staff team.',
  aliases: [],
  usage: '!report <player> <reason>',
  cooldown: 10,
  permission: 0,
  category: 'support',
  async execute(ctx) {
    const { args, db, config, permissions, sender, reply, logger, bot } = ctx;
    const target = args[0];
    const reason = sanitizeChatArg(args.slice(1).join(' '));
    if (!target || !reason) return reply(`Usage: ${ctx.prefix}report <player> <reason>`);
    if (!isValidUsername(target)) return reply('Invalid player name.');

    const record = db.insert('reports', { reporter: sender, target, reason, status: 'open' });
    logger.category('moderation', `Report #${record.id}: ${sender} reported ${target} — ${reason}`);
    reply(`Report #${record.id} submitted against ${target}. Thank you.`);

    // Notify online staff.
    for (const p of bot.onlinePlayers()) {
      if (permissions.has(p, config.support?.staffPingRankLevel ?? 20)) {
        bot.whisperTo(p, `New report #${record.id}: ${sender} -> ${target}: ${reason}`);
      }
    }
  }
};
