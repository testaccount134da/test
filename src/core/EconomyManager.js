// =============================================================================
//  EconomyManager
// -----------------------------------------------------------------------------
//  Virtual currency: balances, daily rewards, work, gambling, and transfers.
//  All balances live on the user document in the database. Every change is
//  logged through the "economy" log category for auditing.
// =============================================================================

import { randInt, clamp } from '../utils/helpers.js';

export default class EconomyManager {
  constructor(db, config, logger) {
    this.db = db;
    this.config = config.economy ?? {};
    this.logger = logger;
  }

  get enabled() {
    return this.config.enabled !== false;
  }

  get symbol() {
    return this.config.currencySymbol ?? '$';
  }

  get name() {
    return this.config.currencyName ?? 'coins';
  }

  /** Format an amount as "$1,234 coins". */
  format(amount) {
    return `${this.symbol}${Number(amount).toLocaleString('en-US')} ${this.name}`;
  }

  /** Ensure a user has a starting balance the first time they touch economy. */
  ensure(username) {
    const user = this.db.getUser(username);
    if (typeof user.balance !== 'number') {
      user.balance = this.config.startingBalance ?? 0;
      this.db.saveUser(user);
    }
    return user;
  }

  getBalance(username) {
    return this.ensure(username).balance;
  }

  /** Add (or subtract, with negative amount) currency. Never goes below 0. */
  add(username, amount, reason = 'unknown') {
    const user = this.ensure(username);
    user.balance = Math.max(0, Math.round(user.balance + amount));
    this.db.saveUser(user);
    this.logger?.category('economy', `${username} ${amount >= 0 ? '+' : ''}${amount} (${reason}) -> ${user.balance}`);
    return user.balance;
  }

  /** Returns true and deducts if the user can afford `amount`, else false. */
  spend(username, amount, reason = 'spend') {
    const user = this.ensure(username);
    if (user.balance < amount) return false;
    user.balance -= amount;
    this.db.saveUser(user);
    this.logger?.category('economy', `${username} -${amount} (${reason}) -> ${user.balance}`);
    return true;
  }

  /** Transfer between two players. Returns {ok, error?}. */
  transfer(from, to, amount) {
    if (amount <= 0) return { ok: false, error: 'Amount must be positive.' };
    if (from.toLowerCase() === to.toLowerCase()) return { ok: false, error: "You can't pay yourself." };
    if (!this.spend(from, amount, `transfer to ${to}`)) {
      return { ok: false, error: 'Insufficient funds.' };
    }
    this.add(to, amount, `transfer from ${from}`);
    return { ok: true };
  }

  // --- Daily reward ----------------------------------------------------------

  /** Claim the daily reward, respecting the cooldown. Returns {ok, amount?, remainingMs?}. */
  claimDaily(username) {
    const user = this.ensure(username);
    const cooldownMs = (this.config.dailyCooldownHours ?? 22) * 3600000;
    const last = user.lastDaily ?? 0;
    const now = Date.now();
    if (now - last < cooldownMs) {
      return { ok: false, remainingMs: cooldownMs - (now - last) };
    }
    const amount = this.config.dailyReward ?? 250;
    user.lastDaily = now;
    user.dailyStreak = (user.dailyStreak ?? 0) + 1;
    this.db.saveUser(user);
    this.add(username, amount, 'daily reward');
    return { ok: true, amount, streak: user.dailyStreak };
  }

  // --- Work ------------------------------------------------------------------

  /** Work for a random payout, respecting the cooldown. */
  work(username) {
    const user = this.ensure(username);
    const cooldownMs = (this.config.workCooldownMinutes ?? 30) * 60000;
    const last = user.lastWork ?? 0;
    const now = Date.now();
    if (now - last < cooldownMs) {
      return { ok: false, remainingMs: cooldownMs - (now - last) };
    }
    const amount = randInt(this.config.workMin ?? 50, this.config.workMax ?? 200);
    user.lastWork = now;
    this.db.saveUser(user);
    this.add(username, amount, 'work');
    return { ok: true, amount };
  }

  // --- Gambling --------------------------------------------------------------

  /**
   * Gamble `bet`. Win chance comes from config. On win, doubles the bet.
   * Returns {ok, won?, amount?, balance?, error?}.
   */
  gamble(username, bet) {
    const min = this.config.gambleMinBet ?? 10;
    const max = this.config.gambleMaxBet ?? 10000;
    bet = Math.floor(Number(bet));
    if (!Number.isFinite(bet) || bet <= 0) return { ok: false, error: 'Enter a valid bet amount.' };
    bet = clamp(bet, min, max);

    const user = this.ensure(username);
    if (user.balance < bet) return { ok: false, error: `You only have ${this.format(user.balance)}.` };

    const win = Math.random() < (this.config.gambleWinChance ?? 0.45);
    if (win) {
      this.add(username, bet, 'gamble win');
      user.stats = user.stats || {};
      user.stats.gamblesWon = (user.stats.gamblesWon ?? 0) + 1;
    } else {
      this.spend(username, bet, 'gamble loss');
      user.stats = user.stats || {};
      user.stats.gamblesLost = (user.stats.gamblesLost ?? 0) + 1;
    }
    this.db.saveUser(user);
    return { ok: true, won: win, amount: bet, balance: user.balance };
  }

  /** Top N players by balance. */
  leaderboard(limit = 10) {
    return this.db
      .all('users')
      .filter((u) => typeof u.balance === 'number')
      .sort((a, b) => b.balance - a.balance)
      .slice(0, limit);
  }
}
