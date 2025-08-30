// --- Firebase Imports ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, getDocs, limit, writeBatch, or, doc, serverTimestamp, runTransaction } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- GLOBAL STATE & CONSTANTS ---
const PHI = 1.618033988749895;
const GOLDEN_ANGLE = 137.50776405;
let CIPHERS = {}; // Will be populated by buildGematriaCiphers
const ENTRIES_PER_PAGE = 25;
let currentPages = {}; // state for pagination

// --- DOM ELEMENTS ---
const gematriaInput = document.getElementById('gematria-input');
const resultsSummary = document.getElementById('results-summary');
const breakdownContainer = document.getElementById('breakdown-container');
const dbMatchesContainer = document.getElementById('db-matches-container');
const comparisonContainer = document.getElementById('comparison-container');
const cipherSettings = document.getElementById('cipher-settings');
const saveButton = document.getElementById('save-button');
const themeToggleButton = document.getElementById('theme-toggle');
const fileInput = document.getElementById('file-input');
const uploadButton = document.getElementById('upload-button');

// --- UTILITY: NUMBER ANALYSIS ---
function recursiveDigitSum(n) {
    let val = Math.abs(Math.round(n));
    while (val > 9) {
        val = String(val).split('').reduce((sum, digit) => sum + parseInt(digit, 10), 0);
    }
    return val;
}
function isPrime(n) {
    if (n <= 1) return false; if (n <= 3) return true;
    if (n % 2 === 0 || n % 3 === 0) return false;
    for (let i = 5; i * i <= n; i = i + 6) { if (n % i === 0 || n % (i + 2) === 0) return false; }
    return true;
}

