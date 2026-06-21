// =============================================================================
//  CommandManager
// -----------------------------------------------------------------------------
//  The heart of the command framework. Responsibilities:
//    * Load command modules from the commands/ tree (and from plugins).
//    * Validate the command contract (name/description/permission/category...).
//    * Resolve names + aliases.
//    * Enforce cooldowns and permissions.
//    * Build the command context and dispatch, catching all errors.
//    * Track per-command usage statistics.
//
//  A command module is an ESM file with a default export shaped like:
//    export default {
//      name: 'ping',
//      description: 'Check the bot is alive.',
//      aliases: ['p'],
//      usage: '!ping',
//      cooldown: 3,              // seconds (0 = no cooldown)
//      permission: 0,           // numeric level OR rank name string
//      category: 'general',
//      ownerOnly: false,        // convenience flag
//      async execute(ctx) { ... }
//    }
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

export default class CommandManager {
  /**
   * @param {object} services  Shared services injected into every command ctx.
   *   { config, logger, db, economy, permissions, antiSpam, ai, bot (set later) }
   */
  constructor(services) {
    this.services = services;
    this.logger = services.logger;

    this.commands = new Map(); // primary name -> command object
    this.aliases = new Map(); // alias -> primary name
    // cooldown tracking: "command:username" -> timestamp(ms) when it expires
    this.cooldowns = new Map();
  }

  /** Validate and register a single command object. */
  register(command, source = 'core') {
    if (!command || typeof command !== 'object') {
      this.logger.warn('Commands', `Skipped invalid command export from ${source}.`);
      return false;
    }
    const required = ['name', 'execute'];
    for (const field of required) {
      if (!command[field]) {
        this.logger.warn('Commands', `Command from ${source} missing "${field}", skipped.`);
        return false;
      }
    }

    // Normalise + apply sensible defaults.
    command.name = command.name.toLowerCase();
    command.aliases = (command.aliases ?? []).map((a) => a.toLowerCase());
    command.category = command.category ?? 'misc';
    command.cooldown = command.cooldown ?? this.services.config.cooldowns?.defaultSeconds ?? 3;
    command.permission = command.permission ?? 0;
    command.description = command.description ?? 'No description provided.';
    command.usage = command.usage ?? `${this.prefix}${command.name}`;
    command.source = source;
    if (command.ownerOnly) command.permission = 'owner';

    if (this.commands.has(command.name)) {
      this.logger.warn('Commands', `Duplicate command "${command.name}" from ${source} overrides existing.`);
      this.#unbindAliases(command.name);
    }

    this.commands.set(command.name, command);
    for (const alias of command.aliases) {
      if (this.aliases.has(alias) && this.aliases.get(alias) !== command.name) {
        this.logger.warn('Commands', `Alias "${alias}" already used; skipping for ${command.name}.`);
        continue;
      }
      this.aliases.set(alias, command.name);
    }
    return true;
  }

