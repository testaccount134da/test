import { isValidUsername } from '../../utils/helpers.js';

// !removeadmin <player> — revoke admin by resetting to the default rank.
export default {
  name: 'removeadmin',
  description: 'Revoke a player\'s administrator rank.',
  aliases: [],
  usage: '!removeadmin <player>',
  cooldown: 0,
  permission: 'owner',
  ownerOnly: true,
  category: 'owner',
  async execute(ctx) {
    const { args, permissions, reply } = ctx;
    const target = args[0];
    if (!target) return reply(`Usage: ${ctx.prefix}removeadmin <player>`);
    if (!isValidUsername(target)) return reply('Invalid player name.');
    permissions.resetRank(target);
    reply(`${target}'s admin rank has been revoked (reset to ${permissions.defaultRank}).`);
  }
};