// --- GEMATRIA CIPHER DEFINITIONS (EXPANDED) ---
function buildGematriaCiphers() {
    const a = 'abcdefghijklmnopqrstuvwxyz';
    const simpleMap = {};
    a.split('').forEach((l, i) => { simpleMap[l] = i + 1; });

    const jewishValues = { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8, i: 9, k: 10, l: 20, m: 30, n: 40, o: 50, p: 60, q: 70, r: 80, s: 90, t: 100, u: 200, x: 300, y: 400, z: 500, j: 600, v: 700, w: 900 };
    
    const qwertyMap = {};
    'qwertyuiopasdfghjklzxcvbnm'.split('').forEach((l, i) => { qwertyMap[l] = i + 1; });
    const leftHand = 'qwertasdfgzxcvb'.split('');
    const rightHand = 'yuiophjklnm'.split('');
    
    const freqMap = { e: 26, t: 25, a: 24, o: 23, i: 22, n: 21, s: 20, h: 19, r: 18, d: 17, l: 16, c: 15, u: 14, m: 13, w: 12, f: 11, g: 10, y: 9, p: 8, b: 7, v: 6, k: 5, j: 4, x: 3, q: 2, z: 1 };

    const ciphers = {
        "English Ordinal": (text) => text.toLowerCase().replace(/[^a-z]/g, '').split('').reduce((sum, char) => sum + (simpleMap[char] || 0), 0),
        "Reverse Ordinal": (text) => text.toLowerCase().replace(/[^a-z]/g, '').split('').reduce((sum, char) => sum + (27 - (simpleMap[char] || 0)), 0),
        "Full Reduction": (text) => text.toLowerCase().replace(/[^a-z]/g, '').split('').reduce((sum, char) => sum + (((simpleMap[char] - 1) % 9) + 1 || 0), 0),
        "Reverse Full Reduction": (text) => text.toLowerCase().replace(/[^a-z]/g, '').split('').reduce((sum, char) => sum + (9 - (((simpleMap[char] - 1) % 9) || 9) + 1 || 0), 0),
        "Jewish Gematria": (text) => text.toLowerCase().replace(/[^a-z]/g, '').split('').reduce((sum, char) => sum + (jewishValues[char] || 0), 0),
        "Sumerian": (text) => text.toLowerCase().replace(/[^a-z]/g, '').split('').reduce((sum, char) => sum + ((simpleMap[char] || 0) * 6), 0),
        "Chaldean": (text) => {
            const chaldeanMap = { a: 1, i: 1, j: 1, q: 1, y: 1, b: 2, k: 2, r: 2, c: 3, g: 3, l: 3, s: 3, d: 4, m: 4, t: 4, e: 5, h: 5, n: 5, x: 5, u: 6, v: 6, w: 6, o: 7, z: 7, f: 8, p: 8 };
            return text.toLowerCase().replace(/[^a-z]/g, '').split('').reduce((sum, char) => sum + (chaldeanMap[char] || 0), 0);
        },
        "Phone Keypad": (text) => {
            const keypadMap = { a: 2, b: 2, c: 2, d: 3, e: 3, f: 3, g: 4, h: 4, i: 4, j: 5, k: 5, l: 5, m: 6, n: 6, o: 6, p: 7, q: 7, r: 7, s: 7, t: 8, u: 8, v: 8, w: 9, x: 9, y: 9, z: 9 };
            return text.toLowerCase().replace(/[^a-z]/g, '').split('').reduce((sum, char) => sum + (keypadMap[char] || 0), 0);
        },
        "ASCII Sum": (text) => text.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0),
        "Qwerty Gematria": (text) => text.toLowerCase().replace(/[^a-z]/g, '').split('').reduce((sum, char) => sum + (qwertyMap[char] || 0), 0),
        "Left-Hand Qwerty": (text) => text.toLowerCase().replace(/[^a-z]/g, '').split('').filter(c => leftHand.includes(c)).reduce((sum, char) => sum + (qwertyMap[char] || 0), 0),
        "Right-Hand Qwerty": (text) => text.toLowerCase().replace(/[^a-z]/g, '').split('').filter(c => rightHand.includes(c)).reduce((sum, char) => sum + (qwertyMap[char] || 0), 0),
        "Binary Sum": (text) => text.split('').map(c => c.charCodeAt(0).toString(2)).join('').split('').reduce((sum, bit) => sum + (bit === '1' ? 1 : 0), 0),
        "Frequent Letters": (text) => text.toLowerCase().replace(/[^a-z]/g, '').split('').reduce((sum, char) => sum + (freqMap[char] || 0), 0),
        "Spiral Gematria": (text) => {
            const cleaned = text.toLowerCase().replace(/[^a-z]/g, '');
            return Math.round(cleaned.split('').reduce((sum, char, i) => sum + (simpleMap[char] || 0) * Math.cos(GOLDEN_ANGLE * (i + 1)), 0));
        },
        "Golden Ratio Position": (text) => {
            const cleaned = text.toLowerCase().replace(/[^a-z]/g, '');
            return Math.round(cleaned.split('').reduce((sum, char, i) => sum + (simpleMap[char] || 0) * Math.pow(PHI, i), 0));
        },
         "SGRR Signal Signature": (text) => {
            const charValue = (char) => {
                let val = recursiveDigitSum(char.charCodeAt(0));
                return val === 9 ? 9 : val % 3 === 0 ? 3 : 6;
            };
            const wordSignal = (word) => {
                let val = recursiveDigitSum(word.split('').reduce((s, c) => s + charValue(c), 0));
                 return val === 9 ? 9 : val % 3 === 0 ? 3 : 6;
            };
            const fib = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89];
            const words = text.split(/\s+/).filter(Boolean);
            const totalSignal = words.reduce((sum, word, i) => sum + wordSignal(word) * (fib[i] || 144), 0);
            return totalSignal / PHI;
        },
    };
    
    // Add Base-N ciphers
    for (let base = 2; base <= 12; base++) {
        ciphers[`Base-${base} Sum`] = (text) => {
            const simple = ciphers["English Ordinal"](text);
            return simple.toString(base).split('').reduce((s, d) => s + parseInt(d, base), 0);
        };
    }

    // Dynamically create Reverse ciphers
    const reverseCiphers = {};
    for (const key in ciphers) {
        reverseCiphers[`Reverse ${key}`] = (text) => ciphers[key](text.split('').reverse().join(''));
    }
    
    return { ...ciphers, ...reverseCiphers };
}


// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async () => {
    CIPHERS = buildGematriaCiphers();
    
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);
    await signInAnonymously(auth);

    setupTheme();
    populateCipherSettings();

    const debouncedHandler = debounce(() => handleInputChange(db), 300);
    gematriaInput.addEventListener('input', debouncedHandler);
    cipherSettings.addEventListener('change', () => handleInputChange(db));
    dbMatchesContainer.addEventListener('click', (e) => handleMatchClick(e, db));
    saveButton.addEventListener('click', () => saveToDatabase(db));
    uploadButton.addEventListener('click', () => processAndUploadFile(db));
});


// --- CORE FUNCTIONS ---

function calculateGematria(text) {
    const values = {};
    const breakdown = {};
    const cleanedText = text.toLowerCase().replace(/[^a-z]/g, '');

    for (const name in CIPHERS) {
        // This is a simplified breakdown for display, not used by the main ciphers
        if (name === "English Ordinal" || name === "Reverse Ordinal" || name === "Full Reduction" || name === "Jewish Gematria") {
             values[name] = CIPHERS[name](text);
             breakdown[name] = [];
             for(const char of cleanedText) {
                 const tempCipher = { [name]: CIPHERS[name] };
                 breakdown[name].push({ char, value: tempCipher[name](char) });
             }
        } else {
            values[name] = CIPHERS[name](text);
        }
    }
    return { values, breakdown };
}

async function handleInputChange(db) {
    const inputText = gematriaInput.value.trim();
    comparisonContainer.innerHTML = ''; // Clear comparison chart on new input
    saveButton.disabled = !inputText;

    if (!inputText) {
        resultsSummary.innerHTML = '';
        breakdownContainer.innerHTML = '';
        dbMatchesContainer.innerHTML = '';
        return;
    }

    const { values, breakdown } = calculateGematria(inputText);
    displaySummary(values);
    displayDetailedBreakdown(breakdown);
    await findAndDisplayMatches(db, values);
}

async function findAndDisplayMatches(db, values) {
    dbMatchesContainer.innerHTML = '';
    const activeCiphers = getActiveCiphers();
    if (activeCiphers.length === 0) return;

    // Firebase 'or' query supports up to 30 equality clauses.
    const limitedCiphers = activeCiphers.slice(0, 30);
    const queries = limitedCiphers.map(cipher => where(`values.${cipher}`, "==", values[cipher]));
    
    if (queries.length === 0) return;

    const mainQuery = query(collection(db, "phrases"), or(...queries));
    const querySnapshot = await getDocs(mainQuery);
    
    const matchesByCipher = {};
    activeCiphers.forEach(cipher => { matchesByCipher[cipher] = []; });

    querySnapshot.forEach(doc => {
        const data = doc.data();
        activeCiphers.forEach(cipher => {
            if (data.values[cipher] === values[cipher]) {
                if (data.phrase.toLowerCase() !== gematriaInput.value.trim().toLowerCase()) {
                    matchesByCipher[cipher].push({
                        phrase: data.phrase,
                        searchCount: data.searchCount || 0
                    });
                }
            }
        });
    });

    for (const cipher of activeCiphers) {
        currentPages[cipher] = 1;
        matchesByCipher[cipher].sort((a, b) => b.searchCount - a.searchCount);
        displayPaginatedMatches(cipher, matchesByCipher[cipher], values[cipher]);
    }
}

// --- DISPLAY FUNCTIONS ---

function displaySummary(values) {
    let html = '';
    const activeCiphers = getActiveCiphers();
    for (const cipher of activeCiphers) {
        if (values[cipher] !== undefined) {
             html += `<div class="summary-card"><strong>${cipher}:</strong> ${values[cipher]}</div>`;
        }
    }
    resultsSummary.innerHTML = html;
}

