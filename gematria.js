// --- Firebase Imports ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, getDocs, limit, orderBy, doc, updateDoc, increment, writeBatch } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- GEMATRIA LOGIC (Global) ---
const CIPHERS = {};
const ALL_CIPHER_KEYS = ['Jewish', 'English', 'Simple', 'ReverseJewish', 'ReverseEnglish', 'ReverseSimple', 'Latin', 'TradJewish', 'TradEnglish', 'TradSimple'];

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
    
    // Case Insensitivity
    A.forEach(L => {
        const l = L.toLowerCase();
        Object.keys(CIPHERS).forEach(key => {
            if(CIPHERS[key][l]) CIPHERS[key][L] = CIPHERS[key][l];
        });
    });
}
buildGematriaTables();


// --- Main App Logic ---
document.addEventListener('DOMContentLoaded', async () => {
    // --- Firebase Initialization ---
    if (typeof firebaseConfig === 'undefined') {
        console.error("Firebase config is not loaded.");
        return;
    }
    let db;
    try {
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        await signInAnonymously(auth);
        db = getFirestore(app);
    } catch (error) {
        console.error("Firebase initialization failed:", error);
        return;
    }

    // --- Global Elements & Logic ---
    const themeToggle = document.getElementById('theme-toggle');
    
    function loadTheme() {
        const theme = localStorage.getItem('theme') || 'dark';
        document.body.setAttribute('data-theme', theme);
        themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
    }

    function toggleTheme() {
        const currentTheme = document.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    }

    themeToggle.addEventListener('click', toggleTheme);
    loadTheme();

    // --- Page-Specific Initializers ---
    if (document.getElementById('gematria-input')) {
        initCalculatorPage(db);
    }
    if (document.getElementById('recent-table')) {
        initStatisticsPage(db);
    }
});


