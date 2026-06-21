// =============================================================================
//  Standalone backup script  (npm run backup)
// -----------------------------------------------------------------------------
//  Copies every data/*.json collection into a timestamped folder under backups/.
//  Useful as a cron job independent of the running bot.
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = 'data';
const BACKUP_DIR = 'backups';

if (!fs.existsSync(DATA_DIR)) {
  console.log('No data directory found — nothing to back up.');
  process.exit(0);
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const dest = path.join(BACKUP_DIR, stamp);
fs.mkdirSync(dest, { recursive: true });

let count = 0;
for (const file of fs.readdirSync(DATA_DIR)) {
  if (file.endsWith('.json')) {
    fs.copyFileSync(path.join(DATA_DIR, file), path.join(dest, file));
    count++;
  }
}

console.log(`Backed up ${count} collection(s) to ${dest}`);
