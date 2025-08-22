// --- Firebase Imports ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, getDocs, limit } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {
    // --- Firebase Configuration ---
    // NOTE: These are special variables that will be provided by the environment.
    const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-gematria-app';

    // --- Initialize Firebase ---
    let db;
    try {
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        await signInAnonymously(auth);
        db = getFirestore(app);
    } catch (error) {
        console.error("Firebase initialization failed:", error);
    }
    
    // The collection path for public data
    const gematriaCollectionRef = collection(db, `/artifacts/${appId}/public/data/gematria`);

    // --- DOM ELEMENTS ---
    const gematriaInput = document.getElementById('gematria-input');
    const gematriaResults = document.getElementById('gematria-results');
    const saveButton = document.getElementById('save-button');
    const dbMatchesContainer = document.getElementById('db-matches');

    // --- GEMATRIA TABLES ---
    const CIPHERS = { Simple: {}, English: {}, Jewish: {} };
    function buildGematriaTables() {
        const jewishVals = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 200, 300, 400, 500, 600, 700, 800];
        for (let i = 0; i < 26; i++) {
            const letter = String.fromCharCode(65 + i);
            CIPHERS.Simple[letter] = i + 1;
            CIPHERS.English[letter] = i + 1;
            CIPHERS.Jewish[letter] = jewishVals[i];
        }
    }
    buildGematriaTables();

    // --- STATE ---
    let currentValues = null;

    // --- EVENT LISTENERS ---
    gematriaInput.addEventListener('input', handleInputChange);
    saveButton.addEventListener('click', saveToDatabase);

    // --- DEBOUNCE for database query ---
    let debounceTimer;
    function handleInputChange() {
        calculateGematria();
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(findMatchesInDB, 500); // Wait 500ms after user stops typing
    }

    // --- CALCULATOR & DATABASE FUNCTIONS ---
    function calculateGematria() {
        const rawText = gematriaInput.value;
        const text = rawText.toUpperCase().replace(/[^A-Z]/g, '');

        if (!text) {
            gematriaResults.innerHTML = '';
            saveButton.disabled = true;
            currentValues = null;
            dbMatchesContainer.innerHTML = '';
            return;
        }

        const values = { Simple: 0, English: 0, Jewish: 0 };
        for (const char of text) {
            values.Simple += CIPHERS.Simple[char] || 0;
            values.English += CIPHERS.English[char] || 0;
            values.Jewish += CIPHERS.Jewish[char] || 0;
        }

        currentValues = {
            phrase: rawText,
            simpleValue: values.Simple,
            englishValue: values.English,
            jewishValue: values.Jewish,
        };

        gematriaResults.innerHTML = `
            <div class="result-card"><h3>Simple</h3><p>${values.Simple}</p></div>
            <div class="result-card"><h3>English</h3><p>${values.English}</p></div>
            <div class="result-card"><h3>Jewish</h3><p>${values.Jewish}</p></div>
        `;
        saveButton.disabled = false;
    }

    async function saveToDatabase() {
        if (!currentValues || !db) return;
        saveButton.disabled = true;
        saveButton.textContent = 'Saving...';
        try {
            await addDoc(gematriaCollectionRef, {
                ...currentValues,
                createdAt: new Date()
            });
            saveButton.textContent = 'Saved!';
        } catch (error) {
            console.error("Error writing document: ", error);
            saveButton.textContent = 'Error!';
        } finally {
            setTimeout(() => {
                saveButton.textContent = 'Save to Database';
                // No need to re-enable, it's disabled until next input change
            }, 2000);
        }
    }

    async function findMatchesInDB() {
        if (!currentValues || !db) return;

        dbMatchesContainer.innerHTML = '<p>Searching for matches...</p>';

        const queries = {
            'Simple': where('simpleValue', '==', currentValues.simpleValue),
            'English': where('englishValue', '==', currentValues.englishValue),
            'Jewish': where('jewishValue', '==', currentValues.jewishValue),
        };

        let resultsHtml = '';
        for (const cipherName in queries) {
            const q = query(gematriaCollectionRef, queries[cipherName], limit(20));
            const querySnapshot = await getDocs(q);
            
            const matches = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                // Don't show the exact same phrase as a match for itself
                if (data.phrase.toLowerCase() !== currentValues.phrase.toLowerCase()) {
                    matches.push(data.phrase);
                }
            });

            if (matches.length > 0) {
                resultsHtml += `
                    <div class="match-category">
                        <h3>Matches for ${cipherName} (${currentValues[cipherName.toLowerCase() + 'Value']})</h3>
                        <div class="match-list">
                            ${matches.map(phrase => `<span class="match-item">${escapeHTML(phrase)}</span>`).join('')}
                        </div>
                    </div>
                `;
            }
        }

        if (resultsHtml === '') {
            dbMatchesContainer.innerHTML = '<p>No other entries found in the database with these values.</p>';
        } else {
            dbMatchesContainer.innerHTML = resultsHtml;
        }
    }
    
    function escapeHTML(str) {
        const p = document.createElement("p");
        p.appendChild(document.createTextNode(str));
        return p.innerHTML;
    }

    // Initial calculation for any pre-filled values
    calculateGematria();
});
