// !shutdown — gracefully stop the bot process (persists data first).
export default {
  name: 'shutdown',
  description: 'Shut down the bot process.',
  aliases: ['stop'],
  usage: '!shutdown',
  cooldown: 0,
  permission: 'owner',
  ownerOnly: true,
  category: 'owner',
  async execute(ctx) {
    ctx.reply('Shutting down. Goodbye!');
    ctx.logger.warn('Owner', `${ctx.sender} issued shutdown.`);
    await ctx.app.shutdown(0, `shutdown by ${ctx.sender}`);
  }
};
