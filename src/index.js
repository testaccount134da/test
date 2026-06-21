// =============================================================================
//  Minecraft Support Bot — entry point
// -----------------------------------------------------------------------------
//  Boots every subsystem in dependency order, loads commands + plugins, connects
//  to the server, and installs graceful-shutdown handlers.
//
//  Run with:  npm start
// =============================================================================

import 'dotenv/config';
import path from 'node:path';
import url from 'node:url';

import Logger from './core/Logger.js';
import ConfigManager from './core/ConfigManager.js';
import Database from './core/Database.js';
import PermissionManager from './core/PermissionManager.js';
import EconomyManager from './core/EconomyManager.js';
import AntiSpam from './core/AntiSpam.js';
import AIManager from './core/AIManager.js';
import CommandManager from './core/CommandManager.js';
import PluginLoader from './core/PluginLoader.js';
import Bot from './core/Bot.js';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const COMMANDS_DIR = path.join(__dirname, 'commands');
const PLUGINS_DIR = path.join(__dirname, 'plugins');

async function main() {
  // --- Bootstrap config + logger first so everything else can log. ----------
  const bootLogger = new Logger({ level: 'info' });
  let configManager;
  try {
    configManager = new ConfigManager(bootLogger);
  } catch (err) {
    bootLogger.error('Boot', 'Configuration error:', err.message);
    process.exit(1);
  }
  const config = configManager.config;

  // Real logger using config-driven settings.
  const logger = new Logger({
    level: config.logging?.level ?? 'info',
    toFile: config.logging?.toFile ?? true,
    directory: config.logging?.directory ?? 'logs',
    categories: config.logging?.categories ?? {}
  });

  logger.info('Boot', '====================================================');
  logger.info('Boot', '  Minecraft Support Bot starting up');
  logger.info('Boot', '====================================================');

  // --- Core services --------------------------------------------------------
  const db = new Database(logger, config.database ?? {});
  const permissions = new PermissionManager(configManager.ranks, db, config, logger);
  const economy = new EconomyManager(db, config, logger);
  const antiSpam = new AntiSpam(config, permissions, logger);
  const ai = new AIManager(config, logger);

  // Shared service bag injected into commands, plugins, and the bot.
  const services = {
    config,
    configManager,
    logger,
    db,
    permissions,
    economy,
    antiSpam,
    ai
  };

  const commands = new CommandManager(services);
  const plugins = new PluginLoader(services);
  services.commands = commands;
  services.plugins = plugins;

  const bot = new Bot(services);
  services.bot = bot;

  // --- App controller: lifecycle actions used by owner commands. ------------
  const app = {
    /** Reload config, ranks, commands and plugins from disk at runtime. */
    async reload() {
      logger.info('App', 'Reloading config, commands and plugins...');
      configManager.load();
      permissions.setRanks(configManager.ranks);
      await plugins.unloadAll();
      commands.clear();
      const cmdCount = await commands.loadDirectory(COMMANDS_DIR);
      const plugCount = await plugins.loadDirectory(PLUGINS_DIR);
      logger.info('App', `Reloaded ${cmdCount} commands and ${plugCount} plugins.`);
      return { commands: cmdCount, plugins: plugCount };
    },
    /** Graceful shutdown: persist data, unload plugins, disconnect, exit. */
    async shutdown(code = 0, reason = 'shutdown') {
      if (bot.shuttingDown) return;
      bot.shuttingDown = true;
      logger.info('App', `Shutting down (${reason})...`);
      try { await plugins.unloadAll(); } catch { /* ignore */ }
      try { bot.disconnect(reason); } catch { /* ignore */ }
      db.close();
      logger.info('App', 'Goodbye.');
      // Give logs/queues a moment to flush.
      setTimeout(() => process.exit(code), 500);
    },
    /** Reconnect the Minecraft client without restarting the process. */
    restart() {
      bot.restart();
    }
  };
  services.app = app;

  // --- Load commands + plugins ----------------------------------------------
  const cmdCount = await commands.loadDirectory(COMMANDS_DIR);
  const plugCount = await plugins.loadDirectory(PLUGINS_DIR);
  logger.info('Boot', `Registered ${cmdCount} commands across ${Object.keys(commands.byCategory()).length} categories.`);
  logger.info('Boot', `Loaded ${plugCount} plugin(s).`);

  if (ai.available) logger.info('Boot', `AI enabled (model: ${config.ai.model}).`);
  else logger.info('Boot', 'AI disabled (no API key) — !ai will report it is unavailable.');

  // --- Connect to the server ------------------------------------------------
  bot.connect();

  // --- Graceful shutdown + crash safety -------------------------------------
  process.on('SIGINT', () => app.shutdown(0, 'SIGINT'));
  process.on('SIGTERM', () => app.shutdown(0, 'SIGTERM'));
  process.on('uncaughtException', (err) => {
    logger.error('Process', 'Uncaught exception:', err.stack || err.message);
    // Persist data, but keep running — the bot should survive command crashes.
    db.flush();
  });
  process.on('unhandledRejection', (reason) => {
    logger.error('Process', 'Unhandled rejection:', reason?.stack || String(reason));
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Fatal error during startup:', err);
  process.exit(1);
});
