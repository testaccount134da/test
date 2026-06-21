// !staff — list staff members who are currently online.
export default {
  name: 'staff',
  description: 'List online staff members.',
  aliases: ['stafflist', 'mods'],
  usage: '!staff',
  cooldown: 5,
  permission: 0,
  category: 'support',
  async execute(ctx) {
    const { config, permissions, bot, reply } = ctx;
    const level = config.support?.staffPingRankLevel ?? 20;
    const online = bot.onlinePlayers().filter((p) => permissions.has(p, level));
    if (!online.length) return reply('No staff are currently online. Use !contact to leave a message.');
    reply(`Online staff (${online.length}): ${online.map((p) => `${p} [${permissions.getRank(p)}]`).join(', ')}`);
  }
};
