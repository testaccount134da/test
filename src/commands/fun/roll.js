import { randInt } from '../../utils/helpers.js';

// !roll [sides] [count] — roll dice. Defaults to one 6-sided die.
export default {
  name: 'roll',
  description: 'Roll dice. e.g. !roll 20  or  !roll 6 3 (three d6).',
  aliases: ['dice'],
  usage: '!roll [sides] [count]',
  cooldown: 3,
  permission: 0,
  category: 'fun',
  async execute(ctx) {
    const { args, reply } = ctx;
    const sides = Math.min(1000, Math.max(2, Math.floor(Number(args[0]) || 6)));
    const count = Math.min(10, Math.max(1, Math.floor(Number(args[1]) || 1)));
    const rolls = Array.from({ length: count }, () => randInt(1, sides));
    const total = rolls.reduce((a, b) => a + b, 0);
    if (count === 1) reply(`You rolled a ${rolls[0]} (d${sides}).`);
    else reply(`You rolled [${rolls.join(', ')}] = ${total} (${count}d${sides}).`);
  }
};
