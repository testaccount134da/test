// =============================================================================
//  ConfigManager
// -----------------------------------------------------------------------------
//  Loads config/config.json (falling back to config.example.json on first run),
//  applies .env overrides for secrets, deep-merges defaults, and exposes a
//  reload() used by the !reload owner command.
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';

const CONFIG_PATH = path.join('config', 'config.json');
const EXAMPLE_PATH = path.join('config', 'config.example.json');
const RANKS_PATH = path.join('config', 'ranks.json');
const RANKS_EXAMPLE_PATH = path.join('config', 'ranks.example.json');

export default class ConfigManager {
  constructor(logger) {
    this.logger = logger;
    this.config = {};
    this.ranks = {};
    this.load();
  }

  /** Read & parse a JSON file, throwing a clear error on malformed JSON. */
  static readJson(file) {
    const raw = fs.readFileSync(file, 'utf8');
    try {
      return JSON.parse(raw);
    } catch (err) {
      throw new Error(`Invalid JSON in ${file}: ${err.message}`);
    }
  }

  /** (Re)load config + ranks from disk and re-apply environment overrides. */
  load() {
    // --- Main config ---------------------------------------------------------
    let file = CONFIG_PATH;
    if (!fs.existsSync(CONFIG_PATH)) {
      if (fs.existsSync(EXAMPLE_PATH)) {
        this.logger?.warn('Config', 'config/config.json not found — using config.example.json. Copy it to config.json to customize.');
        file = EXAMPLE_PATH;
      } else {
        throw new Error('No config file found (config/config.json or config.example.json).');
      }
    }
    this.config = ConfigManager.readJson(file);

    // --- Ranks ---------------------------------------------------------------
    let ranksFile = RANKS_PATH;
    if (!fs.existsSync(RANKS_PATH)) {
      if (fs.existsSync(RANKS_EXAMPLE_PATH)) ranksFile = RANKS_EXAMPLE_PATH;
      else throw new Error('No ranks file found (config/ranks.json or ranks.example.json).');
    }
    this.ranks = ConfigManager.readJson(ranksFile);

    this.#applyEnvOverrides();
    this.#validate();
    return this.config;
  }

  /** Secrets and connection details from .env take precedence over the file. */
  #applyEnvOverrides() {
    const env = process.env;
    const c = this.config;

    c.server = c.server || {};
    if (env.MC_HOST) c.server.host = env.MC_HOST;
    if (env.MC_PORT) c.server.port = Number(env.MC_PORT);
    if (env.MC_USERNAME) c.server.username = env.MC_USERNAME;
    if (env.MC_VERSION) c.server.version = env.MC_VERSION;
    if (env.MC_AUTH) c.server.auth = env.MC_AUTH;
    if (env.MC_PROFILES_FOLDER) c.server.profilesFolder = env.MC_PROFILES_FOLDER;

    c.ai = c.ai || {};
    if (env.OPENROUTER_API_KEY) c.ai.apiKey = env.OPENROUTER_API_KEY;
    if (env.OPENROUTER_MODEL) c.ai.model = env.OPENROUTER_MODEL;
  }

  /** Minimal sanity checks so the bot fails fast with a clear message. */
  #validate() {
    const s = this.config.server || {};
    if (!s.host) throw new Error('config.server.host is required (set MC_HOST or edit config.json).');
    if (!s.username) throw new Error('config.server.username is required (set MC_USERNAME or edit config.json).');

    // Normalise + validate the auth mode.
    s.auth = (s.auth ?? 'offline').toLowerCase();
    if (!['offline', 'microsoft'].includes(s.auth)) {
      throw new Error(`config.server.auth must be "offline" or "microsoft" (got "${s.auth}").`);
    }
    this.config.server = s;
    if (!this.config.bot?.prefix) {
      this.config.bot = this.config.bot || {};
      this.config.bot.prefix = '!';
    }
    if (!Array.isArray(this.config.bot.owners)) this.config.bot.owners = [];
  }

  /** Convenience getter with dotted path, e.g. get('economy.dailyReward'). */
  get(dottedPath, fallback = undefined) {
    return dottedPath.split('.').reduce(
      (acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined),
      this.config
    ) ?? fallback;
  }

  /** Persist the current in-memory config back to config/config.json. */
  save() {
    fs.mkdirSync('config', { recursive: true });
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(this.config, null, 2));
    this.logger?.info('Config', 'Configuration saved to config/config.json');
  }
}
