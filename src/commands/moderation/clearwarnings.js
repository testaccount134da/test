import { isValidUsername } from '../../utils/helpers.js';

// !clearwarnings <player> — remove all warnings for a player.
export default {
  name: 'clearwarnings',
  description: "Clear all of a player's warnings.",
  aliases: ['clearwarns', 'unwarn'],
  usage: '!clearwarnings <player>',
  cooldown: 3,
  permission: 'moderator',
  category: 'moderation',
  async execute(ctx) {
    const { args, db, sender, logger, reply } = ctx;
    const target = args[0];
    if (!target) return reply(`Usage: ${ctx.prefix}clearwarnings <player>`);
    if (!isValidUsername(target)) return reply('Invalid player name.');
    db.delete('warnings', target.toLowerCase());
    logger.category('moderation', `${sender} cleared warnings for ${target}`);
    reply(`Cleared all warnings for ${target}.`);
  }
};
