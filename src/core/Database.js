// =============================================================================
//  Database (JSON document store)
// -----------------------------------------------------------------------------
//  A small, dependency-free persistence layer. Each "collection" is a plain
//  object keyed by id, stored in one JSON file under the data/ directory.
//  Writes are debounced (autosave) and also flushed on demand / on shutdown.
//
//  Collections used by the bot:
//    users        -> per-player profile, balance, rank, stats, lastSeen
//    tickets      -> support tickets
//    reports      -> player reports
//    bugs         -> bug reports
//    suggestions  -> player suggestions
//    punishments  -> mutes / kicks / bans issued by the bot
//    warnings     -> per-player warning lists
//    homes        -> saved homes (when not using server commands)
//    warps        -> server-wide warps
//    settings     -> mutable runtime settings (slowmode, lockchat, maintenance)
//    stats        -> command usage counters
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_COLLECTIONS = [
  'users', 'tickets', 'reports', 'bugs', 'suggestions',
  'punishments', 'warnings', 'homes', 'warps', 'settings', 'stats'
];

export default class Database {
  constructor(logger, options = {}) {
    this.logger = logger;
    this.directory = options.directory ?? 'data';
    this.autosaveMs = options.autosaveMs ?? 15000;
    this.backupDirectory = options.backupDirectory ?? 'backups';

    this.data = {};
    this._dirty = false;
    this._timer = null;

    fs.mkdirSync(this.directory, { recursive: true });
    this.#loadAll();
    this.#startAutosave();
  }

  /** Load every known collection from disk, creating empties as needed. */
  #loadAll() {
    for (const name of DEFAULT_COLLECTIONS) {
      const file = this.#fileFor(name);
      if (fs.existsSync(file)) {
        try {
          this.data[name] = JSON.parse(fs.readFileSync(file, 'utf8'));
        } catch (err) {
          this.logger?.error('DB', `Corrupt collection "${name}", starting empty:`, err.message);
          this.data[name] = {};
        }
      } else {
        this.data[name] = {};
      }
    }
    this.logger?.info('DB', `Loaded ${DEFAULT_COLLECTIONS.length} collections from ${this.directory}/`);
  }

  #fileFor(name) {
    return path.join(this.directory, `${name}.json`);
  }

  #startAutosave() {
    this._timer = setInterval(() => {
      if (this._dirty) this.flush();
    }, this.autosaveMs);
    // Do not keep the process alive solely for autosave.
    if (this._timer.unref) this._timer.unref();
  }

  /** Return a collection object (created on demand). */
  collection(name) {
    if (!this.data[name]) this.data[name] = {};
    return this.data[name];
  }

  /** Mark the store dirty so the next autosave tick persists it. */
  markDirty() {
    this._dirty = true;
  }

  // --- Generic document helpers ---------------------------------------------

  get(collection, id, fallback = null) {
    return this.collection(collection)[id] ?? fallback;
  }

  set(collection, id, value) {
    this.collection(collection)[id] = value;
    this.markDirty();
    return value;
  }

  delete(collection, id) {
    const col = this.collection(collection);
    const existed = id in col;
    delete col[id];
    if (existed) this.markDirty();
    return existed;
  }

  all(collection) {
    return Object.values(this.collection(collection));
  }

  /**
   * Push an item onto an array-shaped document, generating an incrementing id.
   * Used for tickets/reports/etc. Returns the created record (with id).
   */
  insert(collection, record) {
    const col = this.collection(collection);
    const id = this.#nextId(collection);
    const full = { id, createdAt: Date.now(), ...record };
    col[id] = full;
    this.markDirty();
    return full;
  }

  #nextId(collection) {
    const col = this.collection(collection);
    const ids = Object.keys(col).map((k) => Number(k)).filter((n) => Number.isFinite(n));
    return (ids.length ? Math.max(...ids) : 0) + 1;
  }

  // --- User helpers (the most-used collection) ------------------------------

  /** Fetch a user, creating a default profile if it does not exist yet. */
  getUser(username, defaults = {}) {
    const key = username.toLowerCase();
    let user = this.collection('users')[key];
    if (!user) {
      user = {
        username,
        rank: defaults.rank ?? 'member',
        balance: defaults.balance ?? 0,
        firstSeen: Date.now(),
        lastSeen: Date.now(),
        bio: '',
        stats: { commandsUsed: 0, messages: 0, gamblesWon: 0, gamblesLost: 0 },
        cooldowns: {}
      };
      this.collection('users')[key] = user;
      this.markDirty();
    }
    // Keep the canonical casing fresh.
    user.username = username;
    return user;
  }

  saveUser(user) {
    this.collection('users')[user.username.toLowerCase()] = user;
    this.markDirty();
  }

  // --- Persistence ----------------------------------------------------------

  /** Write all collections to disk now. */
  flush() {
    try {
      for (const [name, value] of Object.entries(this.data)) {
        fs.writeFileSync(this.#fileFor(name), JSON.stringify(value, null, 2));
      }
      this._dirty = false;
      this.logger?.debug('DB', 'Flushed all collections to disk.');
    } catch (err) {
      this.logger?.error('DB', 'Failed to flush database:', err.message);
    }
  }

  /** Copy all collection files into a timestamped backup folder. */
  backup() {
    this.flush();
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dest = path.join(this.backupDirectory, stamp);
    fs.mkdirSync(dest, { recursive: true });
    for (const name of Object.keys(this.data)) {
      const src = this.#fileFor(name);
      if (fs.existsSync(src)) fs.copyFileSync(src, path.join(dest, `${name}.json`));
    }
    this.logger?.info('DB', `Backup created at ${dest}`);
    return dest;
  }

  /** Restore collections from a named backup folder (under backups/). */
  restore(stamp) {
    const dir = path.join(this.backupDirectory, stamp);
    if (!fs.existsSync(dir)) throw new Error(`Backup "${stamp}" not found.`);
    for (const name of DEFAULT_COLLECTIONS) {
      const src = path.join(dir, `${name}.json`);
      if (fs.existsSync(src)) {
        this.data[name] = JSON.parse(fs.readFileSync(src, 'utf8'));
      }
    }
    this.markDirty();
    this.flush();
    this.logger?.info('DB', `Restored database from ${dir}`);
    return dir;
  }

  /** List available backup folder names (newest first). */
  listBackups() {
    if (!fs.existsSync(this.backupDirectory)) return [];
    return fs
      .readdirSync(this.backupDirectory)
      .filter((d) => fs.statSync(path.join(this.backupDirectory, d)).isDirectory())
      .sort()
      .reverse();
  }

  /** Stop autosave and flush a final time (called on shutdown). */
  close() {
    if (this._timer) clearInterval(this._timer);
    this.flush();
  }
}