// --- CALCULATOR PAGE LOGIC ---
function initCalculatorPage(db) {
    const gematriaCollectionRef = collection(db, "gematria-entries");

    // --- DOM ELEMENTS ---
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

    // --- STATE ---
    let currentValues = null;
    let activeCiphers = ['Jewish', 'English', 'Simple'];
    const MAX_ACTIVE_CIPHERS = 3;

    // --- CORE FUNCTIONS ---
    const calculateGematria = () => {
        const input = gematriaInput.value;
        if (!input) {
            clearResults();
            return;
        }

        currentValues = {};
        resultsSummary.innerHTML = '';
        breakdownContainer.innerHTML = '';

        for (const cipher of ALL_CIPHER_KEYS) {
            let total = 0;
            const breakdown = [];
            for (const char of input) {
                const value = CIPHERS[cipher][char] || 0;
                if (value > 0) { // Only include letters with values
                    breakdown.push({ letter: char, value });
                }
                total += value;
            }
            currentValues[cipher] = total;

            if (activeCiphers.includes(cipher)) {
                displayResultCard(cipher, total);
                displayBreakdown(cipher, breakdown);
            }
        }
        
        saveButton.disabled = !input.trim();
        findDbMatches();
    };

    const debouncedCalculate = debounce(calculateGematria, 300);

    function clearResults() {
        resultsSummary.innerHTML = '';
        breakdownContainer.innerHTML = '';
        dbMatchesContainer.innerHTML = '';
        saveButton.disabled = true;
        currentValues = null;
    }

    function displayResultCard(cipher, value) {
        const card = document.createElement('div');
        card.className = 'result-card';
        card.innerHTML = `
            <h3>${escapeHTML(cipher)}</h3>
            <p>${value}</p>
        `;
        resultsSummary.appendChild(card);
    }

    function displayBreakdown(cipher, breakdown) {
        const container = document.createElement('div');
        container.className = 'breakdown';
        let lettersHtml = breakdown.map(item => `
            <div class="letter-value">
                <span class="letter">${escapeHTML(item.letter)}</span>
                <span class="value">${item.value}</span>
            </div>
        `).join('');

        container.innerHTML = `
            <div class="breakdown-title">${escapeHTML(cipher)} Breakdown</div>
            <div class="breakdown-letters">${lettersHtml}</div>
        `;
        breakdownContainer.appendChild(container);
    }

    async function saveToDatabase() {
        const phrase = gematriaInput.value.trim();
        if (!phrase || !currentValues) return;

        try {
            const docData = {
                phrase: phrase,
                createdAt: new Date(),
                searchCount: 0,
                ...currentValues
            };
            await addDoc(gematriaCollectionRef, docData);
            // Simple feedback
            saveButton.textContent = 'Saved!';
            setTimeout(() => { saveButton.textContent = 'Save'; }, 2000);
            findDbMatches(); // Refresh matches
        } catch (error) {
            console.error("Error adding document: ", error);
        }
    }

    async function findDbMatches() {
        dbMatchesContainer.innerHTML = '';
        if (!currentValues) return;

        for (const cipher of activeCiphers) {
            const value = currentValues[cipher];
            if (value === 0) continue;

            const q = query(gematriaCollectionRef, where(cipher, "==", value), limit(50));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                displayMatchTable(cipher, value, querySnapshot.docs);
                
                // Increment search count for the original phrase if it exists
                const originalPhrase = gematriaInput.value.trim();
                querySnapshot.docs.forEach(doc => {
                    if (doc.data().phrase.toLowerCase() === originalPhrase.toLowerCase()) {
                        updateDoc(doc.ref, { searchCount: increment(1) });
                    }
                });
            }
        }
    }

    function displayMatchTable(cipher, value, docs) {
        const container = document.createElement('div');
        container.className = 'match-table-container';
        
        let rows = '';
        docs.forEach(doc => {
            const data = doc.data();
            rows += `
                <tr>
                    <td>${escapeHTML(data.phrase)}</td>
                    ${activeCiphers.map(c => `<td>${data[c] || 0}</td>`).join('')}
                </tr>
            `;
        });

        container.innerHTML = `
            <h3>${escapeHTML(cipher)} = ${value}</h3>
            <div class="table-container">
                <table class="match-table">
                    <thead>
                        <tr>
                            <th>Phrase</th>
                            ${activeCiphers.map(c => `<th>${escapeHTML(c)}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody class="match-table-body">${rows}</tbody>
                </table>
            </div>
        `;
        dbMatchesContainer.appendChild(container);
    }
    
    function updateActiveCiphers() {
        const checkboxes = cipherSettings.querySelectorAll('input[type="checkbox"]');
        activeCiphers = Array.from(checkboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.dataset.cipher);

        if (activeCiphers.length > MAX_ACTIVE_CIPHERS) {
            const lastChecked = activeCiphers[activeCiphers.length - 1];
            activeCiphers.pop();
            checkboxes.forEach(cb => {
                if(cb.dataset.cipher === lastChecked) cb.checked = false;
            });
            alert(`You can only select up to ${MAX_ACTIVE_CIPHERS} ciphers.`);
        }
        
        checkboxes.forEach(cb => {
            const label = cb.parentElement;
            if (activeCiphers.length >= MAX_ACTIVE_CIPHERS && !cb.checked) {
                label.classList.add('disabled');
                cb.disabled = true;
            } else {
                label.classList.remove('disabled');
                cb.disabled = false;
            }
        });

        calculateGematria();
    }

    async function handleBulkUpload() {
        const file = bulkUploadInput.files[0];
        if (!file) {
            alert("Please select a file.");
            return;
        }

        const text = await file.text();
        const phrases = text.split('\n').map(p => p.trim()).filter(Boolean);
        const batchSize = 100;
        bulkUploadProgress.textContent = `Processing ${phrases.length} phrases...`;

        for (let i = 0; i < phrases.length; i += batchSize) {
            const batch = writeBatch(db);
            const chunk = phrases.slice(i, i + batchSize);

            for (const phrase of chunk) {
                const values = {};
                for (const cipher of ALL_CIPHER_KEYS) {
                    values[cipher] = phrase.split('').reduce((sum, char) => sum + (CIPHERS[cipher][char] || 0), 0);
                }
                const docData = { phrase, createdAt: new Date(), searchCount: 0, ...values };
                const newDocRef = doc(gematriaCollectionRef);
                batch.set(newDocRef, docData);
            }

            await batch.commit();
            bulkUploadProgress.textContent = `Uploaded ${i + chunk.length} / ${phrases.length} phrases.`;
        }
        bulkUploadProgress.textContent = 'Bulk upload complete!';
    }
    
    // --- EVENT LISTENERS ---
    gematriaInput.addEventListener('input', debouncedCalculate);
    saveButton.addEventListener('click', saveToDatabase);
    cipherSettings.addEventListener('change', updateActiveCiphers);
    bulkUploadButton.addEventListener('click', handleBulkUpload);
    adminPanel.addEventListener('toggle', handleAdminToggle);

    // --- Admin Security ---
    async function sha256(message) {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    function handleAdminToggle(event) {
        if (event.target.open) {
            if (sessionStorage.getItem('isAdmin') !== 'true') {
                event.preventDefault(); // Prevent opening
                const password = prompt("Enter Admin Password:");
                if (password) {
                    sha256(password).then(hashedInput => {
                        const storedHash = "2c9388231319582ae82b2811289c0324883d2919c9155c82d08808928a38520c";
                        if (hashedInput === storedHash) {
                            sessionStorage.setItem('isAdmin', 'true');
                            event.target.open = true; // Now open it
                        } else {
                            alert("Incorrect password.");
                        }
                    });
                }
            }
        }
    }

    // --- INITIALIZATION ---
    updateActiveCiphers();
    calculateGematria();
}


// --- STATISTICS PAGE LOGIC ---
function initStatisticsPage(db) {
    const gematriaCollectionRef = collection(db, "gematria-entries");

    const recentTableBody = document.querySelector('#recent-table tbody');
    const recentTableHead = document.querySelector('#recent-table thead');
    const popularTableBody = document.querySelector('#popular-table tbody');
    const popularTableHead = document.querySelector('#popular-table thead');

    async function fetchSidebarLists() {
        const activeCiphers = ['Jewish', 'English', 'Simple']; // Default for stats page

        // Fetch Recently Added
        const recentQuery = query(gematriaCollectionRef, orderBy("createdAt", "desc"), limit(10));
        const recentSnapshot = await getDocs(recentQuery);
        populateTable(recentTableHead, recentTableBody, recentSnapshot.docs, activeCiphers);

        // Fetch Most Searched
        const popularQuery = query(gematriaCollectionRef, orderBy("searchCount", "desc"), limit(10));
        const popularSnapshot = await getDocs(popularQuery);
        populateTable(popularTableHead, popularTableBody, popularSnapshot.docs, activeCiphers);
    }

    function populateTable(thead, tbody, docs, ciphers) {
        tbody.innerHTML = '';
        thead.innerHTML = `<tr>
            <th class="phrase-col">Phrase</th>
            ${ciphers.map(c => `<th class="value-col">${escapeHTML(c.substring(0,3))}</th>`).join('')}
        </tr>`;
        
        docs.forEach(doc => {
            const data = doc.data();
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="phrase-col" title="${escapeHTML(data.phrase)}">${escapeHTML(data.phrase)}</td>
                ${ciphers.map(c => `<td class="value-col">${data[c] || 0}</td>`).join('')}
            `;
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
    const p = document.createElement("p");
    p.appendChild(document.createTextNode(str));
    return p.innerHTML;
}
