import { teleportToCoords } from '../../utils/teleport.js';

// !home [name] — teleport to one of your saved homes. "!home list" lists them.
export default {
  name: 'home',
  description: 'Teleport to a saved home. Use "!home list" to see your homes.',
  aliases: ['homes'],
  usage: '!home [name] | !home list | !home del <name>',
  cooldown: 5,
  permission: 0,
  category: 'teleport',
  async execute(ctx) {
    const { args, config, db, sender, reply } = ctx;
    if (config.teleport?.enabled === false) return reply('Teleportation is disabled.');

    const key = sender.toLowerCase();
    const homes = db.get('homes', key, {});
    const sub = args[0]?.toLowerCase();

    if (sub === 'list') {
      const names = Object.keys(homes);
      return reply(names.length ? `Your homes: ${names.join(', ')}` : 'You have no homes set.');
    }
    if (sub === 'del' || sub === 'delete') {
      const name = args[1]?.toLowerCase();
      if (name && homes[name]) {
        delete homes[name];
        db.set('homes', key, homes);
        return reply(`Deleted home "${name}".`);
      }
      return reply('No such home.');
    }

    const name = (sub || 'home');
    const pos = homes[name];
    if (!pos) return reply(`No home named "${name}". Use ${ctx.prefix}sethome ${name}.`);
    teleportToCoords(ctx, sender, pos);
    reply(`Teleporting you home to "${name}"...`);
  }
};
