import { isValidUsername } from '../../utils/helpers.js';

// !removerank <player> — reset a player back to the default rank.
export default {
  name: 'removerank',
  description: 'Reset a player to the default rank.',
  aliases: ['rankremove', 'demote'],
  usage: '!removerank <player>',
  cooldown: 0,
  permission: 'administrator',
  category: 'owner',
  async execute(ctx) {
    const { args, permissions, sender, reply } = ctx;
    const target = args[0];
    if (!target) return reply(`Usage: ${ctx.prefix}removerank <player>`);
    if (!isValidUsername(target)) return reply('Invalid player name.');
    if (permissions.getLevel(target) >= permissions.getLevel(sender)) {
      return reply('You cannot change the rank of someone at or above your level.');
    }
    permissions.resetRank(target);
    reply(`${target} reset to the default rank (${permissions.defaultRank}).`);
  }
};
