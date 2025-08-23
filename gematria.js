// --- Firebase Imports ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, getDocs, limit, orderBy, doc, updateDoc, increment, writeBatch } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- GEMATRIA LOGIC (Global) ---
const CIPHERS = {};
const ALL_CIPHER_KEYS = [
    'Jewish', 'English', 'Simple', 
    'ReverseJewish', 'ReverseEnglish', 'ReverseSimple', 
    'Latin', 
    'TradJewish', 'TradEnglish', 'TradSimple',
    'ALW', 'Chaldean' // <-- New Ciphers
];

function buildGematriaTables() {
    const a = 'abcdefghijklmnopqrstuvwxyz'.split('');
    const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    
    // Standard & Simple
    CIPHERS.Simple = {};
    CIPHERS.English = {};
    a.forEach((l, i) => {
        CIPHERS.Simple[l] = i + 1;
        CIPHERS.English[l] = (i + 1) * 6;
    });

    // Jewish & Traditional
    const jewishValues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 200, 300, 400, 500, 600, 700, 800];
    CIPHERS.Jewish = {};
    a.forEach((l, i) => CIPHERS.Jewish[l] = jewishValues[i]);

    CIPHERS.TradSimple = { ...CIPHERS.Simple };
    CIPHERS.TradEnglish = { ...CIPHERS.English };
    CIPHERS.TradJewish = { ...CIPHERS.Jewish };

    // Latin
    const latinOrder = 'abcdefghiklmnopqrstvxyz'.split('');
    const latinValues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 200, 300, 400, 500];
    CIPHERS.Latin = {};
    latinOrder.forEach((l, i) => CIPHERS.Latin[l] = latinValues[i]);
    CIPHERS.Latin['j'] = CIPHERS.Latin['i'];
    CIPHERS.Latin['u'] = CIPHERS.Latin['v'];
    CIPHERS.Latin['w'] = CIPHERS.Latin['v'] * 2;

    // Reverse
    CIPHERS.ReverseSimple = {};
    CIPHERS.ReverseEnglish = {};
    CIPHERS.ReverseJewish = {};
    a.slice().reverse().forEach((l, i) => {
        CIPHERS.ReverseSimple[l] = i + 1;
        CIPHERS.ReverseEnglish[l] = (i + 1) * 6;
        CIPHERS.ReverseJewish[l] = jewishValues[i];
    });

    // --- NEW CIPHERS from Python Script ---
    const ALW_MAP = {'A': 1, 'B': 20, 'C': 13, 'D': 6, 'E': 25, 'F': 18, 'G': 11, 'H': 4, 'I': 23, 'J': 16, 'K': 9, 'L': 2, 'M': 21, 'N': 14, 'O': 7, 'P': 26, 'Q': 19, 'R': 12, 'S': 5, 'T': 24, 'U': 17, 'V': 10, 'W': 3, 'X': 22, 'Y': 15, 'Z': 8};
    const CHALDEAN_MAP = {'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 8, 'G': 3, 'H': 5, 'I': 1, 'J': 1, 'K': 2, 'L': 3, 'M': 4, 'N': 5, 'O': 7, 'P': 8, 'Q': 1, 'R': 2, 'S': 3, 'T': 4, 'U': 6, 'V': 6, 'W': 6, 'X': 5, 'Y': 1, 'Z': 7};
    CIPHERS.ALW = {};
    CIPHERS.Chaldean = {};
    A.forEach(L => {
        CIPHERS.ALW[L] = ALW_MAP[L] || 0;
        CIPHERS.Chaldean[L] = CHALDEAN_MAP[L] || 0;
    });
    
    // Case Insensitivity for all ciphers
    A.forEach(L => {
        const l = L.toLowerCase();
        Object.keys(CIPHERS).forEach(key => {
            if(CIPHERS[key][L]) CIPHERS[key][l] = CIPHERS[key][L];
        });
    });
}
buildGematriaTables();


// --- Main App Logic ---
document.addEventListener('DOMContentLoaded', async () => {
    // Firebase initialization...
    if (typeof firebaseConfig === 'undefined') { console.error("Firebase config is not loaded."); return; }
    let db;
    try {
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        await signInAnonymously(auth);
        db = getFirestore(app);
    } catch (error) { console.error("Firebase initialization failed:", error); return; }

    // Global theme logic...
    const themeToggle = document.getElementById('theme-toggle');
    const loadTheme = () => {
        const theme = localStorage.getItem('theme') || 'dark';
        document.body.setAttribute('data-theme', theme);
        themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
    };
    const toggleTheme = () => {
        const newTheme = document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    };
    themeToggle.addEventListener('click', toggleTheme);
    loadTheme();

    // Page-specific initializers
    if (document.getElementById('gematria-input')) initCalculatorPage(db);
    if (document.getElementById('recent-table')) initStatisticsPage(db);
});


