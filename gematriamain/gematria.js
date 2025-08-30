import { db, getTopSearches, recordSearch } from './local-db.js';

// --- GLOBAL STATE & CONSTANTS ---
const CIPHERS = {};
const PHI = 1.618033988749895;
const GOLDEN_ANGLE = 137.50776405;
const CORE_CIPHERS = ["English Ordinal", "Reverse Ordinal", "Full Reduction", "Jewish Gematria", "Sumerian", "Chaldean"];

// --- DOM ELEMENTS ---
const textInput = document.getElementById('text-input');
const calculateBtn = document.getElementById('calculate-btn');
const liveUpdateCheckbox = document.getElementById('live-update-checkbox');
const resultsContainer = document.getElementById('results-container');
const breakdownContainer = document.getElementById('breakdown-container');
const statsTbody = document.getElementById('stats-tbody');

// --- UTILITY ---
function recursiveDigitSum(n) {
    let val = Math.abs(Math.round(n));
    while (val > 9) {
        val = String(val).split('').reduce((sum, digit) => sum + parseInt(digit, 10), 0);
    }
    return val;
}

// --- GEMATRIA CIPHER DEFINITIONS ---
function buildGematriaCiphers() {
    // This is the same logic from your ciphers.js file
    const a = 'abcdefghijklmnopqrstuvwxyz';
    const simpleMap = {};
    a.split('').forEach((l, i) => { simpleMap[l] = i + 1; });
    const jewishValues = { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8, i: 9, k: 10, l: 20, m: 30, n: 40, o: 50, p: 60, q: 70, r: 80, s: 90, t: 100, u: 200, x: 300, y: 400, z: 500, j: 600, v: 700, w: 900 };
    
    const ciphers = {
        "English Ordinal": (text) => text.toLowerCase().replace(/[^a-z]/g, '').split('').reduce((sum, char) => sum + (simpleMap[char] || 0), 0),
        "Reverse Ordinal": (text) => text.toLowerCase().replace(/[^a-z]/g, '').split('').reduce((sum, char) => sum + (27 - (simpleMap[char] || 0)), 0),
        "Full Reduction": (text) => text.toLowerCase().replace(/[^a-z]/g, '').split('').reduce((sum, char) => sum + (((simpleMap[char] - 1) % 9) + 1 || 0), 0),
        "Jewish Gematria": (text) => text.toLowerCase().replace(/[^a-z]/g, '').split('').reduce((sum, char) => sum + (jewishValues[char] || 0), 0),
        "Sumerian": (text) => text.toLowerCase().replace(/[^a-z]/g, '').split('').reduce((sum, char) => sum + ((simpleMap[char] || 0) * 6), 0),
        "Chaldean": (text) => {
            const chaldeanMap = { a: 1, i: 1, j: 1, q: 1, y: 1, b: 2, k: 2, r: 2, c: 3, g: 3, l: 3, s: 3, d: 4, m: 4, t: 4, e: 5, h: 5, n: 5, x: 5, u: 6, v: 6, w: 6, o: 7, z: 7, f: 8, p: 8 };
            return text.toLowerCase().replace(/[^a-z]/g, '').split('').reduce((sum, char) => sum + (chaldeanMap[char] || 0), 0);
        },
    };
    return ciphers;
}

// --- MAIN CALCULATION & DISPLAY LOGIC ---
function calculateAndDisplay(inputText) {
    if (!inputText.trim()) {
        resultsContainer.innerHTML = '';
        breakdownContainer.innerHTML = '';
        return;
    }

    // Display Cipher Results
    let resultsHtml = '';
    CORE_CIPHERS.forEach(cipherName => {
        const value = CIPHERS[cipherName](inputText);
        resultsHtml += `
            <div class="result-card">
                <h3>${cipherName}</h3>
                <p class="value">${value}</p>
            </div>
        `;
    });
    resultsContainer.innerHTML = resultsHtml;

    // Display Character Breakdown
    let breakdownHtml = '';
    inputText.toLowerCase().replace(/[^a-z]/g, '').split('').forEach(char => {
        const ordinalValue = char.charCodeAt(0) - 96;
        breakdownHtml += `
            <div class="char-breakdown">
                <span class="char-display">${char.toUpperCase()}</span>
                <span class="char-ordinal-value">${ordinalValue}</span>
            </div>
        `;
    });
    breakdownContainer.innerHTML = breakdownHtml;
}


async function handleCalculation() {
    const text = textInput.value;
    if (text.trim()) {
        calculateAndDisplay(text);
        await recordSearch(text);
        await updateStatsTable();
    }
}

async function updateStatsTable() {
    const topSearches = await getTopSearches(10);
    let statsHtml = '';
    if (topSearches.length === 0) {
        statsHtml = '<tr><td colspan="5" style="text-align:center;">No searches recorded yet.</td></tr>';
    } else {
        for (const item of topSearches) {
            statsHtml += `
                <tr>
                    <td><a href="#" data-word="${item.term}">${item.term}</a></td>
                    <td>${item.count}</td>
                    <td>${CIPHERS["English Ordinal"](item.term)}</td>
                    <td>${CIPHERS["Full Reduction"](item.term)}</td>
                    <td>${CIPHERS["Jewish Gematria"](item.term)}</td>
                </tr>
            `;
        }
    }
    statsTbody.innerHTML = statsHtml;
}


// --- EVENT LISTENERS & INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async () => {
    Object.assign(CIPHERS, buildGematriaCiphers());

    calculateBtn.addEventListener('click', handleCalculation);
    
    textInput.addEventListener('input', () => {
        if (liveUpdateCheckbox.checked) {
            calculateAndDisplay(textInput.value);
        }
    });

    textInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            handleCalculation();
        }
    });
    
    statsTbody.addEventListener('click', (event) => {
        if (event.target.tagName === 'A' && event.target.dataset.word) {
            event.preventDefault();
            const word = event.target.dataset.word;
            textInput.value = word;
            calculateAndDisplay(word);
        }
    });

    // Initial load
    await updateStatsTable();
    calculateAndDisplay(""); // Start with a clean slate
});
