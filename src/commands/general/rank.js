// !rank [player] — show a player's rank, or list all ranks with "!rank list".
export default {
  name: 'rank',
  description: 'Show your rank (or another player\'s), or list all ranks.',
  aliases: ['ranks'],
  usage: '!rank [player] | !rank list',
  cooldown: 4,
  permission: 0,
  category: 'general',
  async execute(ctx) {
    const { args, permissions, sender, reply } = ctx;
    if (args[0]?.toLowerCase() === 'list') {
      reply('Ranks (low to high):');
      for (const r of permissions.listRanks()) {
        reply(`- ${r.name} (level ${r.level}) — ${r.description ?? ''}`);
      }
      return;
    }
    const target = args[0] ?? sender;
    const rank = permissions.getRank(target);
    const level = permissions.getLevel(target);
    reply(`${target} is rank "${rank}" (level ${level}).`);
  }
};
