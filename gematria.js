// --- Firebase Imports ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, getDocs, limit, orderBy, doc, updateDoc, increment, writeBatch, or } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- GEMATRIA LOGIC (Global) ---
const CIPHERS = {};
const ALL_CIPHER_KEYS = [
    'Simple', 'English', 'Jewish', 'Chaldean',
    'ReverseSimple', 'ReverseOrdinal', 'ALW', 'Reduction',
    'GeminiResonance', 'QWERTY', 'Trigrammaton', 'Baconian', 
    'PhoneKeypad', 'Solfege', 'Zodiac', 'Fibonacci', 'PrimePosition'
];

function isPrime(n) {
    if (n <= 1) return false; if (n <= 3) return true;
    if (n % 2 === 0 || n % 3 === 0) return false;
    for (let i = 5; i * i <= n; i = i + 6) { if (n % i === 0 || n % (i + 2) === 0) return false; }
    return true;
}

function buildGematriaTables() {
    const a = 'abcdefghijklmnopqrstuvwxyz'.split('');
    const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    
    CIPHERS.Simple = {}; CIPHERS.English = {};
    a.forEach((l, i) => { CIPHERS.Simple[l] = i + 1; CIPHERS.English[l] = (i + 1) * 6; });

    const jewishValues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 200, 300, 400, 500, 600, 700, 800];
    CIPHERS.Jewish = {}; a.forEach((l, i) => CIPHERS.Jewish[l] = jewishValues[i]);

    CIPHERS.ReverseSimple = {}; a.slice().reverse().forEach((l, i) => { CIPHERS.ReverseSimple[l] = i + 1; });

    const ALW_MAP = {'A': 1, 'B': 20, 'C': 13, 'D': 6, 'E': 25, 'F': 18, 'G': 11, 'H': 4, 'I': 23, 'J': 16, 'K': 9, 'L': 2, 'M': 21, 'N': 14, 'O': 7, 'P': 26, 'Q': 19, 'R': 12, 'S': 5, 'T': 24, 'U': 17, 'V': 10, 'W': 3, 'X': 22, 'Y': 15, 'Z': 8};
    const CHALDEAN_MAP = {'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 8, 'G': 3, 'H': 5, 'I': 1, 'J': 1, 'K': 2, 'L': 3, 'M': 4, 'N': 5, 'O': 7, 'P': 8, 'Q': 1, 'R': 2, 'S': 3, 'T': 4, 'U': 6, 'V': 6, 'W': 6, 'X': 5, 'Y': 1, 'Z': 7};
    const REVERSE_ORDINAL_MAP = {'A': 26, 'B': 25, 'C': 24, 'D': 23, 'E': 22, 'F': 21, 'G': 20, 'H': 19, 'I': 18, 'J': 17, 'K': 16, 'L': 15, 'M': 14, 'N': 13, 'O': 12, 'P': 11, 'Q': 10, 'R': 9, 'S': 8, 'T': 7, 'U': 6, 'V': 5, 'W': 4, 'X': 3, 'Y': 2, 'Z': 1};
    const QWERTY_MAP = {'Q':1, 'W':2, 'E':3, 'R':4, 'T':5, 'Y':6, 'U':7, 'I':8, 'O':9, 'P':10, 'A':11, 'S':12, 'D':13, 'F':14, 'G':15, 'H':16, 'J':17, 'K':18, 'L':19, 'Z':20, 'X':21, 'C':22, 'V':23, 'B':24, 'N':25, 'M':26};
    const TRIGRAM_MAP = {'A': 5, 'B': 20, 'C': 2, 'D': 23, 'E': 13, 'F': 12, 'G': 11, 'H': 3, 'I': 0, 'J': 7, 'K': 17, 'L': 1, 'M': 21, 'N': 24, 'O': 10, 'P': 4, 'Q': 16, 'R': 14, 'S': 15, 'T': 9, 'U': 25, 'V': 22, 'W': 8, 'X': 6, 'Y': 18, 'Z': 19};
    const BACON_MAP = {'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5, 'G': 6, 'H': 7, 'I': 8, 'J': 8, 'K': 9, 'L': 10, 'M': 11, 'N': 12, 'O': 13, 'P': 14, 'Q': 15, 'R': 16, 'S': 17, 'T': 18, 'U': 19, 'V': 19, 'W': 20, 'X': 21, 'Y': 22, 'Z': 23};
    const PHONE_MAP = {'A': 2, 'B': 2, 'C': 2, 'D': 3, 'E': 3, 'F': 3, 'G': 4, 'H': 4, 'I': 4, 'J': 5, 'K': 5, 'L': 5, 'M': 6, 'N': 6, 'O': 6, 'P': 7, 'Q': 7, 'R': 7, 'S': 8, 'T': 8, 'U': 8, 'V': 9, 'W': 9, 'X': 9, 'Y': 9, 'Z': 9};
    const SOLFEGE_MAP = {'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 1, 'I': 2, 'J': 3, 'K': 4, 'L': 5, 'M': 6, 'N': 7, 'O': 1, 'P': 2, 'Q': 3, 'R': 4, 'S': 5, 'T': 6, 'U': 7, 'V': 1, 'W': 2, 'X': 3, 'Y': 4, 'Z': 5};
    const ZODIAC_MAP = {'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8, 'I': 9, 'J': 10, 'K': 11, 'L': 12, 'M': 1, 'N': 2, 'O': 3, 'P': 4, 'Q': 5, 'R': 6, 'S': 7, 'T': 8, 'U': 9, 'V': 10, 'W': 11, 'X': 12, 'Y': 1, 'Z': 2};
    
    const fibSequence = [0, 1]; while(fibSequence.length < 27) fibSequence.push(fibSequence[fibSequence.length - 1] + fibSequence[fibSequence.length - 2]);
    const FIB_MAP = {}; A.forEach((L, i) => FIB_MAP[L] = fibSequence[i+1]);

    const primeList = []; let num = 2; while(primeList.length < 26) { if(isPrime(num)) primeList.push(num); num++; }
    const PRIME_MAP = {}; A.forEach((L, i) => PRIME_MAP[L] = primeList[i]);

    CIPHERS.ALW = {}; CIPHERS.Chaldean = {}; CIPHERS.ReverseOrdinal = {}; CIPHERS.QWERTY = {}; CIPHERS.Trigrammaton = {}; CIPHERS.Baconian = {}; CIPHERS.PhoneKeypad = {}; CIPHERS.Solfege = {}; CIPHERS.Zodiac = {}; CIPHERS.Fibonacci = {}; CIPHERS.PrimePosition = {};
    A.forEach(L => {
        CIPHERS.ALW[L] = ALW_MAP[L] || 0; CIPHERS.Chaldean[L] = CHALDEAN_MAP[L] || 0; CIPHERS.ReverseOrdinal[L] = REVERSE_ORDINAL_MAP[L] || 0; CIPHERS.QWERTY[L] = QWERTY_MAP[L] || 0; CIPHERS.Trigrammaton[L] = TRIGRAM_MAP[L] || 0; CIPHERS.Baconian[L] = BACON_MAP[L] || 0; CIPHERS.PhoneKeypad[L] = PHONE_MAP[L] || 0; CIPHERS.Solfege[L] = SOLFEGE_MAP[L] || 0; CIPHERS.Zodiac[L] = ZODIAC_MAP[L] || 0; CIPHERS.Fibonacci[L] = FIB_MAP[L] || 0; CIPHERS.PrimePosition[L] = PRIME_MAP[L] || 0;
    });

    CIPHERS.Reduction = (text) => {
        const simpleValue = text.split('').reduce((sum, char) => sum + (CIPHERS.Simple[char.toLowerCase()] || 0), 0);
        if (simpleValue === 0) return 0;
        let val = simpleValue;
        while (val > 9 && val !== 11 && val !== 22) { val = String(val).split('').reduce((s, d) => s + parseInt(d, 10), 0); }
        return val;
    };

    const primesForGemini = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101];
    CIPHERS.GeminiResonance = (text) => {
        let total = 1;
        text.toLowerCase().split('').forEach((char, i) => {
            if ('a' <= char && char <= 'z') {
                total += primesForGemini[char.charCodeAt(0) - 97] * (i + 1);
            }
        });
        return (total % 997) + text.length;
    };
    
    A.forEach(L => {
        const l = L.toLowerCase();
        Object.keys(CIPHERS).forEach(key => { if (typeof CIPHERS[key] === 'object' && CIPHERS[key][L]) { CIPHERS[key][l] = CIPHERS[key][L]; } });
    });
}
buildGematriaTables();


// --- Main App Logic ---
document.addEventListener('DOMContentLoaded', async () => {
    // Firebase Init, Theme Logic... (unchanged)
    if (document.getElementById('gematria-input')) initCalculatorPage(db);
    // ... other page inits
});


// --- CALCULATOR PAGE LOGIC ---
function initCalculatorPage(db) {
    const gematriaCollectionRef = collection(db, "gematria-entries");
    const gematriaInput = document.getElementById('gematria-input');
    const resultsSummary = document.getElementById('results-summary');
    const dbMatchesContainer = document.getElementById('db-matches-container');
    const cipherSettings = document.getElementById('cipher-settings');
    let currentValues = null;
    let activeCiphers = ['Simple', 'English', 'Jewish', 'Chaldean', 'GeminiResonance'];
    let allMatchesData = {}; // Store full results for pagination

    const handleInputChange = () => {
        const input = gematriaInput.value.trim();
        clearResults();
        if (!input) return;
        const isNumberSearch = /^\d+$/.test(input);
        if (isNumberSearch) {
            fetchAndDisplayMatches(true, parseInt(input, 10));
        } else {
            calculateGematriaForText(input);
        }
    };
    
    const debouncedHandler = debounce(handleInputChange, 300);

    function clearResults() {
        resultsSummary.innerHTML = ''; 
        dbMatchesContainer.innerHTML = '';
        currentValues = null;
        allMatchesData = {};
    }

    function calculateGematriaForText(text) {
        currentValues = {};
        resultsSummary.innerHTML = '';
        for (const cipher of activeCiphers) {
            let total;
            if (typeof CIPHERS[cipher] === 'function') {
                total = CIPHERS[cipher](text);
            } else {
                total = text.split('').reduce((sum, char) => sum + (CIPHERS[cipher][char] || 0), 0);
            }
            currentValues[cipher] = total;
            displayResultCard(cipher, total);
        }
        fetchAndDisplayMatches(false);
    }

    async function fetchAndDisplayMatches(isNumberSearch, number = 0) {
        dbMatchesContainer.innerHTML = 'Loading matches...';
        allMatchesData = {};

        const queries = activeCiphers.map(cipher => {
            const value = isNumberSearch ? number : currentValues[cipher];
            if (value > 0 && typeof CIPHERS[cipher] !== 'function') {
                return getDocs(query(gematriaCollectionRef, where(cipher, "==", value)));
            }
            return Promise.resolve(null);
        });

        const snapshots = await Promise.all(queries);

        dbMatchesContainer.innerHTML = '';
        snapshots.forEach((snapshot, index) => {
            const cipher = activeCiphers[index];
            const value = isNumberSearch ? number : currentValues[cipher];

            if (snapshot && !snapshot.empty) {
                const phrases = snapshot.docs.map(doc => doc.data().phrase);
                allMatchesData[cipher] = { phrases, value };
                renderTable(cipher, 1);
            }
        });
    }

    function renderTable(cipher, page) {
        const { phrases, value } = allMatchesData[cipher];
        const pageSize = 20;
        const totalPages = Math.ceil(phrases.length / pageSize);
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        const paginatedPhrases = phrases.slice(start, end);

        const tableId = `table-${cipher}`;
        let container = document.getElementById(tableId);
        if (!container) {
            container = document.createElement('div');
            container.id = tableId;
            dbMatchesContainer.appendChild(container);
        }

        const tableRows = paginatedPhrases.map(p => `<tr><td>${escapeHTML(p)}</td></tr>`).join('');
        
        container.innerHTML = `
            <details class="match-table-container" open>
                <summary>${escapeHTML(cipher)} = ${value} (${phrases.length} matches)</summary>
                <table class="match-table">
                    <thead><tr><th>Phrase</th></tr></thead>
                    <tbody>${tableRows}</tbody>
                </table>
                <div class="pagination" data-cipher="${cipher}">
                    ${renderPagination(page, totalPages)}
                </div>
            </details>
        `;
    }

    function renderPagination(currentPage, totalPages) {
        if (totalPages <= 1) return '';
        let html = `<button class="prev" ${currentPage === 1 ? 'disabled' : ''}>&lt;&lt;</button>`;
        for (let i = 1; i <= totalPages; i++) {
            html += `<button class="page-number ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }
        html += `<button class="next" ${currentPage === totalPages ? 'disabled' : ''}>&gt;&gt;</button>`;
        return html;
    }

    dbMatchesContainer.addEventListener('click', (e) => {
        const target = e.target;
        const paginationDiv = target.closest('.pagination');
        if (!paginationDiv) return;

        const cipher = paginationDiv.dataset.cipher;
        const currentPage = parseInt(paginationDiv.querySelector('.active').dataset.page, 10);

        let newPage = currentPage;
        if (target.classList.contains('page-number')) {
            newPage = parseInt(target.dataset.page, 10);
        } else if (target.classList.contains('prev')) {
            newPage = currentPage - 1;
        } else if (target.classList.contains('next')) {
            newPage = currentPage + 1;
        }

        if (newPage !== currentPage) {
            renderTable(cipher, newPage);
        }
    });

    function displayResultCard(cipher, value) {
        const card = document.createElement('div');
        card.className = 'result-card-summary';
        card.innerHTML = `<span class="cipher-name">${escapeHTML(cipher)}:</span><span class="cipher-value">${value}</span>`;
        resultsSummary.appendChild(card);
    }
    
    function updateActiveCiphers() {
        activeCiphers = Array.from(cipherSettings.querySelectorAll('input:checked')).map(cb => cb.dataset.cipher);
        handleInputChange();
    }
    
    gematriaInput.addEventListener('input', debouncedHandler);
    cipherSettings.addEventListener('change', updateActiveCiphers);
    updateActiveCiphers();
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
