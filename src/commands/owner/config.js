// !config — inspect and edit configuration at runtime.
//   !config get <path>            read a value (e.g. economy.dailyReward)
//   !config set <path> <value>    set a value and save to config.json
//   !config save                  persist current in-memory config
//   !config reload                reload config + commands from disk
export default {
  name: 'config',
  description: 'View or edit configuration values.',
  aliases: ['cfg'],
  usage: '!config get|set|save|reload [path] [value]',
  cooldown: 0,
  permission: 'owner',
  ownerOnly: true,
  category: 'owner',
  async execute(ctx) {
    const { args, configManager, config, reply, app } = ctx;
    const sub = args[0]?.toLowerCase();

    if (sub === 'get') {
      const value = configManager.get(args[1] ?? '');
      return reply(`${args[1]} = ${JSON.stringify(value)}`);
    }

    if (sub === 'set') {
      const path = args[1];
      const rawValue = args.slice(2).join(' ');
      if (!path || rawValue === '') return reply(`Usage: ${ctx.prefix}config set <path> <value>`);

      // Parse value as JSON if possible (numbers, booleans, arrays), else string.
      let value;
      try { value = JSON.parse(rawValue); } catch { value = rawValue; }

      // Walk/create the nested path and assign.
      const keys = path.split('.');
      let target = config;
      for (let i = 0; i < keys.length - 1; i++) {
        if (typeof target[keys[i]] !== 'object' || target[keys[i]] === null) target[keys[i]] = {};
        target = target[keys[i]];
      }
      target[keys[keys.length - 1]] = value;
      configManager.save();
      return reply(`Set ${path} = ${JSON.stringify(value)} (saved).`);
    }

    if (sub === 'save') {
      configManager.save();
      return reply('Configuration saved.');
    }

    if (sub === 'reload') {
      const result = await app.reload();
      return reply(`Reloaded config, ${result.commands} commands, ${result.plugins} plugins.`);
    }

    reply(`Usage: ${ctx.prefix}config get|set|save|reload [path] [value]`);
  }
};
