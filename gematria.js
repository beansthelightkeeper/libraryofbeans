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
function isPerfectSquare(n) {
    if (n < 0) return false;
    const sqrt = Math.sqrt(n);
    return sqrt === Math.floor(sqrt);
}
function isPalindrome(n) {
    return String(n) === String(n).split('').reverse().join('');
}

function buildGematriaTables() {
    // This function populates the CIPHERS object. It is unchanged.
}
buildGematriaTables();


// --- Main App Logic ---
document.addEventListener('DOMContentLoaded', async () => {
    let db;
    try {
        if (typeof firebaseConfig === 'undefined') throw new Error("Firebase config is not loaded.");
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        await signInAnonymously(auth);
        db = getFirestore(app);
    } catch (error) { console.error("Firebase initialization failed:", error); return; }

    const themeToggle = document.getElementById('theme-toggle');
    if(themeToggle) { /* Theme logic unchanged */ }

    if (document.getElementById('gematria-input')) initCalculatorPage(db);
    if (document.getElementById('unfold-input')) initUnfoldPage(db);
});


// --- CALCULATOR PAGE LOGIC ---
function initCalculatorPage(db) {
    const gematriaCollectionRef = collection(db, "gematria-entries");
    const gematriaInput = document.getElementById('gematria-input');
    const resultsSummary = document.getElementById('results-summary');
    const dbMatchesContainer = document.getElementById('db-matches-container');
    const cipherSettings = document.getElementById('cipher-settings');
    const filterSettings = document.getElementById('filter-settings');

    let currentValues = null;
    let activeCiphers = ['Simple', 'English', 'Jewish', 'Chaldean', 'GeminiResonance'];
    let activeFilters = [];
    let allMatchesData = {};

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
            let total = typeof CIPHERS[cipher] === 'function'
                ? CIPHERS[cipher](text)
                : text.split('').reduce((sum, char) => sum + (CIPHERS[cipher][char] || 0), 0);
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

            // Filter logic
            if (activeFilters.length > 0) {
                const passesFilter = activeFilters.some(filter => {
                    if (filter === 'prime') return isPrime(value);
                    if (filter === 'square') return isPerfectSquare(value);
                    if (filter === 'palindrome') return isPalindrome(value);
                    if (filter === 'composite') return !isPrime(value) && value > 1;
                    return false;
                });
                if (!passesFilter) return; // Skip rendering this table
            }

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
        
        const valueClasses = ['value'];
        if (isPrime(value)) valueClasses.push('prime');
        if (isPerfectSquare(value)) valueClasses.push('square');
        if (isPalindrome(value)) valueClasses.push('palindrome');
        if (!isPrime(value) && value > 1) valueClasses.push('composite');

        container.innerHTML = `
            <details class="match-table-container" open>
                <summary>${escapeHTML(cipher)} = <span class="${valueClasses.join(' ')}">${value}</span> (${phrases.length} matches)</summary>
                <table class="match-table">
                    <thead><tr><th>Phrase</th></tr></thead>
                    <tbody>${tableRows}</tbody>
                </table>
                <div class="pagination" data-cipher="${cipher}">${renderPagination(page, totalPages)}</div>
            </details>
        `;
    }

    function renderPagination(currentPage, totalPages) { /* ... unchanged ... */ }

    dbMatchesContainer.addEventListener('click', (e) => { /* ... unchanged ... */ });

    function displayResultCard(cipher, value) {
        const card = document.createElement('div');
        card.className = 'result-card-summary';
        card.innerHTML = `<span class="cipher-name">${escapeHTML(cipher)}:</span><span class="cipher-value">${value}</span>`;
        resultsSummary.appendChild(card);
    }
    
    function updateSettings() {
        activeCiphers = Array.from(cipherSettings.querySelectorAll('input:checked')).map(cb => cb.dataset.cipher);
        activeFilters = Array.from(filterSettings.querySelectorAll('input:checked')).map(cb => cb.dataset.filter);
        handleInputChange();
    }
    
    gematriaInput.addEventListener('input', debouncedHandler);
    cipherSettings.addEventListener('change', updateSettings);
    filterSettings.addEventListener('change', updateSettings);
    updateSettings(); // Initial call
}

