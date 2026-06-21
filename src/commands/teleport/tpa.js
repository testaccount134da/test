import { isValidUsername } from '../../utils/helpers.js';
import { tpaRequests } from '../../utils/teleport.js';

// !tpa <player> — request to teleport to another player. They use !tpaccept.
export default {
  name: 'tpa',
  description: 'Request to teleport to another player.',
  aliases: ['tprequest'],
  usage: '!tpa <player>',
  cooldown: 5,
  permission: 0,
  category: 'teleport',
  async execute(ctx) {
    const { args, config, sender, reply, bot } = ctx;
    if (config.teleport?.enabled === false) return reply('Teleportation is disabled.');
    const target = args[0];
    if (!target) return reply(`Usage: ${ctx.prefix}tpa <player>`);
    if (!isValidUsername(target)) return reply('Invalid player name.');
    if (target.toLowerCase() === sender.toLowerCase()) return reply("You can't teleport to yourself.");

    const timeout = (config.teleport.requestTimeoutSeconds ?? 60) * 1000;
    tpaRequests.set(target.toLowerCase(), { from: sender, at: Date.now() });
    // Expire the request automatically.
    setTimeout(() => {
      const req = tpaRequests.get(target.toLowerCase());
      if (req && req.from === sender) tpaRequests.delete(target.toLowerCase());
    }, timeout);

    bot.whisperTo(target, `${sender} wants to teleport to you. Type ${ctx.prefix}tpaccept or ${ctx.prefix}tpdeny.`);
    reply(`Teleport request sent to ${target}.`);
  }
};
