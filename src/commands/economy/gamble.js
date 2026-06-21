// !gamble <amount|all> — risk coins for a chance to double them.
export default {
  name: 'gamble',
  description: 'Gamble coins for a chance to double your bet.',
  aliases: ['bet'],
  usage: '!gamble <amount|all>',
  cooldown: 4,
  permission: 0,
  category: 'economy',
  async execute(ctx) {
    const { args, economy, sender, reply } = ctx;
    if (!economy.enabled) return reply('The economy is disabled.');

    let bet = args[0];
    if (bet?.toLowerCase() === 'all') bet = economy.getBalance(sender);
    const result = economy.gamble(sender, bet);
    if (!result.ok) return reply(result.error);

    if (result.won) reply(`You won ${economy.format(result.amount)}! New balance: ${economy.format(result.balance)}.`);
    else reply(`You lost ${economy.format(result.amount)}. New balance: ${economy.format(result.balance)}.`);
  }
};
