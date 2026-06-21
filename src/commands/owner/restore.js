// !restore [stamp] — restore the database from a backup. With no argument it
// lists available backups.
export default {
  name: 'restore',
  description: 'Restore the database from a backup (or list backups).',
  aliases: [],
  usage: '!restore [backup-name]',
  cooldown: 5,
  permission: 'owner',
  ownerOnly: true,
  category: 'owner',
  async execute(ctx) {
    const { args, db, reply } = ctx;
    if (!args[0]) {
      const backups = db.listBackups();
      if (!backups.length) return reply('No backups found.');
      reply(`Available backups (newest first): ${backups.slice(0, 10).join(', ')}`);
      return reply(`Use ${ctx.prefix}restore <name> to restore one.`);
    }
    try {
      const dir = db.restore(args[0]);
      reply(`Database restored from ${dir}. A reload is recommended.`);
    } catch (err) {
      reply(`Restore failed: ${err.message}`);
    }
  }
};
