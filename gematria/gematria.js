import { getTopSearches, recordSearch } from './local-db.js';

// --- GLOBAL STATE & CONSTANTS ---
const CIPHERS = {};

// --- DOM ELEMENTS ---
const gematriaForm = document.getElementById('gematria-form');
const textInput = document.getElementById('text-input');
const statsTbody = document.getElementById('stats-tbody');
const exampleLinks = document.querySelectorAll('.example-link');
const currentSearchResultsContainer = document.getElementById('current-search-results');


// --- GEMATRIA CIPHER DEFINITIONS ---
function buildGematriaCiphers() {
    const a = 'abcdefghijklmnopqrstuvwxyz';
    const simpleMap = {};
    a.split('').forEach((l, i) => { simpleMap[l] = i + 1; });
    const jewishValues = { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8, i: 9, k: 10, l: 20, m: 30, n: 40, o: 50, p: 60, q: 70, r: 80, s: 90, t: 100, u: 200, x: 300, y: 400, z: 500, j: 600, v: 700, w: 900 };
    
    return {
        "English": (text) => text.toLowerCase().replace(/[^a-z]/g, '').split('').reduce((sum, char) => sum + (simpleMap[char] || 0), 0) * 6, // English Gematria seems to be Ordinal * 6
        "Jewish": (text) => text.toLowerCase().replace(/[^a-z]/g, '').split('').reduce((sum, char) => sum + (jewishValues[char] || 0), 0),
        "Simple": (text) => text.toLowerCase().replace(/[^a-z]/g, '').split('').reduce((sum, char) => sum + (simpleMap[char] || 0), 0),
    };
}


// --- MAIN CALCULATION & DISPLAY LOGIC ---

// Displays the result for the single term that was just searched
function displayCurrentResult(term) {
    if (!term.trim()) {
        currentSearchResultsContainer.innerHTML = '';
        return;
    }
    const jewishVal = CIPHERS["Jewish"](term);
    const englishVal = CIPHERS["English"](term);
    const simpleVal = CIPHERS["Simple"](term);

    currentSearchResultsContainer.innerHTML = `
        <strong>Results for "${term}":</strong> 
        Jewish: ${jewishVal}, 
        English: ${englishVal}, 
        Simple: ${simpleVal}
    `;
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
                    <td>${CIPHERS["Jewish"](item.term)}</td>
                    <td>${CIPHERS["English"](item.term)}</td>
                    <td>${CIPHERS["Simple"](item.term)}</td>
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

// --- EVENT LISTENERS & INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async () => {
    Object.assign(CIPHERS, buildGematriaCiphers());

    gematriaForm.addEventListener('submit', handleCalculation);
    
    // Add listeners to both static and dynamic links
    document.body.addEventListener('click', handleExampleLinkClick);

    // Initial load
    await updateStatsTable();
});

