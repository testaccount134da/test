import { formatNumber } from '../../utils/helpers.js';

// !stats — global bot statistics (command usage, known players, total economy).
export default {
  name: 'stats',
  description: 'Show global bot statistics.',
  aliases: ['botstats'],
  usage: '!stats',
  cooldown: 5,
  permission: 0,
  category: 'general',
  async execute(ctx) {
    const { db, commands, reply } = ctx;
    const users = db.all('users');
    const statsCol = db.collection('stats');
    const totalCommands = Object.values(statsCol).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0);
    const totalMoney = users.reduce((a, u) => a + (u.balance ?? 0), 0);

    // Most-used command.
    const top = Object.entries(statsCol)
      .filter(([, v]) => typeof v === 'number')
      .sort((a, b) => b[1] - a[1])[0];

    reply(`Players known: ${formatNumber(users.length)} | Commands registered: ${commands.commands.size}`);
    reply(`Commands run: ${formatNumber(totalCommands)} | Total economy: ${ctx.economy.format(totalMoney)}`);
    if (top) reply(`Most used command: ${ctx.prefix}${top[0]} (${formatNumber(top[1])}x)`);
  }
};
