import { formatDuration, pick } from '../../utils/helpers.js';

const JOBS = [
  'mined a stack of diamonds',
  'farmed wheat for the village',
  'fought off a creeper raid',
  'fished by the dock all morning',
  'built a redstone contraption for a client',
  'enchanted gear at the library',
  'traded with the wandering trader'
];

// !work — earn a random amount of coins on a cooldown.
export default {
  name: 'work',
  description: 'Work a shift to earn coins.',
  aliases: ['job'],
  usage: '!work',
  cooldown: 3,
  permission: 0,
  category: 'economy',
  async execute(ctx) {
    const { economy, sender, reply } = ctx;
    if (!economy.enabled) return reply('The economy is disabled.');
    const result = economy.work(sender);
    if (!result.ok) {
      return reply(`You are tired. Work again in ${formatDuration(result.remainingMs)}.`);
    }
    reply(`You ${pick(JOBS)} and earned ${economy.format(result.amount)}! Balance: ${economy.format(economy.getBalance(sender))}.`);
  }
};
