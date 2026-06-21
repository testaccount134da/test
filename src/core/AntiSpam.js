// =============================================================================
//  AntiSpam
// -----------------------------------------------------------------------------
//  Sliding-window rate limiter for chat/command activity per player.
//  Players who exceed the threshold are temporarily ignored ("soft muted" from
//  the bot's perspective). Staff above a configurable rank level are exempt.
// =============================================================================

export default class AntiSpam {
  constructor(config, permissions, logger) {
    this.config = config.antiSpam ?? {};
    this.permissions = permissions;
    this.logger = logger;
    // username -> array of timestamps within the current window
    this.activity = new Map();
    // username -> timestamp until which they are ignored
    this.mutedUntil = new Map();
  }

  get enabled() {
    return this.config.enabled !== false;
  }

  /** Is this player currently soft-muted by anti-spam? */
  isMuted(username) {
    const until = this.mutedUntil.get(username.toLowerCase());
    if (!until) return false;
    if (Date.now() > until) {
      this.mutedUntil.delete(username.toLowerCase());
      return false;
    }
    return true;
  }

  /**
   * Register an activity event. Returns true if the player is ALLOWED to
   * proceed, false if they should be ignored (rate limited / muted).
   */
  check(username) {
    if (!this.enabled) return true;

    // Exempt staff at or above the configured level.
    const exemptLevel = this.config.exemptRankLevel ?? 30;
    if (this.permissions?.getLevel(username) >= exemptLevel) return true;

    const key = username.toLowerCase();
    if (this.isMuted(username)) return false;

    const now = Date.now();
    const windowMs = this.config.windowMs ?? 4000;
    const max = this.config.maxMessagesPerWindow ?? 5;

    const timestamps = (this.activity.get(key) ?? []).filter((t) => now - t < windowMs);
    timestamps.push(now);
    this.activity.set(key, timestamps);

    if (timestamps.length > max) {
      const muteMs = (this.config.muteSeconds ?? 30) * 1000;
      this.mutedUntil.set(key, now + muteMs);
      this.activity.set(key, []);
      this.logger?.category('moderation', `[anti-spam] ${username} rate-limited for ${this.config.muteSeconds ?? 30}s`);
      return false;
    }
    return true;
  }

  /** Manually clear a player's spam state (used by !unmute). */
  clear(username) {
    const key = username.toLowerCase();
    this.activity.delete(key);
    this.mutedUntil.delete(key);
  }
}