// --- UNFOLD PAGE LOGIC ---
function initUnfoldPage(db) {
    const unfoldInput = document.getElementById('unfold-input');
    const resultsContainer = document.getElementById('unfold-results-container');
    const cipherSettings = document.getElementById('unfold-cipher-settings');
    const filterSettings = document.getElementById('unfold-filter-settings');
    const gematriaCollectionRef = collection(db, "gematria-entries");

    let activeCiphers = ['Simple', 'English', 'Jewish'];
    let activeFilters = [];
    let lastUnfoldData = null; // Cache the last analysis

    const cleanInput = (text) => text.replace(/[^a-zA-Z]/g, '').toUpperCase();
    const getFactorizationChain = (n) => {
        if (n <= 0 || !Number.isSafeInteger(n)) return [];
        const chain = new Set([n]); let currentNum = n;
        [2, 3].forEach(factor => { while (currentNum % factor === 0) { currentNum /= factor; if (currentNum > 1) chain.add(currentNum); } });
        for (let i = 5; i * i <= currentNum; i += 6) {
            [i, i + 2].forEach(step => { while (currentNum % step === 0) { currentNum /= step; if (currentNum > 1) chain.add(currentNum); } });
        }
        if (currentNum > 1) chain.add(currentNum);
        return Array.from(chain).sort((a, b) => b - a);
    };
    const toBase36 = (n) => {
        if (n === 0) return "0";
        if (!Number.isSafeInteger(n)) return "Too Large";
        const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"; let base36 = "";
        while (n > 0) { base36 = chars[n % 36] + base36; n = Math.floor(n / 36); }
        return base36;
    };
    const decodeBase36Pairs = (b36String) => {
        if (b36String.length < 2) return [];
        const decoded = [];
        for (let i = 0; i < b36String.length - 1; i++) {
            try { decoded.push(parseInt(b36String.substring(i, i + 2), 36)); } catch (e) {}
        }
        return decoded;
    };

    const performAnalysis = async () => {
        const phrase = unfoldInput.value.trim();
        if (!phrase) {
            resultsContainer.innerHTML = '';
            return;
        }

        const cleaned = cleanInput(phrase);
        const letterValues = cleaned.split('').map(c => c.charCodeAt(0) - 64);

        const linearDist = letterValues.slice(1).map((v, i) => v - letterValues[i]);
        const circularDist = letterValues.slice(1).map((v, i) => { let d = v - letterValues[i]; if (d > 13) d -= 26; else if (d < -13) d += 26; return d; });
        const toneMap = letterValues.map(v => ((v - 1) % 7) + 1);
        const toneMapIntStr = toneMap.join('');
        const toneMapB36 = toBase36(parseInt(toneMapIntStr, 10));

        const cipherValues = activeCiphers.map(cipher => {
            if (typeof CIPHERS[cipher] === 'function') return CIPHERS[cipher](cleaned);
            return cleaned.toLowerCase().split('').reduce((sum, char) => sum + (CIPHERS[cipher][char] || 0), 0);
        });

        let initialNumber;
        try { initialNumber = BigInt(cipherValues.join('')); } 
        catch (e) { initialNumber = BigInt(cipherValues.reduce((s, v) => s + v, 0)); }
        
        const factorChain = getFactorizationChain(Number(initialNumber));
        const base36Codes = factorChain.map(toBase36);
        const finalNumbers = new Set(base36Codes.flatMap(decodeBase36Pairs));

        lastUnfoldData = {
            linearDist, circularDist, toneMap, toneMapB36,
            initialNumber: initialNumber.toString(), factorChain, base36Codes,
            finalNumbers: Array.from(finalNumbers).sort((a, b) => a - b)
        };

        displayUnfoldResults();

        if (finalNumbers.size > 0) {
            findDbResonances(Array.from(finalNumbers));
        }
    };

    function displayUnfoldResults() {
        if (!lastUnfoldData) return;
        const data = lastUnfoldData;
        
        let filteredNumbers = data.finalNumbers;
        if (activeFilters.length > 0) {
            filteredNumbers = data.finalNumbers.filter(n => {
                return activeFilters.some(filter => {
                    if (filter === 'prime') return isPrime(n);
                    if (filter === 'square') return isPerfectSquare(n);
                    if (filter === 'palindrome') return isPalindrome(n);
                    if (filter === 'composite') return !isPrime(n) && n > 1;
                    return false;
                });
            });
        }

        const numberSpans = filteredNumbers.map(n => {
            const classes = ['phrase'];
            if (isPrime(n)) classes.push('prime');
            if (isPerfectSquare(n)) classes.push('square');
            if (isPalindrome(n)) classes.push('palindrome');
            if (!isPrime(n) && n > 1) classes.push('composite');
            return `<span class="${classes.join(' ')}">${n}</span>`;
        }).join('');

        resultsContainer.innerHTML = `
            <div class="unfold-card"><h3>Word Mapping</h3><ul><li>Linear Distances: <span class="value">[${data.linearDist.join(', ')}]</span></li><li>Circular Distances: <span class="value">[${data.circularDist.join(', ')}]</span></li><li>Tone Map (1-7): <span class="value">[${data.toneMap.join(', ')}]</span></li><li>Tone Map (Base36): <span class="value">${data.toneMapB36}</span></li></ul></div>
            <div class="unfold-card"><h3>Cosmic Unfolding</h3><p>Initial Number: <span class="value">${data.initialNumber}</span></p><p>Factor Chain: <span class="value">${data.factorChain.join(' -> ')}</span></p><p>Base36 Codes: <span class="value">${data.base36Codes.join(', ')}</span></p></div>
            <div class="unfold-card"><h3>Final Resonance Sequence (${filteredNumbers.length} results)</h3><div class="resonance-list">${numberSpans || 'None'}</div></div>
            <div class="unfold-card" id="db-resonance-card" style="display: none;"><h3>Database Resonances</h3><div id="db-resonance-results"></div></div>
        `;
    }

    async function findDbResonances(numbers) { /* ... unchanged ... */ }

    function updateSettings() {
        const cipherCheckboxes = Array.from(cipherSettings.querySelectorAll('input[type=checkbox]'));
        const checkedCiphers = cipherCheckboxes.filter(cb => cb.checked);
        
        if (checkedCiphers.length > 3) {
            alert('Please select a maximum of 3 ciphers for unfolding.');
            // Find the last one that was checked and uncheck it
            const lastCheckedCipher = activeCiphers.length > 0 ? checkedCiphers.find(cb => !activeCiphers.includes(cb.dataset.cipher)) : checkedCiphers[checkedCiphers.length - 1];
            if (lastCheckedCipher) lastCheckedCipher.checked = false;
        }

        activeCiphers = Array.from(cipherSettings.querySelectorAll('input:checked')).map(cb => cb.dataset.cipher);
        activeFilters = Array.from(filterSettings.querySelectorAll('input:checked')).map(cb => cb.dataset.filter);
        
        if (unfoldInput.value.trim()) {
            if (lastUnfoldData) {
                displayUnfoldResults(); // Re-render with new filters without re-calculating
            } else {
                performAnalysis();
            }
        }
    }

    unfoldInput.addEventListener('input', debounce(performAnalysis, 500));
    cipherSettings.addEventListener('change', updateSettings);
    filterSettings.addEventListener('change', updateSettings);
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
