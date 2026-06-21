// !backup — create a timestamped backup of the database.
export default {
  name: 'backup',
  description: 'Create a database backup.',
  aliases: [],
  usage: '!backup',
  cooldown: 5,
  permission: 'owner',
  ownerOnly: true,
  category: 'owner',
  async execute(ctx) {
    try {
      const dest = ctx.db.backup();
      ctx.reply(`Backup created: ${dest}`);
    } catch (err) {
      ctx.reply(`Backup failed: ${err.message}`);
    }
  }
};
