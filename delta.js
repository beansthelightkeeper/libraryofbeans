// --- Firebase Imports ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs, limit } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- GLOBAL STATE & CONSTANTS ---
const CIPHERS = {};

// --- GEMATRIA CIPHER DEFINITIONS ---
function buildGematriaCiphers() {
    const a = 'abcdefghijklmnopqrstuvwxyz';
    const simpleMap = {};
    a.split('').forEach((l, i) => { simpleMap[l] = i + 1; });

    const calculateWithMap = (text, map) => text.toLowerCase().split('').reduce((sum, char) => sum + (map[char] || 0), 0);
    
    CIPHERS['Simple'] = (text) => calculateWithMap(text, simpleMap);
    CIPHERS['English'] = (text) => CIPHERS.Simple(text) * 6;
    
    const reverse = (text) => text.split('').reverse().join('');
    CIPHERS['ReverseSimple'] = (text) => CIPHERS.Simple(reverse(text));
}
buildGematriaCiphers();

// --- THEME MANAGEMENT ---
const ICONS = {
    sun: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`,
    moon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`
};

function applyTheme(theme, themeToggleButton) {
    document.body.dataset.theme = theme;
    themeToggleButton.innerHTML = theme === 'dark' ? ICONS.sun : ICONS.moon;
    localStorage.setItem('gematria-theme', theme);
}

function toggleTheme(themeToggleButton) {
    const currentTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(currentTheme, themeToggleButton);
}

// --- MAIN APP LOGIC ---
document.addEventListener('DOMContentLoaded', async () => {
    let db;
    try {
        if (typeof firebaseConfig === 'undefined') throw new Error("Firebase config is not loaded.");
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        await signInAnonymously(auth);
        db = getFirestore(app);
    } catch (error) { console.error("Firebase initialization failed:", error); return; }
    
    initDeltaPage(db);
});

// --- DELTA PAGE LOGIC ---
function initDeltaPage(db) {
    const input1 = document.getElementById('delta-input-1');
    const input2 = document.getElementById('delta-input-2');
    const resultsContainer = document.getElementById('delta-results-container');
    const themeToggleButton = document.getElementById('theme-toggle');

    // --- Initialize Theme ---
    const savedTheme = localStorage.getItem('gematria-theme') || 'dark';
    applyTheme(savedTheme, themeToggleButton);
    themeToggleButton.addEventListener('click', () => toggleTheme(themeToggleButton));

    const handleInput = () => {
        const text1 = input1.value.trim();
        const text2 = input2.value.trim();

        if (!text1 || !text2) {
            resultsContainer.innerHTML = '';
            return;
        }
        calculateAndDisplayDelta(text1, text2);
    };

    const debouncedHandler = debounce(handleInput, 300);

    async function calculateAndDisplayDelta(text1, text2) {
        let resultsHtml = '<table><thead><tr><th>Cipher</th><th>Phrase 1 Value</th><th>Phrase 2 Value</th><th>Delta</th><th>Matching Words in DB</th></tr></thead><tbody>';
        
        for (const cipher of Object.keys(CIPHERS)) {
            const val1 = CIPHERS[cipher](text1);
            const val2 = CIPHERS[cipher](text2);
            const delta = Math.abs(val1 - val2);
            
            // Asynchronously fetch matches for the delta value
            const matchesPromise = fetchMatchesForValue(db, delta);

            resultsHtml += `
                <tr data-delta="${delta}" data-cipher="${cipher}">
                    <td>${escapeHTML(cipher)}</td>
                    <td>${val1}</td>
                    <td>${val2}</td>
                    <td class="delta-value">${delta}</td>
                    <td class="matches-cell" id="matches-${cipher}-${delta}">Loading...</td>
                </tr>
            `;
            
            // When matches are found, update the corresponding cell
            matchesPromise.then(matches => {
                const cell = document.getElementById(`matches-${cipher}-${delta}`);
                if (cell) {
                    cell.innerHTML = matches.length > 0 ? matches.map(escapeHTML).join(', ') : '<em>None found</em>';
                }
            });
        }
        
        resultsHtml += '</tbody></table>';
        resultsContainer.innerHTML = resultsHtml;
    }

    async function fetchMatchesForValue(db, value) {
        if (value < 1) return [];
        try {
            const entriesRef = collection(db, "entries");
            const q = query(entriesRef, where("Simple", "==", value), limit(10));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => doc.data().phrase);
        } catch (error) {
            console.error("Error fetching matches:", error);
            return ["Error"];
        }
    }

    input1.addEventListener('input', debouncedHandler);
    input2.addEventListener('input', debouncedHandler);
}


// --- UTILITY FUNCTIONS ---
function debounce(func, delay) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

function escapeHTML(str) {
    const p = document.createElement("p");
    p.appendChild(document.createTextNode(str));
    return p.innerHTML;
}
