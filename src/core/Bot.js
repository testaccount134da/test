// =============================================================================
//  Bot
// -----------------------------------------------------------------------------
//  Wraps a mineflayer client and provides:
//    * Automatic connection to an offline-mode server.
//    * Automatic reconnection with exponential backoff.
//    * Auto-rejoin after kicks, deaths and crashes.
//    * A throttled, chunk-aware outbound message queue (respects chat limits).
//    * Routing of public chat + whispers into the CommandManager.
//    * Join/leave + chat logging and lastSeen tracking.
//    * A simple anti-AFK loop.
// =============================================================================

import mineflayer from 'mineflayer';
import { chunkMessage, sleep, isValidUsername } from '../utils/helpers.js';

export default class Bot {
  constructor(services) {
    this.services = services;
    this.config = services.config;
    this.logger = services.logger;

    this.mc = null; // the active mineflayer bot instance
    this.startedAt = Date.now();
    this.connectedAt = null;
    this.reconnectAttempts = 0;
    this.shuttingDown = false;
    this.manualDisconnect = false;

    // Outbound message queue (so we never trip server anti-spam / chat limits).
    this._sendQueue = [];
    this._sending = false;

    this._antiAfkTimer = null;
  }

  // --- Lifecycle -------------------------------------------------------------

  /** Create the mineflayer client and wire up all event handlers. */
  connect() {
    const s = this.config.server;
    this.manualDisconnect = false;

    // Auth mode: "offline" for cracked servers, "microsoft" for premium accounts.
    const authMode = (s.auth ?? 'offline').toLowerCase();
    this.logger.info('Bot', `Connecting to ${s.host}:${s.port ?? 25565} as "${s.username}" (${authMode} mode)...`);

    // Base options shared by both auth modes.
    const options = {
      host: s.host,
      port: s.port ?? 25565,
      username: s.username,
      version: s.version || false, // false = auto-detect
      auth: authMode === 'microsoft' ? 'microsoft' : 'offline',
      hideErrors: false
    };

    if (authMode === 'microsoft') {
      // Cache the Microsoft auth tokens so we only sign in interactively once.
      // After the first login, reconnects reuse the cached token silently.
      options.profilesFolder = s.profilesFolder || '.minecraft-auth';

      // Device-code callback: printed to the console so the operator can sign in.
      // mineflayer calls this with { user_code, verification_uri, message } the
      // first time (or when the cached token has expired).
      options.onMsaCode = (data) => {
        this.logger.warn('Auth', '======================================================');
        this.logger.warn('Auth', '  MICROSOFT SIGN-IN REQUIRED');
        this.logger.warn('Auth', `  1. Open: ${data.verification_uri}`);
        this.logger.warn('Auth', `  2. Enter code: ${data.user_code}`);
        this.logger.warn('Auth', '  (this is only needed once; the token is cached)');
        this.logger.warn('Auth', '======================================================');
      };
    }

    try {
      this.mc = mineflayer.createBot(options);
    } catch (err) {
      this.logger.error('Bot', 'Failed to create bot:', err.message);
      this.#scheduleReconnect();
      return;
    }

    this.#bindEvents();
  }

  #bindEvents() {
    const bot = this.mc;

    // Successful login + world load.
    bot.once('spawn', () => {
      this.connectedAt = Date.now();
      this.reconnectAttempts = 0;
      this.logger.info('Bot', `Spawned in the world as ${bot.username}.`);
      this.#startAntiAfk();
    });

    // Public chat: route to command handler + log.
    bot.on('chat', (username, message) => {
      if (username === bot.username) return; // ignore our own messages
      this.#onChat(username, message, false);
    });

    // Whispers / direct messages.
    bot.on('whisper', (username, message) => {
      if (username === bot.username) return;
      this.#onChat(username, message, true);
    });

    // Raw message string — used purely for chat logging.
    bot.on('messagestr', (message) => {
      this.logger.category('chat', message);
    });

    // Player join/leave logging + lastSeen tracking.
    bot.on('playerJoined', (player) => {
      if (!player?.username || player.username === bot.username) return;
      this.logger.category('joinLeave', `+ ${player.username} joined`);
      this.#touchSeen(player.username, 'joined');
    });
    bot.on('playerLeft', (player) => {
      if (!player?.username || player.username === bot.username) return;
      this.logger.category('joinLeave', `- ${player.username} left`);
      this.#touchSeen(player.username, 'left');
    });

    // Death -> optionally respawn (mineflayer auto-respawns by default, but we
    // log it and make the behaviour explicit/configurable).
    bot.on('death', () => {
      this.logger.warn('Bot', 'Bot died.');
      if (this.config.reconnect?.rejoinOnDeath !== false) {
        try { bot.respawn(); } catch { /* ignore */ }
      }
    });

    // Kicked by the server.
    bot.on('kicked', (reason) => {
      this.logger.warn('Bot', 'Kicked:', typeof reason === 'string' ? reason : JSON.stringify(reason));
    });

    // Low-level errors.
    bot.on('error', (err) => {
      this.logger.error('Bot', 'Client error:', err.message);
    });

