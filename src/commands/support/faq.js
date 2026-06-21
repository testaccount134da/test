// !faq [search] — list frequently asked questions or search them.
export default {
  name: 'faq',
  description: 'Browse or search frequently asked questions.',
  aliases: ['faqs'],
  usage: '!faq [search terms]',
  cooldown: 4,
  permission: 0,
  category: 'support',
  async execute(ctx) {
    const { args, config, reply } = ctx;
    const faqs = config.support?.faq ?? [];
    if (!faqs.length) return reply('No FAQs are configured.');

    if (args.length) {
      const query = args.join(' ').toLowerCase();
      const match = faqs.find((f) => f.q.toLowerCase().includes(query) || query.includes(f.q.toLowerCase()));
      if (match) return reply(`Q: ${match.q}\nA: ${match.a}`);
      return reply('No matching FAQ found. Try !faq to list all, or !contact for staff.');
    }

    reply('Frequently Asked Questions:');
    faqs.forEach((f, i) => reply(`${i + 1}. ${f.q}`));
    reply(`Use ${ctx.prefix}faq <search> for an answer.`);
  }
};
