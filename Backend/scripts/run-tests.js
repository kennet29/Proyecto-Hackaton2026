const { readdirSync, statSync } = require('node:fs');
const { join } = require('node:path');
const { spawnSync } = require('node:child_process');

function collectSpecFiles(dir) {
  const entries = readdirSync(dir);
  const specFiles = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      specFiles.push(...collectSpecFiles(fullPath));
      continue;
    }

    if (entry.endsWith('.spec.js')) {
      specFiles.push(fullPath);
    }
  }

  return specFiles;
}

const specFiles = collectSpecFiles(join(__dirname, '..', 'dist')).sort();

if (specFiles.length === 0) {
  console.log('No compiled spec files found in dist.');
  process.exit(0);
}

const result = spawnSync(process.execPath, ['--test', ...specFiles], {
  stdio: 'inherit',
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
