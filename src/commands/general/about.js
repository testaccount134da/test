// !about — short description of the bot.
export default {
  name: 'about',
  description: 'Information about this bot.',
  aliases: ['info', 'botinfo'],
  usage: '!about',
  cooldown: 5,
  permission: 0,
  category: 'general',
  async execute(ctx) {
    ctx.reply('Minecraft Support Bot v1.0.0 — support, economy, moderation & fun for cracked servers.');
    ctx.reply(`Type ${ctx.prefix}help to see what I can do.`);
  }
};
