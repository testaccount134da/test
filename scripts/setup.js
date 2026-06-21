// =============================================================================
//  Setup script  (npm run setup)
// -----------------------------------------------------------------------------
//  Creates config/config.json and config/ranks.json from the example files (if
//  they don't already exist) and ensures the runtime directories are present.
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';

function copyIfMissing(example, target) {
  if (fs.existsSync(target)) {
    console.log(`✓ ${target} already exists (skipped).`);
    return;
  }
  if (!fs.existsSync(example)) {
    console.log(`! Missing example file ${example}.`);
    return;
  }
  fs.copyFileSync(example, target);
  console.log(`✓ Created ${target} from ${example}.`);
}

console.log('Setting up Minecraft Support Bot...\n');

copyIfMissing(path.join('config', 'config.example.json'), path.join('config', 'config.json'));
copyIfMissing(path.join('config', 'ranks.example.json'), path.join('config', 'ranks.json'));
copyIfMissing('.env.example', '.env');

for (const dir of ['data', 'logs', 'backups']) {
  fs.mkdirSync(dir, { recursive: true });
  console.log(`✓ Ensured directory ${dir}/`);
}

console.log('\nDone! Next steps:');
console.log('  1. Edit config/config.json (server host, username, owners).');
console.log('  2. (Optional) Put your OPENROUTER_API_KEY in .env for AI commands.');
console.log('  3. Run: npm start');
