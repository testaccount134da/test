import { buildTpCommand, tpaRequests } from '../../utils/teleport.js';

// !tpaccept — accept a pending teleport request and run the server teleport.
export default {
  name: 'tpaccept',
  description: 'Accept a pending teleport request.',
  aliases: ['tpyes'],
  usage: '!tpaccept',
  cooldown: 3,
  permission: 0,
  category: 'teleport',
  async execute(ctx) {
    const { config, sender, reply, bot } = ctx;
    const req = tpaRequests.get(sender.toLowerCase());
    if (!req) return reply('You have no pending teleport requests.');
    tpaRequests.delete(sender.toLowerCase());

    const cmd = buildTpCommand(config.teleport.tpPlayerToPlayer, { player: req.from, target: sender });
    bot.sendRaw(cmd);
    reply(`Accepted — teleporting ${req.from} to you.`);
    bot.whisperTo(req.from, `${sender} accepted your teleport request.`);
  }
};
