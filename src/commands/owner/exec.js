// !exec <server command> — make the bot run a raw server command as itself.
// Owner only. Useful for issuing console/OP commands through the bot.
export default {
  name: 'exec',
  description: 'Run a raw server command as the bot (owner only).',
  aliases: ['run', 'cmd'],
  usage: '!exec <command without leading slash>',
  cooldown: 0,
  permission: 'owner',
  ownerOnly: true,
  category: 'owner',
  async execute(ctx) {
    const { args, reply, bot, logger, sender } = ctx;
    let command = args.join(' ').trim();
    if (!command) return reply(`Usage: ${ctx.prefix}exec <command>`);
    // Allow with or without a leading slash; always send with one.
    if (!command.startsWith('/')) command = '/' + command;
    logger.warn('Owner', `${sender} exec: ${command}`);
    bot.sendRaw(command);
    reply(`Executed: ${command}`);
  }
};
