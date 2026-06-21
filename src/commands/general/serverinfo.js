// !serverinfo — details about the Minecraft server the bot is connected to.
export default {
  name: 'serverinfo',
  description: 'Show information about the connected server.',
  aliases: ['server', 'si'],
  usage: '!serverinfo',
  cooldown: 5,
  permission: 0,
  category: 'general',
  async execute(ctx) {
    const { bot, config, reply } = ctx;
    const s = config.server;
    reply(`Server: ${s.host}:${s.port ?? 25565} | Version: ${bot.mc?.version ?? 'unknown'}`);
    const players = bot.onlinePlayers();
    reply(`Players online: ${players.length}${players.length ? ' — ' + players.slice(0, 15).join(', ') : ''}`);
  }
};
