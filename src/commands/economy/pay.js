import { isValidUsername } from '../../utils/helpers.js';

// !pay <player> <amount> — transfer coins to another player.
export default {
  name: 'pay',
  description: 'Send coins to another player.',
  aliases: ['transfer', 'send'],
  usage: '!pay <player> <amount>',
  cooldown: 4,
  permission: 0,
  category: 'economy',
  async execute(ctx) {
    const { args, economy, sender, reply } = ctx;
    if (!economy.enabled) return reply('The economy is disabled.');
    const [target, amountRaw] = args;
    if (!target || !amountRaw) return reply(`Usage: ${ctx.prefix}pay <player> <amount>`);
    if (!isValidUsername(target)) return reply('Invalid player name.');

    const amount = Math.floor(Number(amountRaw));
    if (!Number.isFinite(amount) || amount <= 0) return reply('Enter a valid positive amount.');

    const result = economy.transfer(sender, target, amount);
    if (!result.ok) return reply(result.error);
    reply(`You paid ${economy.format(amount)} to ${target}. Balance: ${economy.format(economy.getBalance(sender))}.`);
  }
};
