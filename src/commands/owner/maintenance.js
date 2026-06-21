// !maintenance <on|off> — toggle maintenance mode (only developers+ may use
// commands while enabled).
export default {
  name: 'maintenance',
  description: 'Toggle maintenance mode on or off.',
  aliases: ['maint'],
  usage: '!maintenance <on|off>',
  cooldown: 0,
  permission: 'developer',
  category: 'owner',
  async execute(ctx) {
    const { args, db, sender, reply, logger } = ctx;
    const arg = args[0]?.toLowerCase();
    if (arg !== 'on' && arg !== 'off') {
      const current = db.get('settings', 'maintenance', ctx.config.bot?.maintenance);
      return reply(`Maintenance mode is ${current ? 'ON' : 'OFF'}. Usage: ${ctx.prefix}maintenance <on|off>`);
    }
    const enabled = arg === 'on';
    db.set('settings', 'maintenance', enabled);
    logger.warn('Owner', `${sender} set maintenance ${arg}`);
    reply(`Maintenance mode ${enabled ? 'enabled' : 'disabled'}.`);
  }
};
