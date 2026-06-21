import { formatDuration, isValidUsername } from '../../utils/helpers.js';

// !seen <player> — when the bot last saw a player active.
export default {
  name: 'seen',
  description: 'Show when a player was last seen.',
  aliases: ['lastseen'],
  usage: '!seen <player>',
  cooldown: 4,
  permission: 0,
  category: 'general',
  async execute(ctx) {
    const { args, db, bot, reply } = ctx;
    const target = args[0];
    if (!target) return reply(`Usage: ${ctx.prefix}seen <player>`);
    if (!isValidUsername(target)) return reply('That does not look like a valid username.');

    if (bot.onlinePlayers().some((p) => p.toLowerCase() === target.toLowerCase())) {
      return reply(`${target} is online right now.`);
    }
    const user = db.collection('users')[target.toLowerCase()];
    if (!user?.lastSeen) return reply(`I have never seen ${target}.`);
    reply(`${user.username} was last seen ${formatDuration(Date.now() - user.lastSeen)} ago (${user.lastActivity ?? 'activity'}).`);
  }
};
