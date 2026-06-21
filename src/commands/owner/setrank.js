import { isValidUsername } from '../../utils/helpers.js';

// !setrank <player> <rank> — assign a rank to a player.
export default {
  name: 'setrank',
  description: 'Set a player\'s rank.',
  aliases: ['rankset', 'promote'],
  usage: '!setrank <player> <rank>',
  cooldown: 0,
  permission: 'administrator',
  category: 'owner',
  async execute(ctx) {
    const { args, permissions, sender, reply } = ctx;
    const [target, rank] = args;
    if (!target || !rank) return reply(`Usage: ${ctx.prefix}setrank <player> <rank>`);
    if (!isValidUsername(target)) return reply('Invalid player name.');

    // You cannot assign a rank equal to or higher than your own (anti-escalation).
    if (permissions.levelOf(rank) >= permissions.getLevel(sender)) {
      return reply('You cannot assign a rank equal to or higher than your own.');
    }
    // You cannot modify someone already at/above your level.
    if (permissions.getLevel(target) >= permissions.getLevel(sender)) {
      return reply('You cannot change the rank of someone at or above your level.');
    }
    try {
      permissions.setRank(target, rank.toLowerCase());
      reply(`${target} is now rank "${rank.toLowerCase()}".`);
    } catch (err) {
      reply(err.message);
    }
  }
};
