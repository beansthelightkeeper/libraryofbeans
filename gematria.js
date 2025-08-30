// --- Firebase Imports ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, getDocs, limit, writeBatch, or, doc, serverTimestamp, runTransaction } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- GLOBAL STATE & CONSTANTS ---
const CIPHERS = {
    "English Ordinal": (char) => "abcdefghijklmnopqrstuvwxyz".indexOf(char) + 1,
    "Reverse Ordinal": (char) => 26 - "abcdefghijklmnopqrstuvwxyz".indexOf(char),
    "Full Reduction": (char) => (("abcdefghijklmnopqrstuvwxyz".indexOf(char)) % 9) + 1,
    "Reverse Full Reduction": (char) => 9 - (("abcdefghijklmnopqrstuvwxyz".indexOf(char)) % 9),
};
const ENTRIES_PER_PAGE = 25;
let currentPages = {}; // state for pagination

// --- DOM ELEMENTS ---
const gematriaInput = document.getElementById('gematria-input');
const resultsSummary = document.getElementById('results-summary');
const breakdownContainer = document.getElementById('breakdown-container');
const dbMatchesContainer = document.getElementById('db-matches-container');
const comparisonContainer = document.getElementById('comparison-container');
const cipherSettings = document.getElementById('cipher-settings');

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async () => {
    // Assuming firebaseConfig is loaded from firebase-config.js
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);
    await signInAnonymously(auth);
    
    // Dynamically generate cipher settings
    for (const name in CIPHERS) {
        cipherSettings.innerHTML += `<label><input type="checkbox" data-cipher="${name}" checked> ${name}</label>`;
    }

    gematriaInput.addEventListener('input', debounce(() => handleInputChange(db), 300));
    dbMatchesContainer.addEventListener('click', (e) => handleMatchClick(e, db));
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
    const inputText = gematriaInput.value.trim();
    comparisonContainer.innerHTML = ''; // Clear comparison on new input
    if (!inputText) {
        resultsSummary.innerHTML = '';
        breakdownContainer.innerHTML = '';
        dbMatchesContainer.innerHTML = '';
        return;
    }

    const { values, breakdown } = calculateGematria(inputText);
    displaySummary(values);
    displayBreakdown(breakdown);
    await findAndDisplayMatches(db, values);
}

async function findAndDisplayMatches(db, values) {
    dbMatchesContainer.innerHTML = '';
    const activeCiphers = getActiveCiphers();
    if (activeCiphers.length === 0) return;

    const queries = activeCiphers.map(cipher => 
        where(`values.${cipher}`, "==", values[cipher])
    );

    const mainQuery = query(collection(db, "phrases"), or(...queries));
    const querySnapshot = await getDocs(mainQuery);
    
    const matchesByCipher = {};
    activeCiphers.forEach(cipher => { matchesByCipher[cipher] = []; });

    querySnapshot.forEach(doc => {
        const data = doc.data();
        activeCiphers.forEach(cipher => {
            if (data.values[cipher] === values[cipher]) {
                matchesByCipher[cipher].push(data.phrase);
            }
        });
    });

    for (const cipher of activeCiphers) {
        currentPages[cipher] = 1; // Reset page for each new search
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

function displayBreakdown(breakdown) {
    let html = '<h3>Breakdown</h3>';
    for (const cipher in breakdown) {
        html += `<div><strong>${cipher}:</strong> ${breakdown[cipher].map(b => `${b.char}(${b.value})`).join(' + ')}</div>`;
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
            <summary>${cipher} (${value}) - ${matches.length} matches</summary>
            <table class="match-table">
    `;
    if (paginatedMatches.length > 0) {
        paginatedMatches.forEach(match => {
            tableHtml += `<tr data-phrase="${escapeHTML(match)}"><td>${escapeHTML(match)}</td></tr>`;
        });
    } else {
        tableHtml += '<tr><td>No matches found in the database.</td></tr>';
    }
    tableHtml += '</table>';
    
    if (totalPages > 1) {
        tableHtml += `
            <div class="pagination-controls">
                <button data-cipher="${cipher}" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}>Previous</button>
                <span class="pagination-info">Page ${currentPage} of ${totalPages}</span>
                <button data-cipher="${cipher}" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''}>Next</button>
            </div>
        `;
    }
    tableHtml += '</details>';
    container.innerHTML = tableHtml;

    // Add event listeners for new buttons
    container.querySelectorAll('.pagination-controls button').forEach(button => {
        button.addEventListener('click', () => {
            currentPages[cipher] = parseInt(button.dataset.page);
            displayPaginatedMatches(cipher, matches, value);
        });
    });
}

function displayComparisonChart(original, resonant) {
    const activeCiphers = getActiveCiphers();
    let html = `<h3 class="comparison-header">Comparison: "${original.phrase}" vs "${resonant.phrase}"</h3>`;
    html += '<table class="comparison-table"><tr><th>Cipher</th>';
    
    // Headers for original phrase
    original.breakdown[activeCiphers[0]].forEach(b => {
        html += `<th>${escapeHTML(b.char)}</th>`;
    });
    html += `<th class="phrase-header">${escapeHTML(original.phrase)}</th>`;

    // Headers for resonant phrase
    resonant.breakdown[activeCiphers[0]].forEach(b => {
        html += `<th>${escapeHTML(b.char)}</th>`;
    });
    html += `<th class="phrase-header">${escapeHTML(resonant.phrase)}</th></tr>`;

    // Data rows for each cipher
    activeCiphers.forEach(cipher => {
        html += `<tr><td class="cipher-name-col">${cipher}</td>`;
        // Original phrase values
        original.breakdown[cipher].forEach(b => {
            html += `<td>${b.value}</td>`;
        });
        html += `<td><strong>${original.values[cipher]}</strong></td>`;
        // Resonant phrase values
        resonant.breakdown[cipher].forEach(b => {
            html += `<td>${b.value}</td>`;
        });
        html += `<td><strong>${resonant.values[cipher]}</strong></td>`;
        html += '</tr>';
    });

    html += '</table>';
    comparisonContainer.innerHTML = html;
    comparisonContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}


// --- EVENT HANDLERS & HELPERS ---

async function handleMatchClick(event, db) {
    const row = event.target.closest('tr[data-phrase]');
    if (!row) return;

    const originalPhrase = gematriaInput.value.trim();
    const resonantPhrase = row.dataset.phrase;

    const originalData = calculateGematria(originalPhrase);
    
    // Fetch resonant phrase data from DB to ensure accuracy
    const q = query(collection(db, "phrases"), where("phrase", "==", resonantPhrase), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        console.error("Could not find resonant phrase in DB");
        return;
    }
    const resonantDbData = snapshot.docs[0].data();
    const resonantCalcData = calculateGematria(resonantPhrase);

    displayComparisonChart(
        { phrase: originalPhrase, ...originalData },
        { phrase: resonantPhrase, values: resonantDbData.values, breakdown: resonantCalcData.breakdown }
    );
}

function getActiveCiphers() {
    return Array.from(cipherSettings.querySelectorAll('input[type=checkbox]:checked'))
                .map(cb => cb.dataset.cipher);
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