function displayDetailedBreakdown(breakdown) {
    let html = '<h3>Breakdown</h3>';
    const displayableCiphers = ["English Ordinal", "Reverse Ordinal", "Full Reduction", "Jewish Gematria"];
    for (const cipher of displayableCiphers) {
         if (breakdown[cipher] && breakdown[cipher].length > 0) {
            html += `<div class="breakdown-cipher-card"><h4>${cipher}</h4><div class="breakdown-calculation">`;
            breakdown[cipher].forEach((b, index) => {
                html += `<div class="char-value"><span class="char">${b.char.toUpperCase()}</span><span class="value">${b.value}</span></div>`;
                if (index < breakdown[cipher].length - 1) {
                    html += `<div class="operator">+</div>`;
                }
            });
            const total = breakdown[cipher].reduce((sum, b) => sum + b.value, 0);
            html += `<div class="operator">=</div><div class="total">${total}</div></div></div>`;
        }
    }
    breakdownContainer.innerHTML = html;
}

function displayPaginatedMatches(cipher, matches, value) {
    const containerId = `matches-${cipher.replace(/\s+/g, '-')}`;
    let container = document.getElementById(containerId);
    if (!container) {
        container = document.createElement('div');
        container.id = containerId;
        container.className = 'match-table-container';
        dbMatchesContainer.appendChild(container);
    }
    
    const totalPages = Math.ceil(matches.length / ENTRIES_PER_PAGE);
    const currentPage = currentPages[cipher] || 1;
    const start = (currentPage - 1) * ENTRIES_PER_PAGE;
    const end = start + ENTRIES_PER_PAGE;
    const paginatedMatches = matches.slice(start, end);

    let tableHtml = `
        <details open>
            <summary>${cipher} (${value}) - ${matches.length} matches found</summary>
            <table class="match-table">
            <thead><tr><th>Phrase</th><th>Searches</th></tr></thead><tbody>`;
    if (paginatedMatches.length > 0) {
        paginatedMatches.forEach(match => {
            tableHtml += `<tr data-phrase="${escapeHTML(match.phrase)}"><td>${escapeHTML(match.phrase)}</td><td>${match.searchCount}</td></tr>`;
        });
    } else {
        tableHtml += '<tr><td colspan="2">No other phrases with this value found in the database.</td></tr>';
    }
    tableHtml += '</tbody></table>';
    
    if (totalPages > 1) {
        tableHtml += `
            <div class="pagination-controls">
                <button data-cipher="${cipher}" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}>Previous</button>
                <span class="pagination-info">Page ${currentPage} of ${totalPages}</span>
                <button data-cipher="${cipher}" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''}>Next</button>
            </div>`;
    }
    tableHtml += '</details>';
    container.innerHTML = tableHtml;

    container.querySelectorAll('.pagination-controls button').forEach(button => {
        button.addEventListener('click', () => {
            currentPages[cipher] = parseInt(button.dataset.page);
            displayPaginatedMatches(cipher, matches, value);
        });
    });
}

function displayComparisonChart(original, resonant) {
    const chartCiphers = ["English Ordinal", "Jewish Gematria", "Full Reduction"];
    let html = `<h3 class="comparison-header">Comparison: "${original.phrase}" vs "${resonant.phrase}"</h3>`;
    html += '<table class="comparison-table"><tr><th>Cipher</th>';
    
    const originalBreakdownSimple = calculateGematria(original.phrase).breakdown["English Ordinal"];
    const resonantBreakdownSimple = calculateGematria(resonant.phrase).breakdown["English Ordinal"];

    originalBreakdownSimple.forEach(b => html += `<th>${escapeHTML(b.char)}</th>`);
    html += `<th class="phrase-header">${escapeHTML(original.phrase)}</th>`;
    resonantBreakdownSimple.forEach(b => html += `<th>${escapeHTML(b.char)}</th>`);
    html += `<th class="phrase-header">${escapeHTML(resonant.phrase)}</th></tr>`;

    chartCiphers.forEach(cipher => {
        if (!CIPHERS[cipher]) return;
        const originalData = calculateGematria(original.phrase);
        const resonantData = calculateGematria(resonant.phrase);
        
        html += `<tr><td class="cipher-name-col">${cipher}</td>`;
        if (originalData.breakdown[cipher]) originalData.breakdown[cipher].forEach(b => html += `<td>${b.value}</td>`);
        html += `<td><strong>${originalData.values[cipher]}</strong></td>`;
        if (resonantData.breakdown[cipher]) resonantData.breakdown[cipher].forEach(b => html += `<td>${b.value}</td>`);
        html += `<td><strong>${resonantData.values[cipher]}</strong></td></tr>`;
    });

    html += '</table>';
    comparisonContainer.innerHTML = html;
    comparisonContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}


