import { teleportToCoords, getPlayerPosition } from '../../utils/teleport.js';
import { sanitizeChatArg } from '../../utils/helpers.js';

// !warp <name> — teleport to a server warp. Staff manage warps:
//   !warp set <name>   (save the staff member's current position as a warp)
//   !warp del <name>
//   !warp list
export default {
  name: 'warp',
  description: 'Teleport to a server warp. Staff: warp set/del <name>.',
  aliases: ['warps'],
  usage: '!warp <name> | !warp list | !warp set <name> | !warp del <name>',
  cooldown: 5,
  permission: 0,
  category: 'teleport',
  async execute(ctx) {
    const { args, config, db, permissions, sender, reply, bot } = ctx;
    if (config.teleport?.enabled === false) return reply('Teleportation is disabled.');

    const warps = db.collection('warps');
    const sub = args[0]?.toLowerCase();

    if (sub === 'list') {
      const names = Object.keys(warps);
      return reply(names.length ? `Warps: ${names.join(', ')}` : 'No warps have been set.');
    }

    // Staff management (moderator+).
    if (sub === 'set' || sub === 'del' || sub === 'delete') {
      if (!permissions.has(sender, 'moderator')) return reply('Only staff can manage warps.');
      const name = sanitizeChatArg(args[1])?.toLowerCase().slice(0, 20);
      if (!name) return reply('Provide a warp name.');
      if (sub === 'set') {
        const pos = getPlayerPosition(bot, sender);
        if (!pos) return reply('Stand near me so I can read your position.');
        warps[name] = pos;
        db.markDirty();
        return reply(`Warp "${name}" set at ${pos.x}, ${pos.y}, ${pos.z}.`);
      }
      if (warps[name]) {
        delete warps[name];
        db.markDirty();
        return reply(`Deleted warp "${name}".`);
      }
      return reply('No such warp.');
    }

    // Normal use: teleport to a warp.
    if (!sub) return reply(`Usage: ${ctx.prefix}warp <name>`);
    const pos = warps[sub];
    if (!pos) return reply(`No warp named "${sub}". See ${ctx.prefix}warp list.`);
    teleportToCoords(ctx, sender, pos);
    reply(`Warping you to "${sub}"...`);
  }
};
