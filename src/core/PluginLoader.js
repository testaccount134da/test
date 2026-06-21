// =============================================================================
//  PluginLoader
// -----------------------------------------------------------------------------
//  Modular plugin system. Drop a .js file (or a folder with index.js) into
//  src/plugins/ and it will be loaded automatically — without editing any core
//  file. A plugin can register commands, listen to bot events, and expose a
//  cleanup hook for reloads.
//
//  A plugin module's default export is shaped like:
//    export default {
//      name: 'my-plugin',
//      version: '1.0.0',
//      // Called once on load. `api` gives access to everything the plugin needs.
//      async load(api) {
//        api.registerCommand({ name: 'foo', execute: (ctx) => ctx.reply('bar') });
//        api.on('chat', (username, message) => { ... });
//      },
//      // Optional. Called before a reload / shutdown to release resources.
//      async unload(api) {}
//    }
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

export default class PluginLoader {
  constructor(services) {
    this.services = services;
    this.logger = services.logger;
    this.plugins = new Map(); // name -> plugin module
    // Track listeners a plugin added so we can remove them on unload.
    this._listeners = new Map(); // pluginName -> [{event, handler}]
  }

  /** Build the API object handed to each plugin. */
  #apiFor(pluginName) {
    const self = this;
    return {
      ...this.services,
      // Register a command attributed to this plugin.
      registerCommand(command) {
        return self.services.commands.register(command, `plugin:${pluginName}`);
      },
      // Subscribe to a mineflayer bot event, tracked for clean unload.
      on(event, handler) {
        self.services.bot.mc?.on(event, handler);
        const list = self._listeners.get(pluginName) ?? [];
        list.push({ event, handler });
        self._listeners.set(pluginName, list);
      },
      logger: self.logger
    };
  }

  /** Load every plugin from a directory. */
  async loadDirectory(dir) {
    if (!fs.existsSync(dir)) {
      this.logger.debug('Plugins', `No plugin directory at ${dir}`);
      return 0;
    }
    let count = 0;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      let file = null;
      if (entry.isDirectory()) {
        const idx = path.join(dir, entry.name, 'index.js');
        if (fs.existsSync(idx)) file = idx;
      } else if (entry.name.endsWith('.js')) {
        file = path.join(dir, entry.name);
      }
      if (!file) continue;

      try {
        const mod = await import(url.pathToFileURL(path.resolve(file)).href + `?t=${Date.now()}`);
        const plugin = mod.default;
        if (!plugin?.name || typeof plugin.load !== 'function') {
          this.logger.warn('Plugins', `${file} is not a valid plugin (needs name + load()).`);
          continue;
        }
        await plugin.load(this.#apiFor(plugin.name));
        this.plugins.set(plugin.name, plugin);
        this.logger.info('Plugins', `Loaded plugin "${plugin.name}" v${plugin.version ?? '?'}`);
        count++;
      } catch (err) {
        this.logger.error('Plugins', `Failed to load ${file}:`, err.message);
      }
    }
    return count;
  }

  /** Unload all plugins, calling their unload() hooks and removing listeners. */
  async unloadAll() {
    for (const [name, plugin] of this.plugins.entries()) {
      try {
        if (typeof plugin.unload === 'function') await plugin.unload(this.#apiFor(name));
      } catch (err) {
        this.logger.error('Plugins', `Error unloading "${name}":`, err.message);
      }
      // Remove any mineflayer listeners the plugin registered.
      for (const { event, handler } of this._listeners.get(name) ?? []) {
        this.services.bot.mc?.removeListener(event, handler);
      }
      this._listeners.delete(name);
    }
    this.plugins.clear();
  }
}
