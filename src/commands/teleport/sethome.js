import { getPlayerPosition } from '../../utils/teleport.js';
import { sanitizeChatArg } from '../../utils/helpers.js';

// !sethome [name] — save your current position as a home. You must be standing
// within the bot's render distance so it can read your coordinates.
export default {
  name: 'sethome',
  description: 'Save your current location as a home (stand near the bot).',
  aliases: [],
  usage: '!sethome [name]',
  cooldown: 5,
  permission: 0,
  category: 'teleport',
  async execute(ctx) {
    const { args, config, db, sender, reply, bot } = ctx;
    if (config.teleport?.enabled === false) return reply('Teleportation is disabled.');

    const name = (sanitizeChatArg(args[0]) || 'home').toLowerCase().slice(0, 20);
    const pos = getPlayerPosition(bot, sender);
    if (!pos) return reply('I cannot see your position. Stand near me and try again.');

    const key = sender.toLowerCase();
    const homes = db.get('homes', key, {});
    const max = config.teleport.maxHomesPerPlayer ?? 3;
    if (!homes[name] && Object.keys(homes).length >= max) {
      return reply(`You can only have ${max} homes. Delete one with ${ctx.prefix}home del <name>.`);
    }
    homes[name] = pos;
    db.set('homes', key, homes);
    reply(`Home "${name}" set at ${pos.x}, ${pos.y}, ${pos.z}.`);
  }
};
