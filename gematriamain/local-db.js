// --- INDEXEDDB SETUP ---
const DB_NAME = 'GematriaStatsDB';
const DB_VERSION = 1;
const STORE_NAME = 'searches';

let db;

function openDB() {
    return new Promise((resolve, reject) => {
        if (db) {
            return resolve(db);
        }
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error("Database error:", event.target.error);
            reject("Database error");
        };

        request.onupgradeneeded = (event) => {
            const dbInstance = event.target.result;
            if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
                const store = dbInstance.createObjectStore(STORE_NAME, { keyPath: 'term' });
                store.createIndex('count', 'count', { unique: false });
            }
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            resolve(db);
        };
    });
}

// --- DATABASE FUNCTIONS ---

/**
 * Records a search term. If it exists, increments the count. If not, adds it.
 * @param {string} term The search term to record.
 */
async function recordSearch(term) {
    const cleanedTerm = term.trim().toLowerCase();
    if (!cleanedTerm) return;

    try {
        const db = await openDB();
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        const request = store.get(cleanedTerm);

        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                const data = request.result;
                if (data) {
                    data.count++;
                    store.put(data);
                } else {
                    store.add({ term: cleanedTerm, count: 1 });
                }
            };
            
            transaction.oncomplete = () => resolve();
            transaction.onerror = (event) => reject(event.target.error);
        });

    } catch (error) {
        console.error("Failed to record search:", error);
    }
}


/**
 * Retrieves the top N most searched terms.
 * @param {number} limit The number of top terms to retrieve.
 * @returns {Promise<Array<{term: string, count: number}>>}
 */
async function getTopSearches(limit = 10) {
    try {
        const db = await openDB();
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index('count');

        const allRecords = [];
        return new Promise((resolve, reject) => {
            // openCursor with 'prev' direction to sort descending
            index.openCursor(null, 'prev').onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor && allRecords.length < limit) {
                    allRecords.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(allRecords);
                }
            };
            transaction.onerror = (event) => reject(event.target.error);
        });

    } catch (error) {
        console.error("Failed to get top searches:", error);
        return [];
    }
}


// Export the functions for use in other modules
export { db, openDB, recordSearch, getTopSearches };