    // Connection closed — trigger reconnect unless we asked for it.
    bot.on('end', (reason) => {
      this.#stopAntiAfk();
      this.connectedAt = null;
      this.logger.warn('Bot', `Disconnected (${reason}).`);
      if (!this.manualDisconnect && !this.shuttingDown) {
        this.#scheduleReconnect();
      }
    });
  }

  /** Exponential-backoff reconnect scheduler. */
  #scheduleReconnect() {
    const rc = this.config.reconnect ?? {};
    if (rc.enabled === false) {
      this.logger.warn('Bot', 'Reconnect disabled in config; staying offline.');
      return;
    }
    this.reconnectAttempts++;
    if (rc.maxAttempts && this.reconnectAttempts > rc.maxAttempts) {
      this.logger.error('Bot', `Giving up after ${rc.maxAttempts} reconnect attempts.`);
      return;
    }

    const base = rc.initialDelayMs ?? 5000;
    const factor = rc.backoffFactor ?? 2;
    const max = rc.maxDelayMs ?? 60000;
    const delay = Math.min(max, base * Math.pow(factor, this.reconnectAttempts - 1));

    this.logger.info('Bot', `Reconnecting in ${Math.round(delay / 1000)}s (attempt ${this.reconnectAttempts}).`);
    setTimeout(() => {
      if (!this.shuttingDown) this.connect();
    }, delay);
  }

  /** Cleanly disconnect (used by !restart / !shutdown). */
  disconnect(reason = 'manual disconnect') {
    this.manualDisconnect = true;
    this.#stopAntiAfk();
    try {
      this.mc?.quit(reason);
    } catch { /* ignore */ }
  }

  /** Force a reconnect cycle (used by !restart). */
  restart() {
    this.logger.info('Bot', 'Restarting connection...');
    this.manualDisconnect = true;
    try { this.mc?.quit('restart'); } catch { /* ignore */ }
    setTimeout(() => {
      this.manualDisconnect = false;
      this.connect();
    }, 2000);
  }

  // --- Message handling ------------------------------------------------------

  #onChat(username, message, whisper) {
    // Anti-spam gate (staff exempt) applies to everyone touching the bot.
    if (this.services.antiSpam && !this.services.antiSpam.check(username)) {
      return; // silently ignore spammers
    }

    this.#touchSeen(username, 'chat');
    this.services.db.getUser(username).stats.messages++;

    const prefix = this.config.bot?.prefix ?? '!';
    if (!message.startsWith(prefix)) return; // not a command

    // Decide where the reply should go.
    const replyMode = this.config.bot?.commandReplyMode ?? 'auto';
    const replyWhisper = replyMode === 'whisper' || (replyMode === 'auto' && whisper);

    const reply = (text) => {
      if (replyWhisper) this.whisperTo(username, text);
      else this.sendMessage(text);
    };

    this.services.commands.handle({ sender: username, message, reply, whisper }).catch((err) => {
      this.logger.error('Bot', 'Unhandled command error:', err.message);
    });
  }

  /** Update a player's lastSeen timestamp + activity. */
  #touchSeen(username, activity) {
    try {
      const user = this.services.db.getUser(username);
      user.lastSeen = Date.now();
      user.lastActivity = activity;
      this.services.db.saveUser(user);
    } catch { /* never let tracking crash chat handling */ }
  }

  // --- Outbound queue --------------------------------------------------------

  /** Queue a public chat message (split into chat-safe chunks). */
  sendMessage(text) {
    if (text == null) return;
    const max = this.config.bot?.maxMessageLength ?? 256;
    for (const chunk of chunkMessage(String(text), max - 1)) {
      this._sendQueue.push({ type: 'chat', text: chunk });
    }
    this.#drainQueue();
  }

  /** Queue a whisper to a specific (validated) player. */
  whisperTo(username, text) {
    if (!isValidUsername(username)) {
      // Fall back to public chat if the name is suspicious.
      return this.sendMessage(text);
    }
    const max = this.config.bot?.maxMessageLength ?? 256;
    for (const chunk of chunkMessage(String(text), max - username.length - 4)) {
      this._sendQueue.push({ type: 'whisper', to: username, text: chunk });
    }
    this.#drainQueue();
  }

  /** Send a raw command/string immediately-ish through the queue. */
  sendRaw(text) {
    this._sendQueue.push({ type: 'chat', text: String(text) });
    this.#drainQueue();
  }

  async #drainQueue() {
    if (this._sending) return;
    this._sending = true;
    const delay = this.config.bot?.messageDelayMs ?? 800;
    while (this._sendQueue.length) {
      const item = this._sendQueue.shift();
      try {
        if (!this.mc || !this.connectedAt) {
          // Not connected — drop queued chat to avoid a backlog flood on rejoin.
          continue;
        }
        if (item.type === 'whisper') {
          this.mc.whisper(item.to, item.text);
        } else {
          this.mc.chat(item.text);
        }
      } catch (err) {
        this.logger.error('Bot', 'Failed to send message:', err.message);
      }
      await sleep(delay);
    }
    this._sending = false;
  }

  // --- Anti-AFK --------------------------------------------------------------

  #startAntiAfk() {
    if (this.config.bot?.antiAfk === false) return;
    this.#stopAntiAfk();
    this._antiAfkTimer = setInterval(() => {
      try {
        if (!this.mc || !this.connectedAt) return;
        // Tiny look movement + a jump occasionally to avoid AFK kicks.
        this.mc.look(Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.5, false);
        if (Math.random() < 0.3) {
          this.mc.setControlState('jump', true);
          setTimeout(() => this.mc?.setControlState('jump', false), 350);
        }
      } catch { /* ignore */ }
    }, 30000);
    if (this._antiAfkTimer.unref) this._antiAfkTimer.unref();
  }

  #stopAntiAfk() {
    if (this._antiAfkTimer) clearInterval(this._antiAfkTimer);
    this._antiAfkTimer = null;
  }

  // --- Status helpers --------------------------------------------------------

  get connected() {
    return !!this.connectedAt;
  }

  uptimeMs() {
    return Date.now() - this.startedAt;
  }

  connectionUptimeMs() {
    return this.connectedAt ? Date.now() - this.connectedAt : 0;
  }

  /** Snapshot of online players (excluding the bot). */
  onlinePlayers() {
    if (!this.mc?.players) return [];
    return Object.keys(this.mc.players).filter((n) => n !== this.mc.username);
  }
}