  #unbindAliases(name) {
    for (const [alias, target] of this.aliases.entries()) {
      if (target === name) this.aliases.delete(alias);
    }
  }

  get prefix() {
    return this.services.config.bot?.prefix ?? '!';
  }

  /**
   * Recursively import every .js file in a directory and register the default
   * export as a command. Returns the number of commands loaded.
   */
  async loadDirectory(dir) {
    if (!fs.existsSync(dir)) return 0;
    let count = 0;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        count += await this.loadDirectory(full);
      } else if (entry.name.endsWith('.js')) {
        try {
          // Cache-bust the import so !reload picks up file changes.
          const mod = await import(url.pathToFileURL(path.resolve(full)).href + `?t=${Date.now()}`);
          if (this.register(mod.default, path.basename(entry.name))) count++;
        } catch (err) {
          this.logger.error('Commands', `Failed to load ${full}:`, err.message);
        }
      }
    }
    return count;
  }

  /** Clear every registered command (used before a reload). */
  clear() {
    this.commands.clear();
    this.aliases.clear();
  }

  /** Resolve a name or alias to a command object. */
  resolve(nameOrAlias) {
    const key = nameOrAlias.toLowerCase();
    if (this.commands.has(key)) return this.commands.get(key);
    if (this.aliases.has(key)) return this.commands.get(this.aliases.get(key));
    return null;
  }

  /** All commands a given username is permitted to see/run. */
  listFor(username) {
    const perms = this.services.permissions;
    return [...this.commands.values()].filter((c) => perms.has(username, c.permission));
  }

  /** All commands grouped by category. */
  byCategory() {
    const groups = {};
    for (const cmd of this.commands.values()) {
      (groups[cmd.category] ??= []).push(cmd);
    }
    return groups;
  }

  // --- Cooldowns -------------------------------------------------------------

  /** Remaining cooldown in ms for (command, user); 0 if ready. */
  cooldownRemaining(command, username) {
    const key = `${command.name}:${username.toLowerCase()}`;
    const expires = this.cooldowns.get(key) ?? 0;
    return Math.max(0, expires - Date.now());
  }

  #applyCooldown(command, username) {
    if (!command.cooldown) return;
    const key = `${command.name}:${username.toLowerCase()}`;
    this.cooldowns.set(key, Date.now() + command.cooldown * 1000);
  }

  // --- Dispatch --------------------------------------------------------------

  /**
   * Parse raw chat text and execute the matching command.
   *
   * @param {object} opts
   * @param {string} opts.sender   Username who sent the message.
   * @param {string} opts.message  The full chat message (including prefix).
   * @param {Function} opts.reply  (text) => void   how to respond to the sender.
   * @param {boolean} [opts.whisper] Was this a private message?
   */
  async handle({ sender, message, reply, whisper = false }) {
    const prefix = this.prefix;
    if (!message.startsWith(prefix)) return false;

    // Parse "!cmd arg1 arg2" -> name + args.
    const withoutPrefix = message.slice(prefix.length).trim();
    if (!withoutPrefix) return false;
    const parts = withoutPrefix.split(/\s+/);
    const name = parts.shift().toLowerCase();
    const args = parts;

    const command = this.resolve(name);
    if (!command) {
      // Unknown command — only nudge in whispers to avoid spamming public chat.
      if (whisper) reply(`Unknown command "${name}". Try ${prefix}help`);
      return false;
    }

    const { config, permissions, logger } = this.services;

    // --- Maintenance mode: only high-level staff may run commands. ----------
    const maintenance = this.services.db.get('settings', 'maintenance', config.bot?.maintenance);
    if (maintenance && !permissions.has(sender, 'developer')) {
      reply('The bot is in maintenance mode. Please try again later.');
      return false;
    }

    // --- Chat lock: non-staff are blocked while chat is locked. -------------
    const chatLocked = this.services.db.get('settings', 'chatLocked', false);
    if (chatLocked && !permissions.has(sender, 'helper')) {
      reply('Chat is currently locked by staff.');
      return false;
    }

    // --- Permission check (cannot be bypassed: enforced before execute). -----
    if (!permissions.has(sender, command.permission)) {
      reply(`You do not have permission to use ${prefix}${command.name}.`);
      logger.category('command', `[denied] ${sender} -> ${command.name}`);
      return false;
    }

    // --- Cooldown check (staff above moderator bypass cooldowns). -----------
    const bypassCd = permissions.has(sender, 'moderator');
    const remaining = this.cooldownRemaining(command, sender);
    if (remaining > 0 && !bypassCd) {
      reply(`Slow down! ${Math.ceil(remaining / 1000)}s left on ${prefix}${command.name}.`);
      return false;
    }

    // --- Build the command context. -----------------------------------------
    const ctx = {
      ...this.services,
      sender,
      args,
      raw: message,
      whisper,
      command,
      commands: this,
      prefix,
      // Reply helper (already chunk-aware via the bot's send pipeline).
      reply: (text) => reply(text),
      // Convenience: fetch the sender's user document.
      user: this.services.db.getUser(sender)
    };

    // --- Execute with full error isolation. ---------------------------------
    try {
      await command.execute(ctx);
      if (!bypassCd) this.#applyCooldown(command, sender);
      this.#recordStats(command, sender);
      if (config.bot?.logCommandUsage !== false) {
        logger.category('command', `${sender} used ${command.name} ${args.join(' ')}`.trim());
      }
      return true;
    } catch (err) {
      logger.error('Commands', `Error in "${command.name}":`, err.stack || err.message);
      reply(`An error occurred while running ${prefix}${command.name}.`);
      return false;
    }
  }

  /** Increment usage counters for stats/leaderboards. */
  #recordStats(command, sender) {
    const stats = this.services.db.collection('stats');
    stats[command.name] = (stats[command.name] ?? 0) + 1;
    this.services.db.markDirty();

    const user = this.services.db.getUser(sender);
    user.stats = user.stats || {};
    user.stats.commandsUsed = (user.stats.commandsUsed ?? 0) + 1;
    this.services.db.saveUser(user);
  }
}
