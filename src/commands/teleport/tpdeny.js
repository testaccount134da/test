import { tpaRequests } from '../../utils/teleport.js';

// !tpdeny — deny a pending teleport request.
export default {
  name: 'tpdeny',
  description: 'Deny a pending teleport request.',
  aliases: ['tpno'],
  usage: '!tpdeny',
  cooldown: 3,
  permission: 0,
  category: 'teleport',
  async execute(ctx) {
    const { sender, reply, bot } = ctx;
    const req = tpaRequests.get(sender.toLowerCase());
    if (!req) return reply('You have no pending teleport requests.');
    tpaRequests.delete(sender.toLowerCase());
    reply('Teleport request denied.');
    bot.whisperTo(req.from, `${sender} denied your teleport request.`);
  }
};
