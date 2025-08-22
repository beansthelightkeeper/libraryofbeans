// --- Firebase Imports ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, getDocs, limit } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {
    // --- Firebase Initialization ---
    if (typeof firebaseConfig === 'undefined') {
        console.error("Firebase config is not loaded. Make sure firebase-config.js is included and correct.");
        return;
    }
    
    // This special variable is provided by some hosting environments. We create a fallback for GitHub Pages.
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'gematria-public';
    
    let db;
    try {
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        await signInAnonymously(auth);
        db = getFirestore(app);
    } catch (error) {
        console.error("Firebase initialization failed:", error);
    }
    
    // The CORRECT collection path for public data.
    const gematriaCollectionRef = collection(db, `/artifacts/${appId}/public/data/gematria-entries`);

    // --- DOM ELEMENTS ---
    const gematriaInput = document.getElementById('gematria-input');
    const resultsSummary = document.getElementById('results-summary');
    const breakdownContainer = document.getElementById('breakdown-container');
    const saveButton = document.getElementById('save-button');
    const dbResultsBody = document.getElementById('db-results-body');

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
        debounceTimer = setTimeout(findMatchesInDB, 500);
    }

    // --- CALCULATOR & DATABASE FUNCTIONS ---
    function calculateGematria() {
        const rawText = gematriaInput.value;
        const text = rawText.toUpperCase().replace(/[^A-Z]/g, '');

        if (!text) {
            resultsSummary.innerHTML = '';
            breakdownContainer.innerHTML = '';
            dbResultsBody.innerHTML = '';
            saveButton.disabled = true;
            currentValues = null;
            return;
        }

        const values = { Simple: 0, English: 0, Jewish: 0 };
        const breakdowns = { Simple: '', English: '', Jewish: '' };

        for (const char of rawText.toUpperCase()) {
            if (CIPHERS.Simple[char]) {
                values.Simple += CIPHERS.Simple[char];
                values.English += CIPHERS.English[char];
                values.Jewish += CIPHERS.Jewish[char];
                
                breakdowns.Simple += `<div class="letter-value"><span class="letter">${char}</span><span class="value">${CIPHERS.Simple[char]}</span></div>`;
                breakdowns.English += `<div class="letter-value"><span class="letter">${char}</span><span class="value">${CIPHERS.English[char]}</span></div>`;
                breakdowns.Jewish += `<div class="letter-value"><span class="letter">${char}</span><span class="value">${CIPHERS.Jewish[char]}</span></div>`;
            }
        }

        currentValues = {
            phrase: rawText,
            simpleValue: values.Simple,
            englishValue: values.English,
            jewishValue: values.Jewish,
        };

        resultsSummary.innerHTML = `
            <div class="result-card"><h3>Simple</h3><p>${values.Simple}</p></div>
            <div class="result-card"><h3>English</h3><p>${values.English}</p></div>
            <div class="result-card"><h3>Jewish</h3><p>${values.Jewish}</p></div>
        `;
        
        breakdownContainer.innerHTML = `
            <div class="breakdown"><div class="breakdown-title">Simple Breakdown</div><div class="breakdown-letters">${breakdowns.Simple}</div></div>
            <div class="breakdown"><div class="breakdown-title">English Breakdown</div><div class="breakdown-letters">${breakdowns.English}</div></div>
            <div class="breakdown"><div class="breakdown-title">Jewish Breakdown</div><div class="breakdown-letters">${breakdowns.Jewish}</div></div>
        `;
        
        saveButton.disabled = false;
    }

    async function saveToDatabase() {
        if (!currentValues || !db) return;
        saveButton.disabled = true;
        saveButton.textContent = 'Saving...';
        try {
            // Check if the exact phrase already exists
            const q = query(gematriaCollectionRef, where("phrase", "==", currentValues.phrase));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                 saveButton.textContent = 'Already Saved';
            } else {
                await addDoc(gematriaCollectionRef, {
                    ...currentValues,
                    createdAt: new Date()
                });
                saveButton.textContent = 'Saved!';
            }
        } catch (error) {
            console.error("Error writing document: ", error);
            saveButton.textContent = 'Error!';
        } finally {
            setTimeout(() => {
                saveButton.textContent = 'Save';
            }, 2000);
        }
    }

    async function findMatchesInDB() {
        if (!currentValues || !db) return;

        dbResultsBody.innerHTML = '<tr><td colspan="4">Searching...</td></tr>';

        const queries = [
            where('simpleValue', '==', currentValues.simpleValue),
            where('englishValue', '==', currentValues.englishValue),
            where('jewishValue', '==', currentValues.jewishValue),
        ];

        const allMatches = new Map();

        for (const qWhere of queries) {
            const q = query(gematriaCollectionRef, qWhere, limit(50));
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.phrase.toLowerCase() !== currentValues.phrase.toLowerCase()) {
                    allMatches.set(data.phrase, data);
                }
            });
        }

        if (allMatches.size === 0) {
            dbResultsBody.innerHTML = '<tr><td colspan="4">No other entries found in the database.</td></tr>';
        } else {
            let resultsHtml = '';
            for (const [phrase, values] of allMatches) {
                resultsHtml += `
                    <tr>
                        <td>${escapeHTML(phrase)}</td>
                        <td>${values.jewishValue}</td>
                        <td>${values.englishValue}</td>
                        <td>${values.simpleValue}</td>
                    </tr>
                `;
            }
            dbResultsBody.innerHTML = resultsHtml;
        }
    }
    
    function escapeHTML(str) {
        const p = document.createElement("p");
        p.appendChild(document.createTextNode(str));
        return p.innerHTML;
    }

    calculateGematria();
});
