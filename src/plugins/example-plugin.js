// =============================================================================
//  Example plugin
// -----------------------------------------------------------------------------
//  Demonstrates the plugin architecture. Copy this file, rename it, and edit
//  it to add features WITHOUT touching any core file. Drop it in src/plugins/
//  and it loads automatically on startup (or via !reload).
//
//  The `api` object exposes every core service (config, db, economy,
//  permissions, ai, logger, bot, commands) plus two helpers:
//    api.registerCommand(commandObject)
//    api.on(botEvent, handler)
// =============================================================================

export default {
  name: 'example-plugin',
  version: '1.0.0',

  async load(api) {
    // 1) Register a brand-new command — full command framework support.
    api.registerCommand({
      name: 'hello',
      description: 'A friendly greeting from the example plugin.',
      aliases: ['hi', 'hey'],
      usage: '!hello',
      cooldown: 3,
      permission: 0,
      category: 'fun',
      async execute(ctx) {
        ctx.reply(`Hello, ${ctx.sender}! 👋 This command comes from a plugin.`);
      }
    });

    // 2) An economy-aware command added by a plugin.
    api.registerCommand({
      name: 'flexrich',
      description: 'Brag about your balance.',
      usage: '!flexrich',
      cooldown: 10,
      permission: 0,
      category: 'economy',
      async execute(ctx) {
        const bal = ctx.economy.getBalance(ctx.sender);
        ctx.bot.sendMessage(`${ctx.sender} is flexing ${ctx.economy.format(bal)}! 💰`);
      }
    });

    // 3) Listen to a raw bot event. Tracked so it is cleanly removed on unload.
    api.on('playerJoined', (player) => {
      if (player?.username && player.username !== api.bot.mc?.username) {
        api.bot.sendMessage(`Welcome to the server, ${player.username}!`);
      }
    });

    api.logger.info('example-plugin', 'Loaded: added !hello, !flexrich and a join greeter.');
  },

  async unload(api) {
    // Release any resources here (timers, sockets, etc.). Listeners added via
    // api.on() are removed automatically by the PluginLoader.
    api.logger.info('example-plugin', 'Unloaded.');
  }
};
