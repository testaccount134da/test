// =============================================================================
//  Teleport helpers
// -----------------------------------------------------------------------------
//  Shared utilities + in-memory request store for the teleport commands.
//  The bot issues vanilla-style "/tp" commands, so it must have permission
//  (OP) on the server. Formats are configurable in config.teleport.
// =============================================================================

import { isValidUsername } from './helpers.js';

// Pending !tpa requests: targetLower -> { from, at }
export const tpaRequests = new Map();

/** Fill {player}/{target}/{x}/{y}/{z} placeholders in a command template. */
export function buildTpCommand(template, values) {
  return template
    .replace(/{player}/g, values.player ?? '')
    .replace(/{target}/g, values.target ?? '')
    .replace(/{x}/g, values.x ?? '')
    .replace(/{y}/g, values.y ?? '')
    .replace(/{z}/g, values.z ?? '')
    .trim();
}

/** Get a visible player's current position from the bot's world view. */
export function getPlayerPosition(bot, username) {
  const entity = bot.mc?.players?.[username]?.entity;
  if (!entity?.position) return null;
  const p = entity.position;
  return { x: Math.round(p.x), y: Math.round(p.y), z: Math.round(p.z) };
}

/** Validate + run a teleport-to-coordinates command for a player. */
export function teleportToCoords(ctx, player, coords) {
  if (!isValidUsername(player)) return false;
  const cmd = buildTpCommand(ctx.config.teleport.tpToCoords, { player, ...coords });
  ctx.bot.sendRaw(cmd);
  return true;
}
