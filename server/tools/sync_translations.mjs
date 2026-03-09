import fs from 'fs/promises';
import path from 'path';

// Run from server/; translations are in ../client/translations
const translationsDir = path.resolve(process.cwd(), '..', 'client', 'translations');
const reference = 'no.json';

async function loadJson(file) {
    const txt = await fs.readFile(file, 'utf8');
    return JSON.parse(txt);
}

async function writeJson(file, obj) {
    const txt = JSON.stringify(obj, null, 2) + '\n';
    await fs.writeFile(file, txt, 'utf8');
}

async function sync()
{
    const refPath = path.join(translationsDir, reference);
    const ref = await loadJson(refPath);
    const keys = Object.keys(ref);

    const files = await fs.readdir(translationsDir);
    for (const f of files) {
        if (!f.endsWith('.json')) continue;
        const full = path.join(translationsDir, f);
        if (f === reference) continue;
        try {
            const obj = await loadJson(full);
            let changed = false;
            // Ensure all keys exist. If missing, fill with Norwegian text as placeholder
            for (const k of keys) {
                if (!(k in obj)) { obj[k] = ref[k]; changed = true; }
            }
            // Remove extra keys not in reference
            for (const k of Object.keys(obj)) {
                if (!keys.includes(k)) { delete obj[k]; changed = true; }
            }
            if (changed) {
                await writeJson(full, obj);
                console.log('Synced', f);
            } else {
                console.log('No changes for', f);
            }
        } catch (e) {
            console.error('Failed syncing', f, e.message);
        }
    }
}

sync().catch(e => { console.error(e); process.exit(1); });
