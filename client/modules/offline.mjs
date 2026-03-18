const DB_NAME = 'moodmate-offline';
const STORE_NAME = 'moods';
const DB_VERSION = 1;

// ---------------------------------------------------------------------------------------------------------------------

function openDb()
{
    return new Promise((resolve, reject) =>
    {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () =>
        {
            const db = req.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

// ---------------------------------------------------------------------------------------------------------------------

function promisifyRequest(req)
{
    return new Promise((resolve, reject) =>
    {
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

// ---------------------------------------------------------------------------------------------------------------------

export async function saveMoodOffline(mood)
{
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const record =
        {
            payload: mood,
            createdAt: new Date().toISOString()
        };
    const req = store.add(record);
    await promisifyRequest(req);
    await promisifyRequest(tx.complete || tx);
    db.close();
}

// ---------------------------------------------------------------------------------------------------------------------

export async function getAllStoredMoods()
{
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    const all = await promisifyRequest(req);
    db.close();
    return all || [];
}

// ---------------------------------------------------------------------------------------------------------------------

export async function clearStoredMoods()
{
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.clear();
    await promisifyRequest(req);
    await promisifyRequest(tx.complete || tx);
    db.close();
}

// ---------------------------------------------------------------------------------------------------------------------

export async function syncStoredMoods(serverUrl = '/api/moods/bulk', options = {})
{
    const stored = await getAllStoredMoods();
    if (!stored.length) return { sent: 0 };

    try
    {
        const res = await fetch(serverUrl,
            {
                method: 'POST',
                headers: Object.assign({ 'Content-Type': 'application/json' }, options.headers || {}),
                credentials: options.credentials || 'same-origin',
                body: JSON.stringify(stored.map(r => r.payload))
            });

        if (!res.ok) {
            return { error: `Sync failed: ${res.status}`, status: res.status };
        }

        await clearStoredMoods();
        return { sent: stored.length };
    } catch (err) {
        return { error: err.message || String(err) };
    }
}

// ---------------------------------------------------------------------------------------------------------------------

export async function saveMoodOrSend(mood, serverUrl = '/api/moods')
{
    if (navigator.onLine)
    {
        try
        {
            const res = await fetch(serverUrl,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify(mood)
            });
            if (!res.ok) {
                await saveMoodOffline(mood);
                return { sent: false, savedOffline: true, error: `Server responded ${res.status}`, status: res.status };
            }
            return { sent: true };
        } catch (err) {
            await saveMoodOffline(mood);
            return { sent: false, savedOffline: true, error: err.message || String(err) };
        }
    } else {
        await saveMoodOffline(mood);
        return { sent: false, savedOffline: true };
    }
}

// ---------------------------------------------------------------------------------------------------------------------

export function initOfflineSync(serverUrlSync = '/api/moods/bulk', debounceMs = 1000)
{
    let timer = null;
    async function trySync()
    {
        if (timer) clearTimeout(timer);
        timer = setTimeout(async () =>
        {
            if (!navigator.onLine) return;
            await syncStoredMoods(serverUrlSync);
            timer = null;
        }, debounceMs);
    }

    window.addEventListener('online', () => { void trySync(); });

    if (navigator.onLine) {
        void trySync();
    }
}

// ---------------------------------------------------------------------------------------------------------------------

if (typeof window !== 'undefined')
{
    window.MoodMate = window.MoodMate || {};
    window.MoodMate.saveMoodOrSend = saveMoodOrSend;
    window.MoodMate.syncStoredMoods = syncStoredMoods;
    window.MoodMate.getAllStoredMoods = getAllStoredMoods;
    window.MoodMate.clearStoredMoods = clearStoredMoods;
    window.MoodMate.saveMoodOffline = saveMoodOffline;
    window.MoodMate.initOfflineSync = initOfflineSync;

    const autoOfflineDisabled = Boolean(window && window['__MOODMATE_DISABLE_AUTO_OFFLINE__']);

    if (!autoOfflineDisabled) {
        initOfflineSync();
    }
}