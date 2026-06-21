// !reload — hot-reload config, ranks, commands and plugins from disk.
export default {
  name: 'reload',
  description: 'Reload config, commands and plugins without restarting.',
  aliases: ['rl'],
  usage: '!reload',
  cooldown: 0,
  permission: 'developer',
  category: 'owner',
  async execute(ctx) {
    ctx.reply('Reloading...');
    try {
      const result = await ctx.app.reload();
      ctx.reply(`Reloaded ${result.commands} commands and ${result.plugins} plugins.`);
    } catch (err) {
      ctx.reply(`Reload failed: ${err.message}`);
    }
  }
};
