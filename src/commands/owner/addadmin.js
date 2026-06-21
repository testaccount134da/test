import { isValidUsername } from '../../utils/helpers.js';

// !addadmin <player> — shortcut to grant the administrator rank.
export default {
  name: 'addadmin',
  description: 'Grant a player the administrator rank.',
  aliases: [],
  usage: '!addadmin <player>',
  cooldown: 0,
  permission: 'owner',
  ownerOnly: true,
  category: 'owner',
  async execute(ctx) {
    const { args, permissions, reply } = ctx;
    const target = args[0];
    if (!target) return reply(`Usage: ${ctx.prefix}addadmin <player>`);
    if (!isValidUsername(target)) return reply('Invalid player name.');
    try {
      permissions.setRank(target, 'administrator');
      reply(`${target} is now an administrator.`);
    } catch (err) {
      reply(err.message);
    }
  }
};