// --- CALCULATOR PAGE LOGIC ---
function initCalculatorPage(db) {
    const gematriaCollectionRef = collection(db, "gematria-entries");

    // DOM Elements
    const gematriaInput = document.getElementById('gematria-input');
    const resultsSummary = document.getElementById('results-summary');
    const breakdownContainer = document.getElementById('breakdown-container');
    const saveButton = document.getElementById('save-button');
    const dbMatchesContainer = document.getElementById('db-matches-container');
    const cipherSettings = document.getElementById('cipher-settings');
    const bulkUploadInput = document.getElementById('bulk-upload-input');
    const bulkUploadButton = document.getElementById('bulk-upload-button');
    const bulkUploadProgress = document.getElementById('bulk-upload-progress');
    const adminPanel = document.querySelector('.admin-collapsible');

    // State
    let currentValues = null;
    let activeCiphers = ['Jewish', 'English', 'Simple', 'Chaldean'];
    const MAX_ACTIVE_CIPHERS = 4;

    // --- CORE INPUT HANDLING ---
    const handleInputChange = () => {
        const input = gematriaInput.value.trim();
        clearResults();
        if (!input) return;

        const isNumberSearch = /^\d+$/.test(input);

        if (isNumberSearch) {
            findMatchesByNumber(parseInt(input, 10));
            saveButton.disabled = true; // Can't save a number
        } else {
            calculateGematriaForText(input);
            saveButton.disabled = false;
        }
    };
    
    const debouncedHandler = debounce(handleInputChange, 300);

    function clearResults() {
        resultsSummary.innerHTML = '';
        breakdownContainer.innerHTML = '';
        dbMatchesContainer.innerHTML = '';
        saveButton.disabled = true;
        currentValues = null;
    }

    // --- TEXT CALCULATION LOGIC ---
    function calculateGematriaForText(text) {
        currentValues = {};
        for (const cipher of ALL_CIPHER_KEYS) {
            let total = 0;
            const breakdown = [];
            for (const char of text) {
                const value = CIPHERS[cipher][char] || 0;
                if (value > 0) breakdown.push({ letter: char, value });
                total += value;
            }
            currentValues[cipher] = total;

            if (activeCiphers.includes(cipher)) {
                displayResultCard(cipher, total);
                displayBreakdown(cipher, breakdown);
            }
        }
        findMatchesByText();
    }

    // --- DATABASE SEARCH LOGIC ---
    async function findMatchesByText() {
        if (!currentValues) return;
        for (const cipher of activeCiphers) {
            const value = currentValues[cipher];
            if (value === 0) continue;
            const q = query(gematriaCollectionRef, where(cipher, "==", value), limit(50));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                displayMatchTable(cipher, value, querySnapshot.docs);
                // Increment search count for the original phrase
                const originalPhrase = gematriaInput.value.trim();
                querySnapshot.docs.forEach(doc => {
                    if (doc.data().phrase.toLowerCase() === originalPhrase.toLowerCase()) {
                        updateDoc(doc.ref, { searchCount: increment(1) });
                    }
                });
            }
        }
    }

    async function findMatchesByNumber(number) {
        for (const cipher of activeCiphers) {
            const q = query(gematriaCollectionRef, where(cipher, "==", number), limit(50));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                displayMatchTable(cipher, number, querySnapshot.docs);
            }
        }
    }

    // --- UI DISPLAY FUNCTIONS ---
    function displayResultCard(cipher, value) {
        const card = document.createElement('div');
        card.className = 'result-card';
        card.innerHTML = `<h3>${escapeHTML(cipher)}</h3><p>${value}</p>`;
        resultsSummary.appendChild(card);
    }

    function displayBreakdown(cipher, breakdown) {
        const container = document.createElement('div');
        container.className = 'breakdown';
        let lettersHtml = breakdown.map(item => `
            <div class="letter-value">
                <span class="letter">${escapeHTML(item.letter)}</span>
                <span class="value">${item.value}</span>
            </div>`).join('');
        container.innerHTML = `<div class="breakdown-title">${escapeHTML(cipher)} Breakdown</div><div class="breakdown-letters">${lettersHtml}</div>`;
        breakdownContainer.appendChild(container);
    }

    function displayMatchTable(cipher, value, docs) {
        const container = document.createElement('div');
        container.className = 'match-table-container';
        let rows = docs.map(doc => {
            const data = doc.data();
            return `<tr><td>${escapeHTML(data.phrase)}</td>${activeCiphers.map(c => `<td>${data[c] || 0}</td>`).join('')}</tr>`;
        }).join('');
        container.innerHTML = `
            <h3>${escapeHTML(cipher)} = ${value}</h3>
            <div class="table-container"><table class="match-table">
                <thead><tr><th>Phrase</th>${activeCiphers.map(c => `<th>${escapeHTML(c)}</th>`).join('')}</tr></thead>
                <tbody class="match-table-body">${rows}</tbody>
            </table></div>`;
        dbMatchesContainer.appendChild(container);
    }
    
    // --- SETTINGS & SAVE ---
    function updateActiveCiphers() {
        const checkboxes = cipherSettings.querySelectorAll('input[type="checkbox"]');
        activeCiphers = Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.dataset.cipher);
        if (activeCiphers.length > MAX_ACTIVE_CIPHERS) {
            const lastChecked = activeCiphers.pop();
            checkboxes.forEach(cb => { if(cb.dataset.cipher === lastChecked) cb.checked = false; });
            alert(`You can only select up to ${MAX_ACTIVE_CIPHERS} ciphers.`);
        }
        checkboxes.forEach(cb => {
            const label = cb.parentElement;
            cb.disabled = activeCiphers.length >= MAX_ACTIVE_CIPHERS && !cb.checked;
            label.classList.toggle('disabled', cb.disabled);
        });
        handleInputChange(); // Recalculate/research when ciphers change
    }

    async function saveToDatabase() {
        const phrase = gematriaInput.value.trim();
        if (!phrase || !currentValues) return;
        try {
            await addDoc(gematriaCollectionRef, { phrase, createdAt: new Date(), searchCount: 0, ...currentValues });
            saveButton.textContent = 'Saved!';
            setTimeout(() => { saveButton.textContent = 'Save'; }, 2000);
            findMatchesByText(); // Refresh matches
        } catch (error) { console.error("Error adding document: ", error); }
    }
    
    // Other functions (bulk upload, admin) remain the same...
    // ...
    
    // Event Listeners
    gematriaInput.addEventListener('input', debouncedHandler);
    saveButton.addEventListener('click', saveToDatabase);
    cipherSettings.addEventListener('change', updateActiveCiphers);
    // ... other listeners

    // Initialization
    updateActiveCiphers();
}


