import { formatDuration } from '../../utils/helpers.js';

// !daily — claim your once-per-day coin reward.
export default {
  name: 'daily',
  description: 'Claim your daily coin reward.',
  aliases: [],
  usage: '!daily',
  cooldown: 3,
  permission: 0,
  category: 'economy',
  async execute(ctx) {
    const { economy, sender, reply } = ctx;
    if (!economy.enabled) return reply('The economy is disabled.');
    const result = economy.claimDaily(sender);
    if (!result.ok) {
      return reply(`You already claimed your daily reward. Come back in ${formatDuration(result.remainingMs)}.`);
    }
    reply(`You claimed ${economy.format(result.amount)}! Daily streak: ${result.streak}. New balance: ${economy.format(economy.getBalance(sender))}.`);
  }
};
