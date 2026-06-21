import { isValidUsername, sanitizeChatArg } from '../../utils/helpers.js';
import { buildModCommand, recordPunishment } from '../../utils/moderation.js';

// !kick <player> [reason] — kick a player from the server (bot needs permission).
export default {
  name: 'kick',
  description: 'Kick a player from the server.',
  aliases: [],
  usage: '!kick <player> [reason]',
  cooldown: 3,
  permission: 'moderator',
  category: 'moderation',
  async execute(ctx) {
    const { args, config, permissions, sender, reply, bot } = ctx;
    const target = args[0];
    const reason = sanitizeChatArg(args.slice(1).join(' '));
    if (!target) return reply(`Usage: ${ctx.prefix}kick <player> [reason]`);
    if (!isValidUsername(target)) return reply('Invalid player name.');
    // Prevent acting on someone of equal/higher rank.
    if (permissions.getLevel(target) >= permissions.getLevel(sender)) {
      return reply('You cannot kick someone of equal or higher rank.');
    }

    recordPunishment(ctx, { type: 'kick', target, reason });
    if (config.moderation?.useServerCommands !== false) {
      bot.sendRaw(buildModCommand(config.moderation.kickCommandFormat, { target, reason }));
    }
    reply(`Kicked ${target}${reason ? ` (${reason})` : ''}.`);
  }
};
