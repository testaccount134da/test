// =============================================================================
//  Logger
// -----------------------------------------------------------------------------
//  Timestamped console logging with colour, leveled output, and category-based
//  file logging (chat, joinLeave, command, economy, moderation, ticket).
//
//  Every other module receives a Logger instance so all output is consistent.
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';

// ANSI colour codes for pretty console output.
const COLORS = {
  reset: '\x1b[0m',
  gray: '\x1b[90m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Numeric severity so we can filter by configured minimum level.
const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };

const LEVEL_META = {
  debug: { color: COLORS.gray, label: 'DEBUG' },
  info: { color: COLORS.cyan, label: 'INFO ' },
  warn: { color: COLORS.yellow, label: 'WARN ' },
  error: { color: COLORS.red, label: 'ERROR' }
};

export default class Logger {
  /**
   * @param {object} options
   * @param {string} [options.level]      Minimum level to print (debug|info|warn|error).
   * @param {boolean} [options.toFile]    Whether to also write logs to files.
   * @param {string} [options.directory]  Directory for log files.
   * @param {object} [options.categories] Map of category -> boolean (enabled).
   */
  constructor(options = {}) {
    this.minLevel = LEVELS[options.level] ?? LEVELS.info;
    this.toFile = options.toFile ?? true;
    this.directory = options.directory ?? 'logs';
    this.categories = options.categories ?? {};

    if (this.toFile) {
      // Ensure the log directory exists before we try to append to it.
      try {
        fs.mkdirSync(this.directory, { recursive: true });
      } catch (err) {
        // If we cannot create the directory, fall back to console-only logging.
        this.toFile = false;
        // eslint-disable-next-line no-console
        console.error('[Logger] Could not create log directory, file logging disabled:', err.message);
      }
    }
  }

  /** Build a human-readable timestamp like "2026-06-21 14:03:55". */
  static timestamp() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return (
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
      `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
    );
  }

  /** Core log routine used by debug/info/warn/error. */
  log(level, scope, ...args) {
    if ((LEVELS[level] ?? 0) < this.minLevel) return;

    const meta = LEVEL_META[level] ?? LEVEL_META.info;
    const ts = Logger.timestamp();
    const message = args
      .map((a) => (typeof a === 'string' ? a : safeStringify(a)))
      .join(' ');

    const scopeTag = scope ? `[${scope}] ` : '';

    // Console line (coloured).
    // eslint-disable-next-line no-console
    console.log(
      `${COLORS.gray}${ts}${COLORS.reset} ` +
        `${meta.color}${meta.label}${COLORS.reset} ` +
        `${COLORS.magenta}${scopeTag}${COLORS.reset}${message}`
    );

    // Plain line for the combined log file.
    if (this.toFile) {
      this.#appendFile('combined', `${ts} ${meta.label.trim()} ${scopeTag}${message}`);
    }
  }

  debug(scope, ...args) { this.log('debug', scope, ...args); }
  info(scope, ...args) { this.log('info', scope, ...args); }
  warn(scope, ...args) { this.log('warn', scope, ...args); }
  error(scope, ...args) { this.log('error', scope, ...args); }

  /**
   * Category logging — writes a dedicated file per category (chat.log etc.)
   * and mirrors a short line to the console at info level.
   * Categories can be toggled in config.logging.categories.
   */
  category(category, message) {
    if (this.categories[category] === false) return;
    const ts = Logger.timestamp();
    const line = `${ts} ${message}`;

    // eslint-disable-next-line no-console
    console.log(`${COLORS.gray}${ts}${COLORS.reset} ${COLORS.blue}[${category}]${COLORS.reset} ${message}`);

    if (this.toFile) {
      this.#appendFile(category, line);
    }
  }

  /** Append a line to "<directory>/<name>.log", swallowing IO errors. */
  #appendFile(name, line) {
    try {
      fs.appendFileSync(path.join(this.directory, `${name}.log`), line + '\n');
    } catch {
      // Never let logging crash the bot.
    }
  }
}

/** JSON.stringify that never throws (handles circular refs / errors). */
function safeStringify(value) {
  if (value instanceof Error) return value.stack || value.message;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
