import { isValidUsername, formatDuration } from '../../utils/helpers.js';

// !warnings <player> — list a player's warnings.
export default {
  name: 'warnings',
  description: "View a player's warnings.",
  aliases: ['warns'],
  usage: '!warnings <player>',
  cooldown: 3,
  permission: 'helper',
  category: 'moderation',
  async execute(ctx) {
    const { args, db, reply } = ctx;
    const target = args[0];
    if (!target) return reply(`Usage: ${ctx.prefix}warnings <player>`);
    if (!isValidUsername(target)) return reply('Invalid player name.');
    const warnings = db.get('warnings', target.toLowerCase(), []);
    if (!warnings.length) return reply(`${target} has no warnings.`);
    reply(`${target} has ${warnings.length} warning(s):`);
    warnings.forEach((w, i) =>
      reply(`${i + 1}. ${w.reason} — by ${w.by}, ${formatDuration(Date.now() - w.at)} ago`)
    );
  }
};
