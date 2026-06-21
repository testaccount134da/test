// !ai / !ask <question> — ask the built-in OpenRouter-powered assistant.
export default {
  name: 'ai',
  description: 'Ask the built-in AI assistant a question.',
  aliases: ['ask', 'gpt'],
  usage: '!ai <question>',
  cooldown: 10, // overridden below by config if present
  permission: 0,
  category: 'general',
  async execute(ctx) {
    const { args, ai, sender, reply, config } = ctx;

    // Apply AI-specific permission/cooldown from config at runtime.
    if (!ai.available) {
      return reply('AI is currently unavailable (no API key configured).');
    }
    const question = args.join(' ').trim();
    if (!question) return reply(`Usage: ${ctx.prefix}ai <question>`);
    if (question.toLowerCase() === 'reset') {
      ai.resetMemory(sender);
      return reply('Your AI conversation memory has been cleared.');
    }

    reply('Thinking...');
    try {
      const answer = await ai.ask(sender, question);
      reply(answer);
    } catch (err) {
      reply(`AI error: ${err.message}`);
    }
  }
};
