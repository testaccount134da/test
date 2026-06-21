import { isValidUsername, sanitizeChatArg } from '../../utils/helpers.js';
import { buildModCommand, recordPunishment } from '../../utils/moderation.js';

// !warn <player> <reason> — issue a warning. Auto-kicks at the configured limit.
export default {
  name: 'warn',
  description: 'Warn a player. Auto-kicks after too many warnings.',
  aliases: [],
  usage: '!warn <player> <reason>',
  cooldown: 3,
  permission: 'helper',
  category: 'moderation',
  async execute(ctx) {
    const { args, config, db, permissions, sender, reply, bot } = ctx;
    const target = args[0];
    const reason = sanitizeChatArg(args.slice(1).join(' '));
    if (!target || !reason) return reply(`Usage: ${ctx.prefix}warn <player> <reason>`);
    if (!isValidUsername(target)) return reply('Invalid player name.');
    if (permissions.getLevel(target) >= permissions.getLevel(sender)) {
      return reply('You cannot warn someone of equal or higher rank.');
    }

    const key = target.toLowerCase();
    const warnings = db.get('warnings', key, []);
    warnings.push({ reason, by: sender, at: Date.now() });
    db.set('warnings', key, warnings);
    recordPunishment(ctx, { type: 'warn', target, reason });

    const max = config.moderation?.maxWarningsBeforeKick ?? 3;
    reply(`Warned ${target} (${warnings.length}/${max}): ${reason}`);
    bot.whisperTo(target, `You have been warned by ${sender}: ${reason} (${warnings.length}/${max})`);

    // Auto-kick on reaching the limit.
    if (warnings.length >= max && config.moderation?.useServerCommands !== false) {
      bot.sendRaw(buildModCommand(config.moderation.kickCommandFormat, { target, reason: 'Too many warnings' }));
      reply(`${target} reached ${max} warnings and was kicked.`);
    }
  }
};
