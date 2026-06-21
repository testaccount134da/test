// !restart — reconnect the Minecraft client without stopping the process.
export default {
  name: 'restart',
  description: 'Reconnect the bot to the server.',
  aliases: ['reconnect'],
  usage: '!restart',
  cooldown: 0,
  permission: 'owner',
  ownerOnly: true,
  category: 'owner',
  async execute(ctx) {
    ctx.reply('Reconnecting...');
    ctx.logger.warn('Owner', `${ctx.sender} issued restart.`);
    ctx.app.restart();
  }
};
