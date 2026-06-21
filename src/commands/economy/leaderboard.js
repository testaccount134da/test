// !leaderboard — show the richest players.
export default {
  name: 'leaderboard',
  description: 'Show the richest players.',
  aliases: ['lb', 'baltop', 'top'],
  usage: '!leaderboard',
  cooldown: 6,
  permission: 0,
  category: 'economy',
  async execute(ctx) {
    const { economy, reply } = ctx;
    if (!economy.enabled) return reply('The economy is disabled.');
    const top = economy.leaderboard(10);
    if (!top.length) return reply('No economy data yet.');
    reply('=== Top Balances ===');
    top.forEach((u, i) => reply(`${i + 1}. ${u.username} — ${economy.format(u.balance)}`));
  }
};
