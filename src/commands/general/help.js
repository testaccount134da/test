// !help / !commands — list commands the player can use, or detail one command.
export default {
  name: 'help',
  description: 'List available commands or get help for a specific command.',
  aliases: ['commands', 'cmds', 'h'],
  usage: '!help [command]',
  cooldown: 4,
  permission: 0,
  category: 'general',
  async execute(ctx) {
    const { args, commands, sender, reply, prefix } = ctx;

    // Detailed help for one command.
    if (args.length) {
      const cmd = commands.resolve(args[0]);
      if (!cmd) return reply(`No command named "${args[0]}".`);
      const lines = [
        `${prefix}${cmd.name} — ${cmd.description}`,
        `Usage: ${cmd.usage}`,
        cmd.aliases.length ? `Aliases: ${cmd.aliases.join(', ')}` : null,
        `Category: ${cmd.category} | Cooldown: ${cmd.cooldown}s | Permission: ${cmd.permission}`
      ].filter(Boolean);
      return reply(lines.join('\n'));
    }

    // List everything the sender is allowed to use, grouped by category.
    const allowed = commands.listFor(sender);
    const groups = {};
    for (const c of allowed) (groups[c.category] ??= []).push(c.name);

    reply(`Commands you can use (prefix "${prefix}"):`);
    for (const [cat, names] of Object.entries(groups).sort()) {
      reply(`${cat}: ${names.sort().join(', ')}`);
    }
    reply(`Use ${prefix}help <command> for details.`);
  }
};
