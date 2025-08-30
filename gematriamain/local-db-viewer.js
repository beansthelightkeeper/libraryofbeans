document.addEventListener('DOMContentLoaded', () => {

    const resultsArea = document.getElementById('results-area');

    // --- Gematria Cipher Definitions (copied from calculator.js) ---
    const ciphers = {
        simple: { 'a': 1, 'b': 2, 'c': 3, 'd': 4, 'e': 5, 'f': 6, 'g': 7, 'h': 8, 'i': 9, 'j': 10, 'k': 11, 'l': 12, 'm': 13, 'n': 14, 'o': 15, 'p': 16, 'q': 17, 'r': 18, 's': 19, 't': 20, 'u': 21, 'v': 22, 'w': 23, 'x': 24, 'y': 25, 'z': 26 },
        english: { 'a': 6, 'b': 12, 'c': 18, 'd': 24, 'e': 30, 'f': 36, 'g': 42, 'h': 48, 'i': 54, 'j': 60, 'k': 66, 'l': 72, 'm': 78, 'n': 84, 'o': 90, 'p': 96, 'q': 102, 'r': 108, 's': 114, 't': 120, 'u': 126, 'v': 132, 'w': 138, 'x': 144, 'y': 150, 'z': 156 },
        jewish: { 'a': 1, 'b': 2, 'c': 3, 'd': 4, 'e': 5, 'f': 6, 'g': 7, 'h': 8, 'i': 9, 'j': 600, 'k': 10, 'l': 20, 'm': 30, 'n': 40, 'o': 50, 'p': 60, 'q': 70, 'r': 80, 's': 90, 't': 100, 'u': 200, 'v': 700, 'w': 900, 'x': 300, 'y': 400, 'z': 500 }
    };

    /**
     * Calculates the Gematria values for a given text.
     */
    function calculateGematria(text) {
        const lowerText = text.toLowerCase().replace(/[^a-z]/g, '');
        let simple = 0, english = 0, jewish = 0;

        for (const char of lowerText) {
            if (ciphers.simple[char]) {
                simple += ciphers.simple[char];
                english += ciphers.english[char];
                jewish += ciphers.jewish[char];
            }
        }
        return { simple, english, jewish };
    }

    /**
     * Retrieves all entries from the IndexedDB.
     * @returns {Promise<Array<{term: string, count: number}>>}
     */
    async function getAllEntries() {
        try {
            // openDB should be available globally from local-db.js
            const db = await openDB();
            const transaction = db.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            return new Promise((resolve, reject) => {
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result);
                request.onerror = (event) => reject(event.target.error);
            });
        } catch (error) {
            console.error("Failed to get all entries:", error);
            return [];
        }
    }


    /**
     * Displays all database entries in a table.
     */
    async function displayAllEntries() {
        const entries = await getAllEntries();

        if (!resultsArea) return;
        
        if (entries.length === 0) {
            resultsArea.innerHTML = '<p style="text-align:center;">No words found in the local database.</p>';
            return;
        }

        // Sort entries alphabetically by term
        entries.sort((a, b) => a.term.localeCompare(b.term));

        let tablesHtml = `
            <table class="results-table">
                <caption>All Words in Local Database (${entries.length} entries)</caption>
                <thead>
                    <tr>
                        <th>Word/Phrase</th>
                        <th>Jewish</th>
                        <th>English</th>
                        <th>Simple</th>
                        <th>Save Count</th>
                    </tr>
                </thead>
                <tbody>
                    ${entries.map(entry => {
                        const values = calculateGematria(entry.term);
                        return `
                            <tr>
                                <td><a href="gematria_calculator.html?word=${encodeURIComponent(entry.term)}">${entry.term}</a></td>
                                <td>${values.jewish}</td>
                                <td>${values.english}</td>
                                <td>${values.simple}</td>
                                <td>${entry.count}</td>
                            </tr>
                        `
                    }).join('')}
                </tbody>
            </table>
        `;
        
        resultsArea.innerHTML = tablesHtml;
    }

    // --- Initial Load ---
    displayAllEntries();
});
