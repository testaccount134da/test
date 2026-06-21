// !ping — quick liveness check; also reports the bot's network latency if known.
export default {
  name: 'ping',
  description: 'Check that the bot is responsive.',
  aliases: ['p'],
  usage: '!ping',
  cooldown: 3,
  permission: 0,
  category: 'general',
  async execute(ctx) {
    const latency = ctx.bot.mc?.player?.ping;
    const extra = typeof latency === 'number' ? ` (server latency: ${latency}ms)` : '';
    ctx.reply(`Pong!${extra}`);
  }
};
