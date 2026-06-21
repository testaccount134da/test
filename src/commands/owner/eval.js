// !eval <code> — evaluate JavaScript in the bot's context (owner only).
// DANGEROUS: this is full remote code execution for whoever can run it. It is
// gated behind owner rank AND the config flag bot.enableEval (default false).
export default {
  name: 'eval',
  description: 'Evaluate JavaScript in the bot context (owner only, opt-in).',
  aliases: [],
  usage: '!eval <code>',
  cooldown: 0,
  permission: 'owner',
  ownerOnly: true,
  category: 'owner',
  async execute(ctx) {
    const { args, config, reply, logger, sender } = ctx;
    if (!config.bot?.enableEval) {
      return reply('Eval is disabled. Set bot.enableEval=true in config to enable it.');
    }
    const code = args.join(' ');
    if (!code) return reply(`Usage: ${ctx.prefix}eval <code>`);
    logger.warn('Owner', `${sender} ran eval: ${code}`);

    try {
      // `ctx` is available inside the evaluated code for convenience.
      // eslint-disable-next-line no-eval
      const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;
      const fn = new AsyncFunction('ctx', `return (async () => { ${code} })()`);
      let result = await fn(ctx);
      if (typeof result !== 'string') {
        try { result = JSON.stringify(result); } catch { result = String(result); }
      }
      reply(`Result: ${String(result).slice(0, 200)}`);
    } catch (err) {
      reply(`Error: ${err.message}`);
    }
  }
};
