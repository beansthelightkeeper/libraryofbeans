// --- Firebase Imports ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs, limit, or, doc, runTransaction } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- GLOBAL STATE & CONSTANTS ---
const CIPHERS = {
    "English Ordinal": (char) => "abcdefghijklmnopqrstuvwxyz".indexOf(char) + 1,
    "Reverse Ordinal": (char) => 26 - "abcdefghijklmnopqrstuvwxyz".indexOf(char),
    "Full Reduction": (char) => (("abcdefghijklmnopqrstuvwxyz".indexOf(char)) % 9) + 1,
    "Reverse Full Reduction": (char) => 9 - (("abcdefghijklmnopqrstuvwxyz".indexOf(char)) % 9),
    "Jewish Gematria": (char) => {
        const jewishValues = { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8, i: 9, k: 10, l: 20, m: 30, n: 40, o: 50, p: 60, q: 70, r: 80, s: 90, t: 100, u: 200, x: 300, y: 400, z: 500, j: 600, v: 700, w: 900 };
        return jewishValues[char] || 0;
    }
};
const ENTRIES_PER_PAGE = 25;
let currentPages = {}; // state for pagination

// --- DOM ELEMENTS ---
const statsInput = document.getElementById('stats-input');
const resultsSummary = document.getElementById('results-summary');
const breakdownContainer = document.getElementById('breakdown-container');
const statisticsResultsContainer = document.getElementById('statistics-results-container');
const comparisonContainer = document.getElementById('comparison-container');
const themeToggleButton = document.querySelector('.theme-toggle-button');


// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async () => {
    // Assuming firebaseConfig is loaded from firebase-config.js
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);
    await signInAnonymously(auth);
    
    setupTheme();

    statsInput.addEventListener('input', debounce(() => handleInputChange(db), 300));
    statisticsResultsContainer.addEventListener('click', (e) => handleMatchClick(e, db));
});

// --- CORE FUNCTIONS ---

function calculateGematria(text) {
    const values = {};
    const breakdown = {};
    const cleanedText = text.toLowerCase().replace(/[^a-z]/g, '');

    for (const name in CIPHERS) {
        values[name] = 0;
        breakdown[name] = [];
        for (const char of cleanedText) {
            const value = CIPHERS[name](char);
            values[name] += value;
            breakdown[name].push({ char, value });
        }
    }
    return { values, breakdown };
}

async function handleInputChange(db) {
    const inputText = statsInput.value.trim();
    comparisonContainer.innerHTML = ''; // Clear comparison on new input
    if (!inputText) {
        resultsSummary.innerHTML = '';
        breakdownContainer.innerHTML = '';
        statisticsResultsContainer.innerHTML = '';
        return;
    }

    const { values, breakdown } = calculateGematria(inputText);
    displaySummary(values);
    displayDetailedBreakdown(breakdown);
    await findAndDisplayMatches(db, values);
}

async function findAndDisplayMatches(db, values) {
    statisticsResultsContainer.innerHTML = '';
    const activeCiphers = Object.keys(CIPHERS);

    const queries = activeCiphers.map(cipher => where(`values.${cipher}`, "==", values[cipher]));
    const mainQuery = query(collection(db, "phrases"), or(...queries));
    const querySnapshot = await getDocs(mainQuery);
    
    const matchesByCipher = {};
    activeCiphers.forEach(cipher => { matchesByCipher[cipher] = []; });

    querySnapshot.forEach(doc => {
        const data = doc.data();
        activeCiphers.forEach(cipher => {
            if (data.values[cipher] === values[cipher]) {
                if (data.phrase.toLowerCase() !== statsInput.value.trim().toLowerCase()) {
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
        // Sort matches by search count descending
        matchesByCipher[cipher].sort((a, b) => b.searchCount - a.searchCount);
        displayPaginatedMatches(cipher, matchesByCipher[cipher], values[cipher]);
    }
}

// --- DISPLAY FUNCTIONS ---

function displaySummary(values) {
    let html = '';
    for (const cipher in values) {
        html += `<div class="summary-card"><strong>${cipher}:</strong> ${values[cipher]}</div>`;
    }
    resultsSummary.innerHTML = html;
}

function displayDetailedBreakdown(breakdown) {
    let html = '<h3>Breakdown</h3>';
    for (const cipher in breakdown) {
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
    breakdownContainer.innerHTML = html;
}

function displayPaginatedMatches(cipher, matches, value) {
    const containerId = `matches-${cipher.replace(/\s+/g, '-')}`;
    let container = document.getElementById(containerId);
    if (!container) {
        container = document.createElement('div');
        container.id = containerId;
        container.className = 'match-table-container';
        statisticsResultsContainer.appendChild(container);
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
    const activeCiphers = ["English Ordinal", "Jewish Gematria", "Full Reduction"];
    let html = `<h3 class="comparison-header">Comparison: "${original.phrase}" vs "${resonant.phrase}"</h3>`;
    html += '<table class="comparison-table"><tr><th>Cipher</th>';
    
    original.breakdown[activeCiphers[0]].forEach(b => html += `<th>${escapeHTML(b.char)}</th>`);
    html += `<th class="phrase-header">${escapeHTML(original.phrase)}</th>`;

    resonant.breakdown[activeCiphers[0]].forEach(b => html += `<th>${escapeHTML(b.char)}</th>`);
    html += `<th class="phrase-header">${escapeHTML(resonant.phrase)}</th></tr>`;

    activeCiphers.forEach(cipher => {
        if(!CIPHERS[cipher]) return;
        html += `<tr><td class="cipher-name-col">${cipher}</td>`;
        original.breakdown[cipher].forEach(b => html += `<td>${b.value}</td>`);
        html += `<td><strong>${original.values[cipher]}</strong></td>`;
        resonant.breakdown[cipher].forEach(b => html += `<td>${b.value}</td>`);
        html += `<td><strong>${resonant.values[cipher]}</strong></td></tr>`;
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

    // --- New Click-to-Search Logic ---
    statsInput.value = resonantPhrase; // Set the input to the clicked phrase
    handleInputChange(db); // Trigger a new search
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top for new results

    // Increment search count for the clicked phrase in the background
    const q = query(collection(db, "phrases"), where("phrase", "==", resonantPhrase), limit(1));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
        const docRef = snapshot.docs[0].ref;
        try {
            await runTransaction(db, async (transaction) => {
                const sfDoc = await transaction.get(docRef);
                if (!sfDoc.exists()) {
                    throw "Document does not exist!";
                }
                const newCount = (sfDoc.data().searchCount || 0) + 1;
                transaction.update(docRef, { searchCount: newCount });
            });
        } catch (e) {
            console.error("Transaction failed: ", e);
        }
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

