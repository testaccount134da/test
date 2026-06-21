// !rules — display server rules. Rules are stored in the settings collection so
// staff can edit them at runtime with "!rules set <n> <text>".
const DEFAULT_RULES = [
  'Be respectful to all players and staff.',
  'No cheating, hacking, or exploiting bugs.',
  'No spamming or advertising.',
  'Keep chat family-friendly.',
  'Listen to staff decisions.'
];

export default {
  name: 'rules',
  description: 'Show the server rules.',
  aliases: ['rule'],
  usage: '!rules',
  cooldown: 5,
  permission: 0,
  category: 'general',
  async execute(ctx) {
    const { db, reply } = ctx;
    const rules = db.get('settings', 'rules', null) ?? DEFAULT_RULES;
    reply('Server Rules:');
    rules.forEach((r, i) => reply(`${i + 1}. ${r}`));
  }
};
