// !vote — show server voting links and reward players who voted (tracked).
export default {
  name: 'vote',
  description: 'Get the server voting links and claim a vote reward.',
  aliases: [],
  usage: '!vote',
  cooldown: 10,
  permission: 0,
  category: 'general',
  async execute(ctx) {
    const { db, economy, sender, reply } = ctx;
    const links = db.get('settings', 'voteLinks', null) ?? [
      'https://minecraft-server-list.com/server/yourserver',
      'https://minecraftservers.org/server/yourserver'
    ];
    reply('Support the server by voting here:');
    links.forEach((l, i) => reply(`${i + 1}. ${l}`));

    // Simple daily-style vote reward (separate cooldown from !daily).
    if (economy.enabled) {
      const user = db.getUser(sender);
      const cd = 20 * 3600000; // 20 hours
      if (Date.now() - (user.lastVote ?? 0) >= cd) {
        user.lastVote = Date.now();
        db.saveUser(user);
        economy.add(sender, 100, 'vote reward');
        reply(`Thanks! You received ${economy.format(100)} for voting today.`);
      }
    }
  }
};
