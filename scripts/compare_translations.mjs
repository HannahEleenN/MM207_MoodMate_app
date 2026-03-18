import fs from 'fs';
import path from 'path';

const translationsDir = path.resolve('./client/translations');
const files = fs.readdirSync(translationsDir).filter(f => f.endsWith('.json'));

function loadKeys(file)
{
  const content = fs.readFileSync(path.join(translationsDir, file), 'utf8');
  try { const json = JSON.parse(content); return Object.keys(json).sort(); } catch (e) { console.error('PARSE ERROR', file, e.message); return null; }
}

const all = {};
for (const f of files)
{
  const keys = loadKeys(f);
  if (!keys) continue;
  all[f] = new Set(keys);
}

const baseFile = 'no.json';
if (!all[baseFile]) {
  console.error('Base file no.json not found in', Object.keys(all));
  process.exit(2);
}

const baseKeys = all[baseFile];

function difference(a, b) {
  return [...a].filter(x => !b.has(x)).sort();
}

console.log('Translation files checked:', files.join(', '));
console.log('Comparing to base:', baseFile);

let ok = true;
for (const f of files)
{
  const keys = all[f];
  const missing = difference(baseKeys, keys);
  const extra = difference(keys, baseKeys);
  if (missing.length === 0 && extra.length === 0) {
    console.log(`${f}: OK`);
  } else
  {
    ok = false;
    console.log(`\n${f}: MISMATCH`);
    if (missing.length) console.log('  Missing keys (present in no.json):', missing.slice(0, 50));
    if (extra.length) console.log('  Extra keys (not in no.json):', extra.slice(0, 50));
  }
}

if (!ok) process.exit(1);
console.log('\nAll translation files contain the same keys as no.json');