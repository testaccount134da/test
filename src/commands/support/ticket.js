import { sanitizeChatArg } from '../../utils/helpers.js';

// !ticket — support ticket system.
//   !ticket open <category> <message>   create a ticket
//   !ticket list                        list your tickets (staff: all open)
//   !ticket view <id>                   view a ticket
//   !ticket close <id>                  close a ticket (owner or staff)
export default {
  name: 'ticket',
  description: 'Open and manage support tickets.',
  aliases: ['tickets'],
  usage: '!ticket open <category> <message> | list | view <id> | close <id>',
  cooldown: 4,
  permission: 0,
  category: 'support',
  async execute(ctx) {
    const { args, db, config, permissions, sender, reply, logger } = ctx;
    const sub = (args[0] ?? 'help').toLowerCase();
    const isStaff = permissions.has(sender, config.support?.staffPingRankLevel ?? 20);

    if (sub === 'open' || sub === 'create') {
      const categories = config.support?.ticketCategories ?? ['general'];
      let category = (args[1] ?? '').toLowerCase();
      let messageStart = 2;
      if (!categories.includes(category)) {
        category = 'general';
        messageStart = 1; // treat everything after "open" as the message
      }
      const message = sanitizeChatArg(args.slice(messageStart).join(' '));
      if (!message) return reply(`Usage: ${ctx.prefix}ticket open <${categories.join('|')}> <message>`);

      const ticket = db.insert('tickets', {
        author: sender,
        category,
        message,
        status: 'open',
        replies: []
      });
      logger.category('ticket', `#${ticket.id} opened by ${sender} [${category}]: ${message}`);
      reply(`Ticket #${ticket.id} opened in "${category}". Staff have been notified.`);
      // Notify online staff.
      for (const p of ctx.bot.onlinePlayers()) {
        if (permissions.has(p, config.support?.staffPingRankLevel ?? 20)) {
          ctx.bot.whisperTo(p, `New ticket #${ticket.id} from ${sender}: ${message}`);
        }
      }
      return;
    }

    if (sub === 'list') {
      const tickets = db.all('tickets').filter((t) =>
        isStaff ? t.status === 'open' : t.author.toLowerCase() === sender.toLowerCase()
      );
      if (!tickets.length) return reply('No tickets found.');
      reply(isStaff ? 'Open tickets:' : 'Your tickets:');
      tickets.slice(-10).forEach((t) => reply(`#${t.id} [${t.status}] ${t.category}: ${t.message.slice(0, 60)}`));
      return;
    }

    if (sub === 'view') {
      const t = db.get('tickets', Number(args[1]));
      if (!t) return reply('Ticket not found.');
      if (!isStaff && t.author.toLowerCase() !== sender.toLowerCase()) return reply('That is not your ticket.');
      reply(`#${t.id} [${t.status}] by ${t.author} (${t.category}): ${t.message}`);
      (t.replies ?? []).forEach((r) => reply(`  - ${r.from}: ${r.text}`));
      return;
    }

    if (sub === 'reply') {
      const id = Number(args[1]);
      const t = db.get('tickets', id);
      if (!t) return reply('Ticket not found.');
      if (!isStaff && t.author.toLowerCase() !== sender.toLowerCase()) return reply('That is not your ticket.');
      const text = sanitizeChatArg(args.slice(2).join(' '));
      if (!text) return reply('Provide a reply message.');
      t.replies = t.replies ?? [];
      t.replies.push({ from: sender, text, at: Date.now() });
      db.set('tickets', id, t);
      logger.category('ticket', `#${id} reply by ${sender}: ${text}`);
      return reply(`Reply added to ticket #${id}.`);
    }

    if (sub === 'close') {
      const id = Number(args[1]);
      const t = db.get('tickets', id);
      if (!t) return reply('Ticket not found.');
      if (!isStaff && t.author.toLowerCase() !== sender.toLowerCase()) return reply('You cannot close that ticket.');
      t.status = 'closed';
      t.closedBy = sender;
      t.closedAt = Date.now();
      db.set('tickets', id, t);
      logger.category('ticket', `#${id} closed by ${sender}`);
      return reply(`Ticket #${id} closed.`);
    }

    reply(`Usage: ${ctx.prefix}ticket open <category> <message> | list | view <id> | reply <id> <text> | close <id>`);
  }
};
