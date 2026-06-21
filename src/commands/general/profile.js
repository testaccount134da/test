import { formatDuration, sanitizeChatArg } from '../../utils/helpers.js';

// !profile [player] — show a player's profile, or set your own bio with
// "!profile setbio <text>".
export default {
  name: 'profile',
  description: 'View a player profile, or set your bio with "setbio <text>".',
  aliases: ['me'],
  usage: '!profile [player] | !profile setbio <text>',
  cooldown: 5,
  permission: 0,
  category: 'general',
  async execute(ctx) {
    const { args, db, economy, permissions, sender, reply } = ctx;

    if (args[0]?.toLowerCase() === 'setbio') {
      const bio = sanitizeChatArg(args.slice(1).join(' ')).slice(0, 100);
      const user = db.getUser(sender);
      user.bio = bio;
      db.saveUser(user);
      return reply(bio ? 'Bio updated.' : 'Bio cleared.');
    }

    const target = args[0] ?? sender;
    const user = db.getUser(target);
    const rank = permissions.getRank(target);
    reply(`=== ${user.username}'s profile ===`);
    reply(`Rank: ${rank} | Balance: ${economy.format(user.balance ?? 0)}`);
    reply(`Commands used: ${user.stats?.commandsUsed ?? 0} | Messages: ${user.stats?.messages ?? 0}`);
    reply(`First seen: ${formatDuration(Date.now() - (user.firstSeen ?? Date.now()))} ago`);
    if (user.bio) reply(`Bio: ${user.bio}`);
  }
};
