// !balance [player] — check your balance or someone else's.
export default {
  name: 'balance',
  description: 'Check your coin balance (or another player\'s).',
  aliases: ['bal', 'money', 'coins'],
  usage: '!balance [player]',
  cooldown: 3,
  permission: 0,
  category: 'economy',
  async execute(ctx) {
    const { args, economy, sender, reply } = ctx;
    if (!economy.enabled) return reply('The economy is disabled.');
    const target = args[0] ?? sender;
    const bal = economy.getBalance(target);
    if (target.toLowerCase() === sender.toLowerCase()) reply(`You have ${economy.format(bal)}.`);
    else reply(`${target} has ${economy.format(bal)}.`);
  }
};
