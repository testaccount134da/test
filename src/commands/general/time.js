// !time — current real-world time and the in-game world time.
export default {
  name: 'time',
  description: 'Show the current real and in-game time.',
  aliases: ['clock'],
  usage: '!time',
  cooldown: 4,
  permission: 0,
  category: 'general',
  async execute(ctx) {
    const now = new Date().toUTCString();
    let gameTime = 'unknown';
    const t = ctx.bot.mc?.time?.timeOfDay;
    if (typeof t === 'number') {
      // 0 = dawn (6:00), 6000 = noon, 12000 = dusk, 18000 = midnight.
      const hours = Math.floor(((t / 1000 + 6) % 24));
      const mins = Math.floor((t % 1000) / 1000 * 60);
      gameTime = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    }
    ctx.reply(`Real time (UTC): ${now} | In-game: ${gameTime}`);
  }
};
