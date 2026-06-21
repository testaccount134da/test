// =============================================================================
//  Moderation helpers
// -----------------------------------------------------------------------------
//  Builds server moderation commands from configurable templates and records
//  punishments to the database for an audit trail. The bot must have the
//  relevant permissions on the server for these to take effect.
// =============================================================================

/** Fill {target}/{reason}/{duration} placeholders in a command template. */
export function buildModCommand(template, { target, reason = '', duration = '' }) {
  return template
    .replace(/{target}/g, target ?? '')
    .replace(/{reason}/g, reason ?? '')
    .replace(/{duration}/g, duration ?? '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Record a punishment document and log it. Returns the created record. */
export function recordPunishment(ctx, { type, target, reason, duration }) {
  const record = ctx.db.insert('punishments', {
    type,
    target,
    reason: reason || 'No reason provided',
    duration: duration || null,
    issuedBy: ctx.sender,
    active: true
  });
  ctx.logger.category('moderation', `${type.toUpperCase()} #${record.id}: ${ctx.sender} -> ${target} (${reason || 'no reason'})`);
  return record;
}
