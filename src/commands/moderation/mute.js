import { isValidUsername, sanitizeChatArg, parseDuration, formatDuration } from '../../utils/helpers.js';
import { buildModCommand, recordPunishment } from '../../utils/moderation.js';

// !mute <player> [duration] [reason] — mute a player (server-side + bot-side).
export default {
  name: 'mute',
  description: 'Mute a player. Duration like 10m, 1h, 1d.',
  aliases: [],
  usage: '!mute <player> [duration] [reason]',
  cooldown: 3,
  permission: 'moderator',
  category: 'moderation',
  async execute(ctx) {
    const { args, config, permissions, antiSpam, sender, reply, bot } = ctx;
    const target = args[0];
    if (!target) return reply(`Usage: ${ctx.prefix}mute <player> [duration] [reason]`);
    if (!isValidUsername(target)) return reply('Invalid player name.');
    if (permissions.getLevel(target) >= permissions.getLevel(sender)) {
      return reply('You cannot mute someone of equal or higher rank.');
    }

    // Optional duration as the second argument.
    let durationStr = '';
    let reasonStart = 1;
    if (args[1] && parseDuration(args[1])) {
      durationStr = args[1];
      reasonStart = 2;
    }
    const reason = sanitizeChatArg(args.slice(reasonStart).join(' '));

    recordPunishment(ctx, { type: 'mute', target, reason, duration: durationStr });
    if (config.moderation?.useServerCommands !== false) {
      bot.sendRaw(buildModCommand(config.moderation.muteCommandFormat, { target, reason, duration: durationStr }));
    }
    // Bot-side: also stop the bot from responding to / relaying their spam.
    const ms = parseDuration(durationStr) ?? 3600000;
    antiSpam.mutedUntil.set(target.toLowerCase(), Date.now() + ms);

    reply(`Muted ${target}${durationStr ? ` for ${formatDuration(ms)}` : ''}${reason ? ` (${reason})` : ''}.`);
  }
};
