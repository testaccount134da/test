import { formatDuration } from '../../utils/helpers.js';

// !uptime — how long the process and the current connection have been alive.
export default {
  name: 'uptime',
  description: 'Show how long the bot has been running.',
  aliases: [],
  usage: '!uptime',
  cooldown: 5,
  permission: 0,
  category: 'general',
  async execute(ctx) {
    const proc = formatDuration(ctx.bot.uptimeMs());
    const conn = ctx.bot.connected ? formatDuration(ctx.bot.connectionUptimeMs()) : 'disconnected';
    ctx.reply(`Uptime: ${proc} | Connected: ${conn}`);
  }
};
