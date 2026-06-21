import { isValidUsername } from '../../utils/helpers.js';
import { buildTpCommand } from '../../utils/teleport.js';

// !tp <player> — teleport yourself to another player (staff-gated by default).
// The bot runs a server "/tp" command, so it needs permission on the server.
export default {
  name: 'tp',
  description: 'Teleport to another player (requires the bot to have tp permission).',
  aliases: ['teleport'],
  usage: '!tp <player>',
  cooldown: 5,
  permission: 'moderator',
  category: 'teleport',
  async execute(ctx) {
    const { args, config, sender, reply, bot } = ctx;
    if (config.teleport?.enabled === false) return reply('Teleportation is disabled.');
    const target = args[0];
    if (!target) return reply(`Usage: ${ctx.prefix}tp <player>`);
    if (!isValidUsername(target)) return reply('Invalid player name.');

    const cmd = buildTpCommand(config.teleport.tpPlayerToPlayer, { player: sender, target });
    bot.sendRaw(cmd);
    reply(`Teleporting you to ${target}...`);
  }
};