// --- EVENT HANDLERS & HELPERS ---
async function handleMatchClick(event, db) {
    const row = event.target.closest('tr[data-phrase]');
    if (!row) return;

    const resonantPhrase = row.dataset.phrase;
    
    gematriaInput.value = resonantPhrase;
    await handleInputChange(db);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const q = query(collection(db, "phrases"), where("phrase", "==", resonantPhrase), limit(1));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
        const docRef = snapshot.docs[0].ref;
        try {
            await runTransaction(db, async (transaction) => {
                const sfDoc = await transaction.get(docRef);
                if (!sfDoc.exists()) { throw "Document does not exist!"; }
                const newCount = (sfDoc.data().searchCount || 0) + 1;
                transaction.update(docRef, { searchCount: newCount });
            });
        } catch (e) { console.error("Search count transaction failed: ", e); }
    }
}


function setupTheme() {
    const savedTheme = localStorage.getItem('gematria-theme') || 'dark';
    document.body.setAttribute('data-theme', savedTheme);
    if (themeToggleButton) {
        themeToggleButton.addEventListener('click', () => {
            let currentTheme = document.body.getAttribute('data-theme');
            let newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.body.setAttribute('data-theme', newTheme);
            localStorage.setItem('gematria-theme', newTheme);
        });
    }
}

function populateCipherSettings() {
    let html = '';
    const sortedCiphers = Object.keys(CIPHERS).sort();
    for (const name of sortedCiphers) {
        const isChecked = ["English Ordinal", "Reverse Ordinal", "Full Reduction", "Jewish Gematria"].includes(name);
        html += `<label><input type="checkbox" data-cipher="${name}" ${isChecked ? 'checked' : ''}> ${name}</label>`;
    }
    cipherSettings.innerHTML = html;
}

function getActiveCiphers() {
    return Array.from(cipherSettings.querySelectorAll('input[type=checkbox]:checked'))
                .map(cb => cb.dataset.cipher);
}

async function saveToDatabase(db) {
    const phrase = gematriaInput.value.trim();
    if (!phrase) return;

    const { values } = calculateGematria(phrase);
    await addDoc(collection(db, "phrases"), {
        phrase: phrase,
        values: values,
        searchCount: 1,
        timestamp: serverTimestamp()
    });
    alert(`"${phrase}" saved to database.`);
    handleInputChange(db); // Refresh matches
}

async function processAndUploadFile(db) {
    const file = fileInput.files[0];
    const uploadStatus = document.getElementById('upload-status');
    if (!file) { alert("Please select a file."); return; }
    
    uploadStatus.textContent = "Reading file...";
    const reader = new FileReader();
    reader.onload = async (event) => {
        const lines = event.target.result.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        if (lines.length === 0) { uploadStatus.textContent = "File is empty."; return; }

        uploadStatus.textContent = `Processing ${lines.length} entries...`;
        const batch = writeBatch(db);
        lines.forEach(line => {
            const { values } = calculateGematria(line);
            const docRef = doc(collection(db, "phrases"));
            batch.set(docRef, { phrase: line, values, searchCount: 0, timestamp: serverTimestamp() });
        });
        
        await batch.commit();
        uploadStatus.textContent = `Upload complete! Added ${lines.length} entries.`;
        fileInput.value = '';
    };
    reader.onerror = () => { uploadStatus.textContent = "Error reading file."; };
    reader.readAsText(file);
}

function debounce(func, delay) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

function escapeHTML(str) {
    const p = document.createElement("p");
    p.textContent = str;
    return p.innerHTML;
}

