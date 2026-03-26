const DB_NAME = 'moodmate-offline';
const STORE_NAME = 'moods';
const DB_VERSION = 1;

// ---------------------------------------------------------------------------------------------------------------------

function openDb()
{
    return new Promise((resolve, reject) =>
    {
        const indexedDBRequest = indexedDB.open(DB_NAME, DB_VERSION);
        indexedDBRequest.onupgradeneeded = () =>
        {
            const database = indexedDBRequest.result;
            if (!database.objectStoreNames.contains(STORE_NAME)) {
                database.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
        };
        indexedDBRequest.onsuccess = () => resolve(indexedDBRequest.result);
        indexedDBRequest.onerror = () => reject(indexedDBRequest.error);
    });
}

// ---------------------------------------------------------------------------------------------------------------------

function promisifyRequest(indexedDBRequest)
{
    return new Promise((resolve, reject) =>
    {
        indexedDBRequest.onsuccess = () => resolve(indexedDBRequest.result);
        indexedDBRequest.onerror = () => reject(indexedDBRequest.error);
    });
}

// ---------------------------------------------------------------------------------------------------------------------

export async function saveMoodOffline(mood)
{
    const database = await openDb();
    const databaseTransaction = database.transaction(STORE_NAME, 'readwrite');
    const objectStore = databaseTransaction.objectStore(STORE_NAME);

    const moodRecord =
    {
        payload: mood,
        createdAt: new Date().toISOString()
    };

    const indexedDBRequest = objectStore.add(moodRecord);
    await promisifyRequest(indexedDBRequest);
    await promisifyRequest(databaseTransaction.complete || databaseTransaction);
    database.close();
}

// ---------------------------------------------------------------------------------------------------------------------

export async function getAllStoredMoods()
{
    const database = await openDb();
    const databaseTransaction = database.transaction(STORE_NAME, 'readonly');
    const objectStore = databaseTransaction.objectStore(STORE_NAME);
    const indexedDBRequest = objectStore.getAll();
    const storedMoodsList = await promisifyRequest(indexedDBRequest);
    database.close();
    return storedMoodsList || [];
}

// ---------------------------------------------------------------------------------------------------------------------

export async function clearStoredMoods()
{
    const database = await openDb();
    const databaseTransaction = database.transaction(STORE_NAME, 'readwrite');
    const objectStore = databaseTransaction.objectStore(STORE_NAME);
    const indexedDBRequest = objectStore.clear();
    await promisifyRequest(indexedDBRequest);
    await promisifyRequest(databaseTransaction.complete || databaseTransaction);
    database.close();
}

// ---------------------------------------------------------------------------------------------------------------------

export async function syncStoredMoods(serverUrl = '/api/moods/bulk', options = {})
{
    const offlineStoredMoods = await getAllStoredMoods();
    if (!offlineStoredMoods.length) return { sent: 0 };

    try
    {
        const fetchResponse = await fetch(serverUrl,
        {
            method: 'POST',
            headers: Object.assign({ 'Content-Type': 'application/json' }, options.headers || {}),
            credentials: options.credentials || 'same-origin',
            body: JSON.stringify(offlineStoredMoods.map(storedMood => storedMood.payload))
        });

        if (!fetchResponse.ok) {
            return { error: `Sync failed: ${fetchResponse.status}`, status: fetchResponse.status };
        }

        await clearStoredMoods();
        return { sent: offlineStoredMoods.length };
    } catch (error) {
        return { error: error.message || String(error) };
    }
}

// ---------------------------------------------------------------------------------------------------------------------

export async function saveMoodOrSend(mood, serverUrl = '/api/moods')
{
    if (navigator.onLine)
    {
        try
        {
            const fetchResponse = await fetch(serverUrl,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify(mood)
            });
            if (!fetchResponse.ok)
            {
                await saveMoodOffline(mood);
                return { sent: false, savedOffline: true, error: `Server responded ${fetchResponse.status}`, status: fetchResponse.status };
            }
            return { sent: true };
        } catch (error) {
            await saveMoodOffline(mood);
            return { sent: false, savedOffline: true, error: error.message || String(error) };
        }
    } else {
        await saveMoodOffline(mood);
        return { sent: false, savedOffline: true };
    }
}

// ---------------------------------------------------------------------------------------------------------------------

export function initOfflineSync(serverUrlSync = '/api/moods/bulk', debounceMs = 1000)
{
    let syncDebounceTimer = null;
    async function trySync()
    {
        if (syncDebounceTimer) clearTimeout(syncDebounceTimer);
        syncDebounceTimer = setTimeout(async () =>
        {
            if (!navigator.onLine) return;
            await syncStoredMoods(serverUrlSync);
            syncDebounceTimer = null;
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