// --- STATISTICS PAGE LOGIC ---
function initStatisticsPage(db) {
    const gematriaCollectionRef = collection(db, "gematria-entries");
    const recentTableBody = document.querySelector('#recent-table tbody');
    const recentTableHead = document.querySelector('#recent-table thead');
    const popularTableBody = document.querySelector('#popular-table tbody');
    const popularTableHead = document.querySelector('#popular-table thead');

    async function fetchSidebarLists() {
        const activeCiphers = ['Jewish', 'English', 'Simple'];
        const recentQuery = query(gematriaCollectionRef, orderBy("createdAt", "desc"), limit(10));
        const popularQuery = query(gematriaCollectionRef, orderBy("searchCount", "desc"), limit(10));
        const [recentSnapshot, popularSnapshot] = await Promise.all([getDocs(recentQuery), getDocs(popularQuery)]);
        populateTable(recentTableHead, recentTableBody, recentSnapshot.docs, activeCiphers);
        populateTable(popularTableHead, popularTableBody, popularSnapshot.docs, activeCiphers);
    }

    function populateTable(thead, tbody, docs, ciphers) {
        tbody.innerHTML = '';
        thead.innerHTML = `<tr><th class="phrase-col">Phrase</th>${ciphers.map(c => `<th class="value-col">${escapeHTML(c.substring(0,3))}</th>`).join('')}</tr>`;
        docs.forEach(doc => {
            const data = doc.data();
            const row = document.createElement('tr');
            row.innerHTML = `<td class="phrase-col" title="${escapeHTML(data.phrase)}">${escapeHTML(data.phrase)}</td>${ciphers.map(c => `<td class="value-col">${data[c] || 0}</td>`).join('')}`;
            tbody.appendChild(row);
        });
    }
    fetchSidebarLists();
}

// --- UTILITY FUNCTIONS ---
function debounce(func, delay) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

function escapeHTML(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[&<>"']/g, match => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'})[match]);
}
