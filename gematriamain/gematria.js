import { getTopSearches, recordSearch } from './local-db.js';

// --- GLOBAL STATE & CONSTANTS ---
const CIPHERS = {};
const CIPHER_DESCRIPTIONS = {};
const PHI = 1.618033988749895;
const GOLDEN_ANGLE = 137.50776405;

// --- DOM ELEMENTS ---
const gematriaForm = document.getElementById('gematria-form');
const textInput = document.getElementById('text-input');
const statsTbody = document.getElementById('stats-tbody');
const exampleLinks = document.querySelectorAll('.example-link');
const currentSearchResultsContainer = document.getElementById('current-search-results');
const mainHeader = document.querySelector('.site-header-main');


// --- UTILITY: NUMBER ANALYSIS ---
function recursiveDigitSum(n) {
    let val = Math.abs(Math.round(n));
    while (val > 9) {
        val = String(val).split('').reduce((sum, digit) => sum + parseInt(digit, 10), 0);
    }
    return val;
}


// --- GEMATRIA CIPHER DEFINITIONS ---
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
    
    for (let base = 2; base <= 12; base++) {
        ciphers[`Base-${base} Sum`] = (text) => {
            const simple = ciphers["English Ordinal"](text);
            return simple.toString(base).split('').reduce((s, d) => s + parseInt(d, base), 0);
        };
    }

    const reverseCiphers = {};
    for (const key in ciphers) {
        reverseCiphers[`Reverse ${key}`] = (text) => ciphers[key](text.split('').reverse().join(''));
    }
    
    return { ...ciphers, ...reverseCiphers };
}


// --- MAIN CALCULATION & DISPLAY LOGIC ---

// Displays the result for the single term that was just searched
function displayCurrentResult(term) {
    if (!term.trim()) {
        currentSearchResultsContainer.innerHTML = '';
        return;
    }

    let resultsHtml = '<strong>Matching Resonances:</strong><br><br>';
    for (const cipherName in CIPHERS) {
        const value = CIPHERS[cipherName](term);
        resultsHtml += `
            <div class="resonance-result">
                <span><strong>${cipherName}:</strong> ${value}</span>
            </div>
        `;
    }
    
    currentSearchResultsContainer.innerHTML = resultsHtml;
}

async function handleCalculation(event) {
    event.preventDefault(); // Prevent form from reloading the page
    const text = textInput.value;
    if (text.trim()) {
        displayCurrentResult(text);
        await recordSearch(text);
        await updateStatsTable();
    }
}

async function updateStatsTable() {
    const topSearches = await getTopSearches(20); // Get more results to fill the table
    let statsHtml = '';

    if (topSearches.length === 0) {
        statsHtml = '<tr><td colspan="5" style="text-align:center;">No searches recorded yet.</td></tr>';
    } else {
        for (const item of topSearches) {
            statsHtml += `
                <tr>
                    <td><a href="#" class="example-link">${item.term}</a></td>
                    <td>${CIPHERS["Jewish Gematria"](item.term)}</td>
                    <td>${CIPHERS["English Ordinal"](item.term)}</td>
                    <td>${CIPHERS["Full Reduction"](item.term)}</td>
                    <td>${item.count}</td>
                </tr>
            `;
        }
    }
    statsTbody.innerHTML = statsHtml;
}

function handleExampleLinkClick(event) {
     if (event.target.classList.contains('example-link')) {
        event.preventDefault();
        const word = event.target.textContent;
        textInput.value = word;
        displayCurrentResult(word);
        window.scrollTo(0, 0); // Scroll to top to see the result
    }
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async () => {
    Object.assign(CIPHERS, buildGematriaCiphers());
    
    gematriaForm.addEventListener('submit', handleCalculation);
    
    // Add listeners to both static and dynamic links
    document.body.addEventListener('click', handleExampleLinkClick);

    // Initial load
    await updateStatsTable();
});
