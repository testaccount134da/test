import { isValidUsername } from '../../utils/helpers.js';
import { buildModCommand, recordPunishment } from '../../utils/moderation.js';

// !unmute <player> — remove a mute (server-side + bot-side).
export default {
  name: 'unmute',
  description: 'Unmute a player.',
  aliases: [],
  usage: '!unmute <player>',
  cooldown: 3,
  permission: 'moderator',
  category: 'moderation',
  async execute(ctx) {
    const { args, config, antiSpam, reply, bot } = ctx;
    const target = args[0];
    if (!target) return reply(`Usage: ${ctx.prefix}unmute <player>`);
    if (!isValidUsername(target)) return reply('Invalid player name.');

    recordPunishment(ctx, { type: 'unmute', target, reason: '' });
    if (config.moderation?.useServerCommands !== false) {
      bot.sendRaw(buildModCommand(config.moderation.unmuteCommandFormat, { target }));
    }
    antiSpam.clear(target);
    reply(`Unmuted ${target}.`);
  }
};
