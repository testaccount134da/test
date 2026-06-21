// =============================================================================
//  PermissionManager
// -----------------------------------------------------------------------------
//  Resolves a player's rank to a numeric level and answers "can this player run
//  a command requiring level N?". Levels provide inheritance automatically:
//  a higher-level rank satisfies every lower-level requirement.
//
//  Config bootstraps owners by username so you are never locked out, even with
//  an empty database.
// =============================================================================

export default class PermissionManager {
  /**
   * @param {object} ranks  The parsed ranks.json object.
   * @param {Database} db
   * @param {object} config The full config (for bot.owners).
   * @param {Logger} logger
   */
  constructor(ranks, db, config, logger) {
    this.db = db;
    this.config = config;
    this.logger = logger;
    this.setRanks(ranks);
  }

  /** Apply a (possibly reloaded) ranks definition. */
  setRanks(ranks) {
    this.defaultRank = ranks.defaultRank ?? 'member';
    this.ranks = ranks.ranks ?? {};
  }

  /** Numeric level for a rank name (0 if unknown). */
  levelOf(rankName) {
    return this.ranks[rankName]?.level ?? 0;
  }

  /** Highest defined level (used by "owner" comparisons). */
  ownerLevel() {
    return Math.max(0, ...Object.values(this.ranks).map((r) => r.level ?? 0));
  }

  /** Is this username listed as a hard-coded owner in config? */
  isConfigOwner(username) {
    const owners = (this.config.bot?.owners ?? []).map((o) => o.toLowerCase());
    return owners.includes(username.toLowerCase());
  }

  /** Resolve the effective rank name for a player. */
  getRank(username) {
    if (this.isConfigOwner(username)) return 'owner';
    const user = this.db.getUser(username, { rank: this.defaultRank });
    // Guard against a rank that was deleted from ranks.json after assignment.
    return this.ranks[user.rank] ? user.rank : this.defaultRank;
  }

  /** Resolve the effective numeric level for a player. */
  getLevel(username) {
    if (this.isConfigOwner(username)) return this.ownerLevel();
    return this.levelOf(this.getRank(username));
  }

  /**
   * Does `username` meet `requiredLevel`?
   * requiredLevel may be a number, or a rank name string.
   */
  has(username, requiredLevel) {
    const need =
      typeof requiredLevel === 'string' ? this.levelOf(requiredLevel) : (requiredLevel ?? 0);
    return this.getLevel(username) >= need;
  }

  /** Assign a rank. Validates the rank exists. Owners cannot be demoted here. */
  setRank(username, rankName) {
    if (!this.ranks[rankName]) {
      throw new Error(`Unknown rank "${rankName}". Valid: ${Object.keys(this.ranks).join(', ')}`);
    }
    const user = this.db.getUser(username, { rank: this.defaultRank });
    user.rank = rankName;
    this.db.saveUser(user);
    this.logger?.info('Perms', `${username} set to rank ${rankName}`);
    return user;
  }

  /** Reset a player to the default rank. */
  resetRank(username) {
    return this.setRank(username, this.defaultRank);
  }

  /** List rank names ordered by level ascending. */
  listRanks() {
    return Object.entries(this.ranks)
      .sort((a, b) => (a[1].level ?? 0) - (b[1].level ?? 0))
      .map(([name, r]) => ({ name, ...r }));
  }
}
