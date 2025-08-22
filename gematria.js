// --- Firebase Imports ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, getDocs, limit, orderBy, doc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {
    // --- Firebase Initialization ---
    if (typeof firebaseConfig === 'undefined') { console.error("Firebase config is not loaded."); return; }
    let db;
    try {
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        await signInAnonymously(auth);
        db = getFirestore(app);
    } catch (error) { console.error("Firebase initialization failed:", error); }
    
    const gematriaCollectionRef = collection(db, "gematria-entries");

    // --- DOM ELEMENTS ---
    const gematriaInput = document.getElementById('gematria-input');
    const resultsSummary = document.getElementById('results-summary');
    const breakdownContainer = document.getElementById('breakdown-container');
    const saveButton = document.getElementById('save-button');
    const dbMatchesContainer = document.getElementById('db-matches-container');
    const themeToggle = document.getElementById('theme-toggle');
    const cipherSettings = document.getElementById('cipher-settings');
    const recentList = document.getElementById('recent-list');
    const popularList = document.getElementById('popular-list');

    // --- GEMATRIA TABLES ---
    const CIPHERS = {};
    const ALL_CIPHER_KEYS = ['Jewish', 'English', 'Simple', 'ReverseJewish', 'ReverseEnglish', 'ReverseSimple', 'Latin', 'TradJewish', 'TradEnglish', 'TradSimple'];
    
    function buildGematriaTables() {
        const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const jewishVals = {'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8, 'I': 9, 'J': 600, 'K': 10, 'L': 20, 'M': 30, 'N': 40, 'O': 50, 'P': 60, 'Q': 70, 'R': 80, 'S': 90, 'T': 100, 'U': 200, 'V': 700, 'W': 900, 'X': 300, 'Y': 400, 'Z': 500};
        const revJewishVals = {'A': 500, 'B': 400, 'C': 300, 'D': 900, 'E': 700, 'F': 200, 'G': 100, 'H': 90, 'I': 80, 'J': 70, 'K': 60, 'L': 50, 'M': 40, 'N': 30, 'O': 20, 'P': 10, 'Q': 600, 'R': 9, 'S': 8, 'T': 7, 'U': 6, 'V': 5, 'W': 4, 'X': 3, 'Y': 2, 'Z': 1};
        const latinVals = {'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 80, 'G': 3, 'H': 8, 'I': 10, 'K': 20, 'L': 30, 'M': 40, 'N': 50, 'O': 70, 'P': 80, 'Q': 100, 'R': 200, 'S': 300, 'T': 400, 'V': 6, 'X': 600, 'Y': 10, 'Z': 7};
        const tradJewishVals = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 200, 300, 400, 500, 600, 700, 800];

        ALL_CIPHER_KEYS.forEach(key => CIPHERS[key] = {});

        for (let i = 0; i < alphabet.length; i++) {
            const letter = alphabet[i];
            const position = i + 1;
            const reversePosition = 27 - position;
            
            CIPHERS.Simple[letter] = position;
            CIPHERS.English[letter] = position * 6;
            CIPHERS.Jewish[letter] = jewishVals[letter];
            CIPHERS.ReverseSimple[letter] = reversePosition;
            CIPHERS.ReverseEnglish[letter] = reversePosition * 6;
            CIPHERS.ReverseJewish[letter] = revJewishVals[letter];
            CIPHERS.Latin[letter] = latinVals[letter] || 0;
            CIPHERS.TradSimple[letter] = position;
            CIPHERS.TradEnglish[letter] = position;
            CIPHERS.TradJewish[letter] = tradJewishVals[i];
        }
    }
    buildGematriaTables();

    // --- STATE ---
    let currentValues = null;
    let activeCiphers = ['Jewish', 'English', 'Simple'];

    // --- EVENT LISTENERS ---
    gematriaInput.addEventListener('input', handleInputChange);
    saveButton.addEventListener('click', saveToDatabase);
    themeToggle.addEventListener('click', toggleTheme);
    cipherSettings.addEventListener('change', updateActiveCiphers);

    // --- INITIALIZATION ---
    loadTheme();
    fetchSidebarLists();
    updateActiveCiphers();

    // --- THEME ---
    function toggleTheme() {
        const newTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
        document.body.dataset.theme = newTheme;
        localStorage.setItem('gematriaTheme', newTheme);
        updateThemeIcon(newTheme);
    }
    function loadTheme() {
        const savedTheme = localStorage.getItem('gematriaTheme') || 'dark';
        document.body.dataset.theme = savedTheme;
        updateThemeIcon(savedTheme);
    }
    function updateThemeIcon(theme) {
        themeToggle.innerHTML = theme === 'dark' ? '☀️' : '🌙';
    }

    // --- CIPHER SETTINGS ---
    function updateActiveCiphers() {
        activeCiphers = [...cipherSettings.querySelectorAll('input:checked')].map(el => el.dataset.cipher);
        calculateGematria();
        findMatchesInDB();
    }

    // --- SIDEBAR LISTS ---
    async function fetchSidebarLists() {
        if (!db) return;
        const recentQuery = query(gematriaCollectionRef, orderBy("createdAt", "desc"), limit(5));
        const recentSnapshot = await getDocs(recentQuery);
        recentList.innerHTML = '';
        recentSnapshot.forEach(doc => {
            const li = document.createElement('li');
            li.textContent = doc.data().phrase;
            li.onclick = () => { gematriaInput.value = doc.data().phrase; handleInputChange(); };
            recentList.appendChild(li);
        });
        const popularQuery = query(gematriaCollectionRef, orderBy("searchCount", "desc"), limit(5));
        const popularSnapshot = await getDocs(popularQuery);
        popularList.innerHTML = '';
        popularSnapshot.forEach(doc => {
            const data = doc.data();
            const li = document.createElement('li');
            li.innerHTML = `${data.phrase} <span class="search-count">(${data.searchCount || 1})</span>`;
            li.onclick = () => { gematriaInput.value = data.phrase; handleInputChange(); };
            popularList.appendChild(li);
        });
    }

    // --- DEBOUNCE for database query ---
    let debounceTimer;
    function handleInputChange() {
        calculateGematria();
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            findMatchesInDB();
            updateSearchCount();
        }, 500);
    }

    // --- CALCULATOR & DATABASE FUNCTIONS ---
    function calculateGematria() {
        const rawText = gematriaInput.value;
        const text = rawText.toUpperCase().replace(/[^A-Z\s]/g, '');
        if (!text.replace(/\s/g, '')) {
            resultsSummary.innerHTML = ''; breakdownContainer.innerHTML = ''; dbMatchesContainer.innerHTML = '';
            saveButton.disabled = true; currentValues = null; return;
        }
        const values = {};
        const breakdowns = {};
        ALL_CIPHER_KEYS.forEach(c => { values[c] = 0; breakdowns[c] = ''; });

        for (const char of text) {
            if (CIPHERS.Simple[char]) {
                for (const cipherName in CIPHERS) {
                    values[cipherName] += CIPHERS[cipherName][char];
                    breakdowns[cipherName] += `<div class="letter-value"><span class="letter">${char}</span><span class="value">${CIPHERS[cipherName][char]}</span></div>`;
                }
            } else if (char === ' ') {
                for (const cipherName in CIPHERS) { breakdowns[cipherName] += `<div class="letter-value"><span class="letter">_</span></div>`; }
            }
        }
        currentValues = { phrase: rawText, ...Object.fromEntries(Object.keys(values).map(key => [key.charAt(0).toLowerCase() + key.slice(1) + 'Value', values[key]])) };
        resultsSummary.innerHTML = activeCiphers.map(c => `<div class="result-card"><h3>${c.replace(/([A-Z])/g, ' $1').trim()}</h3><p>${values[c]}</p></div>`).join('');
        breakdownContainer.innerHTML = activeCiphers.map(c => `<div class="breakdown"><div class="breakdown-title">${c.replace(/([A-Z])/g, ' $1').trim()} Breakdown</div><div class="breakdown-letters">${breakdowns[c]}</div></div>`).join('');
        saveButton.disabled = false;
    }

    async function saveToDatabase() {
        if (!currentValues || !db) return;
        saveButton.disabled = true; saveButton.textContent = 'Saving...';
        try {
            const q = query(gematriaCollectionRef, where("phrase", "==", currentValues.phrase));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                saveButton.textContent = 'Already Saved';
            } else {
                await addDoc(gematriaCollectionRef, { ...currentValues, createdAt: new Date(), searchCount: 1 });
                saveButton.textContent = 'Saved!';
                fetchSidebarLists();
            }
        } catch (error) {
            console.error("Error writing document: ", error); saveButton.textContent = 'Error!';
        } finally {
            setTimeout(() => { saveButton.textContent = 'Save'; if (gematriaInput.value) saveButton.disabled = false; }, 2000);
        }
    }
    
    async function updateSearchCount() {
        if (!currentValues || !db) return;
        const q = query(gematriaCollectionRef, where("phrase", "==", currentValues.phrase), limit(1));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const docRef = doc(db, "gematria-entries", querySnapshot.docs[0].id);
            await updateDoc(docRef, { searchCount: increment(1) });
            fetchSidebarLists();
        }
    }

    async function findMatchesInDB() {
        if (!currentValues || !db || activeCiphers.length === 0) {
            dbMatchesContainer.innerHTML = '<p>Enter a phrase and select ciphers to see matches.</p>';
            return;
        }
        dbMatchesContainer.innerHTML = '<p>Searching...</p>';
        let finalHtml = '';
        for (const cipher of activeCiphers) {
            const fieldName = cipher.charAt(0).toLowerCase() + cipher.slice(1) + 'Value';
            const q = query(gematriaCollectionRef, where(fieldName, '==', currentValues[fieldName]), limit(20));
            const querySnapshot = await getDocs(q);
            const matches = [];
            querySnapshot.forEach(doc => {
                const data = doc.data();
                if (data.phrase.toLowerCase() !== currentValues.phrase.toLowerCase()) {
                    matches.push(data);
                }
            });

            if (matches.length > 0) {
                finalHtml += `
                    <div class="match-table-container">
                        <h3>Matches for ${cipher.replace(/([A-Z])/g, ' $1').trim()} (${currentValues[fieldName]})</h3>
                        <table class="match-table">
                            <thead><tr><th>Phrase</th><th>Value</th></tr></thead>
                            <tbody class="match-table-body">
                                ${matches.map(match => `<tr><td>${escapeHTML(match.phrase)}</td><td>${match[fieldName]}</td></tr>`).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            }
        }
        dbMatchesContainer.innerHTML = finalHtml || '<p>No other entries found in the database for the selected ciphers.</p>';
    }
    
    function escapeHTML(str) {
        const p = document.createElement("p");
        p.appendChild(document.createTextNode(str));
        return p.innerHTML;
    }

    calculateGematria();
});
