// --- Firebase Imports ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, getDocs, limit, orderBy, doc, updateDoc, increment, writeBatch, or } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- GEMATRIA LOGIC (Global) ---
const CIPHERS = {};
// Corrected 'Solfege' key
const ALL_CIPHER_KEYS = [
    'Jewish', 'English', 'Simple', 
    'ReverseSimple', 
    'ALW', 'Chaldean',
    'ReverseOrdinal', 'QWERTY', 'Reduction', 'Trigrammaton', 'Baconian', 
    'PhoneKeypad', 'Solfege', 'Zodiac', 'Fibonacci', 'PrimePosition'
];

// --- Helper functions ---
function isPrime(n) {
    if (n <= 1) return false;
    if (n <= 3) return true;
    if (n % 2 === 0 || n % 3 === 0) return false;
    for (let i = 5; i * i <= n; i = i + 6) {
        if (n % i === 0 || n % (i + 2) === 0) return false;
    }
    return true;
}

function buildGematriaTables() {
    const a = 'abcdefghijklmnopqrstuvwxyz'.split('');
    const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    
    CIPHERS.Simple = {};
    CIPHERS.English = {};
    a.forEach((l, i) => {
        CIPHERS.Simple[l] = i + 1;
        CIPHERS.English[l] = (i + 1) * 6;
    });

    const jewishValues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 200, 300, 400, 500, 600, 700, 800];
    CIPHERS.Jewish = {};
    a.forEach((l, i) => CIPHERS.Jewish[l] = jewishValues[i]);

    CIPHERS.ReverseSimple = {};
    a.slice().reverse().forEach((l, i) => { CIPHERS.ReverseSimple[l] = i + 1; });

    const ALW_MAP = {'A': 1, 'B': 20, 'C': 13, 'D': 6, 'E': 25, 'F': 18, 'G': 11, 'H': 4, 'I': 23, 'J': 16, 'K': 9, 'L': 2, 'M': 21, 'N': 14, 'O': 7, 'P': 26, 'Q': 19, 'R': 12, 'S': 5, 'T': 24, 'U': 17, 'V': 10, 'W': 3, 'X': 22, 'Y': 15, 'Z': 8};
    const CHALDEAN_MAP = {'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 8, 'G': 3, 'H': 5, 'I': 1, 'J': 1, 'K': 2, 'L': 3, 'M': 4, 'N': 5, 'O': 7, 'P': 8, 'Q': 1, 'R': 2, 'S': 3, 'T': 4, 'U': 6, 'V': 6, 'W': 6, 'X': 5, 'Y': 1, 'Z': 7};
    const REVERSE_ORDINAL_MAP = {'A': 26, 'B': 25, 'C': 24, 'D': 23, 'E': 22, 'F': 21, 'G': 20, 'H': 19, 'I': 18, 'J': 17, 'K': 16, 'L': 15, 'M': 14, 'N': 13, 'O': 12, 'P': 11, 'Q': 10, 'R': 9, 'S': 8, 'T': 7, 'U': 6, 'V': 5, 'W': 4, 'X': 3, 'Y': 2, 'Z': 1};
    const QWERTY_MAP = {'Q':1, 'W':2, 'E':3, 'R':4, 'T':5, 'Y':6, 'U':7, 'I':8, 'O':9, 'P':10, 'A':11, 'S':12, 'D':13, 'F':14, 'G':15, 'H':16, 'J':17, 'K':18, 'L':19, 'Z':20, 'X':21, 'C':22, 'V':23, 'B':24, 'N':25, 'M':26};
    const TRIGRAM_MAP = {'A': 5, 'B': 20, 'C': 2, 'D': 23, 'E': 13, 'F': 12, 'G': 11, 'H': 3, 'I': 0, 'J': 7, 'K': 17, 'L': 1, 'M': 21, 'N': 24, 'O': 10, 'P': 4, 'Q': 16, 'R': 14, 'S': 15, 'T': 9, 'U': 25, 'V': 22, 'W': 8, 'X': 6, 'Y': 18, 'Z': 19};
    const BACON_MAP = {'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5, 'G': 6, 'H': 7, 'I': 8, 'J': 8, 'K': 9, 'L': 10, 'M': 11, 'N': 12, 'O': 13, 'P': 14, 'Q': 15, 'R': 16, 'S': 17, 'T': 18, 'U': 19, 'V': 19, 'W': 20, 'X': 21, 'Y': 22, 'Z': 23};
    const PHONE_MAP = {'A': 2, 'B': 2, 'C': 2, 'D': 3, 'E': 3, 'F': 3, 'G': 4, 'H': 4, 'I': 4, 'J': 5, 'K': 5, 'L': 5, 'M': 6, 'N': 6, 'O': 6, 'P': 7, 'Q': 7, 'R': 7, 'S': 8, 'T': 8, 'U': 8, 'V': 9, 'W': 9, 'X': 9, 'Y': 9, 'Z': 9};
    const SOLFEGE_MAP = {'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 1, 'I': 2, 'J': 3, 'K': 4, 'L': 5, 'M': 6, 'N': 7, 'O': 1, 'P': 2, 'Q': 3, 'R': 4, 'S': 5, 'T': 6, 'U': 7, 'V': 1, 'W': 2, 'X': 3, 'Y': 4, 'Z': 5};
    const ZODIAC_MAP = {'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8, 'I': 9, 'J': 10, 'K': 11, 'L': 12, 'M': 1, 'N': 2, 'O': 3, 'P': 4, 'Q': 5, 'R': 6, 'S': 7, 'T': 8, 'U': 9, 'V': 10, 'W': 11, 'X': 12, 'Y': 1, 'Z': 2};
    
    const fibSequence = [0, 1];
    while(fibSequence.length < 27) fibSequence.push(fibSequence[fibSequence.length - 1] + fibSequence[fibSequence.length - 2]);
    const FIB_MAP = {};
    A.forEach((L, i) => FIB_MAP[L] = fibSequence[i+1]);

    const primeList = [];
    let num = 2;
    while(primeList.length < 26) { if(isPrime(num)) primeList.push(num); num++; }
    const PRIME_MAP = {};
    A.forEach((L, i) => PRIME_MAP[L] = primeList[i]);

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
    
    A.forEach(L => {
        const l = L.toLowerCase();
        Object.keys(CIPHERS).forEach(key => { if (typeof CIPHERS[key] === 'object' && CIPHERS[key][L]) { CIPHERS[key][l] = CIPHERS[key][L]; } });
    });
}
buildGematriaTables();


// --- Main App Logic ---
document.addEventListener('DOMContentLoaded', async () => {
    if (typeof firebaseConfig === 'undefined') { console.error("Firebase config is not loaded."); return; }
    let db;
    try {
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        await signInAnonymously(auth);
        db = getFirestore(app);
    } catch (error) { console.error("Firebase initialization failed:", error); return; }

    const themeToggle = document.getElementById('theme-toggle');
    const loadTheme = () => {
        const theme = localStorage.getItem('theme') || 'dark';
        document.body.setAttribute('data-theme', theme);
        themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
    };
    const toggleTheme = () => {
        const newTheme = document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    };
    themeToggle.addEventListener('click', toggleTheme);
    loadTheme();

    if (document.getElementById('gematria-input')) initCalculatorPage(db);
    if (document.getElementById('recent-table')) initStatisticsPage(db);
    if (document.getElementById('unfold-input')) initUnfoldPage(db);
});


// --- CALCULATOR PAGE LOGIC ---
function initCalculatorPage(db) {
    const gematriaCollectionRef = collection(db, "gematria-entries");
    const gematriaInput = document.getElementById('gematria-input');
    const resultsSummary = document.getElementById('results-summary');
    const breakdownContainer = document.getElementById('breakdown-container');
    const saveButton = document.getElementById('save-button');
    const dbMatchesContainer = document.getElementById('db-matches-container');
    const cipherSettings = document.getElementById('cipher-settings');
    let currentValues = null;
    let activeCiphers = ['Jewish', 'English', 'Simple', 'Chaldean'];
    const MAX_ACTIVE_CIPHERS = 6;

    // --- Unified Database Search Function ---
    async function findDbMatches(isNumberSearch, valueOrNumber) {
        dbMatchesContainer.innerHTML = '';
        if (activeCiphers.length === 0) return;

        const queryConstraints = activeCiphers
            .filter(cipher => typeof CIPHERS[cipher] !== 'function')
            .map(cipher => {
                const value = isNumberSearch ? valueOrNumber : (currentValues ? currentValues[cipher] : 0);
                if (value) {
                    return where(cipher, "==", value);
                }
                return null;
            }).filter(Boolean); // Filter out nulls if value was 0

        if (queryConstraints.length === 0) return;

        try {
            const q = query(gematriaCollectionRef, or(...queryConstraints), limit(50));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const header = isNumberSearch ? `Matches for ${valueOrNumber}` : 'Matching Phrases';
                displayMatchTable(header, '...', querySnapshot.docs);

                if (!isNumberSearch) {
                    const originalPhrase = gematriaInput.value.trim().toLowerCase();
                    querySnapshot.docs.forEach(doc => {
                        if (doc.data().phrase.toLowerCase() === originalPhrase) {
                            updateDoc(doc.ref, { searchCount: increment(1) });
                        }
                    });
                }
            }
        } catch (error) {
            console.error("Error executing Firestore query: ", error);
            dbMatchesContainer.innerHTML = `<p class="error">Error searching database. Check console for details.</p>`;
        }
    }

    const handleInputChange = () => {
        const input = gematriaInput.value.trim();
        clearResults();
        if (!input) return;
        const isNumberSearch = /^\d+$/.test(input);
        if (isNumberSearch) {
            findDbMatches(true, parseInt(input, 10));
            saveButton.disabled = true;
        } else {
            calculateGematriaForText(input);
            saveButton.disabled = false;
        }
    };
    
    const debouncedHandler = debounce(handleInputChange, 300);

    function clearResults() {
        resultsSummary.innerHTML = ''; breakdownContainer.innerHTML = ''; dbMatchesContainer.innerHTML = '';
        saveButton.disabled = true; currentValues = null;
    }

    function calculateGematriaForText(text) {
        currentValues = {};
        for (const cipher of ALL_CIPHER_KEYS) {
            let total; const breakdown = [];
            if (typeof CIPHERS[cipher] === 'function') {
                total = CIPHERS[cipher](text);
            } else {
                total = 0;
                for (const char of text) {
                    const value = CIPHERS[cipher][char] || 0;
                    if (value > 0) breakdown.push({ letter: char, value });
                    total += value;
                }
            }
            currentValues[cipher] = total;
            if (activeCiphers.includes(cipher)) {
                displayResultCard(cipher, total);
                if (breakdown.length > 0) displayBreakdown(cipher, breakdown);
            }
        }
        findDbMatches(false, null);
    }

    function displayResultCard(cipher, value) {
        const card = document.createElement('div');
        card.className = 'result-card';
        card.innerHTML = `<h3>${escapeHTML(cipher)}</h3><p>${value}</p>`;
        resultsSummary.appendChild(card);
    }

    function displayBreakdown(cipher, breakdown) {
        const container = document.createElement('div');
        container.className = 'breakdown';
        let lettersHtml = breakdown.map(item => `<div class="letter-value"><span class="letter">${escapeHTML(item.letter)}</span><span class="value">${item.value}</span></div>`).join('');
        container.innerHTML = `<div class="breakdown-title">${escapeHTML(cipher)} Breakdown</div><div class="breakdown-letters">${lettersHtml}</div>`;
        breakdownContainer.appendChild(container);
    }

    function displayMatchTable(title, value, docs) {
        const container = document.createElement('div');
        container.className = 'match-table-container';
        let rows = docs.map(doc => {
            const data = doc.data();
            return `<tr><td>${escapeHTML(data.phrase)}</td>${activeCiphers.map(c => `<td>${data[c] || 0}</td>`).join('')}</tr>`;
        }).join('');
        const headerText = value === '...' ? title : `${title} = ${value}`;
        container.innerHTML = `<h3>${escapeHTML(headerText)}</h3><div class="table-container"><table class="match-table"><thead><tr><th>Phrase</th>${activeCiphers.map(c => `<th>${escapeHTML(c)}</th>`).join('')}</tr></thead><tbody class="match-table-body">${rows}</tbody></table></div>`;
        dbMatchesContainer.appendChild(container);
    }
    
    function updateActiveCiphers() {
        const checkboxes = cipherSettings.querySelectorAll('input[type="checkbox"]');
        activeCiphers = Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.dataset.cipher);
        if (activeCiphers.length > MAX_ACTIVE_CIPHERS) {
            const lastChecked = activeCiphers.pop();
            checkboxes.forEach(cb => { if(cb.dataset.cipher === lastChecked) cb.checked = false; });
            alert(`You can only select up to ${MAX_ACTIVE_CIPHERS} ciphers.`);
        }
        checkboxes.forEach(cb => {
            const label = cb.parentElement;
            cb.disabled = activeCiphers.length >= MAX_ACTIVE_CIPHERS && !cb.checked;
            label.classList.toggle('disabled', cb.disabled);
        });
        handleInputChange();
    }

    async function saveToDatabase() { /* ... unchanged ... */ }
    
    gematriaInput.addEventListener('input', debouncedHandler);
    saveButton.addEventListener('click', saveToDatabase);
    cipherSettings.addEventListener('change', updateActiveCiphers);
    updateActiveCiphers();
}


// --- STATISTICS PAGE LOGIC ---
function initStatisticsPage(db) { /* ... unchanged ... */ }


// --- UNFOLD PAGE LOGIC ---
function initUnfoldPage(db) {
    const unfoldInput = document.getElementById('unfold-input');
    const resultsContainer = document.getElementById('unfold-results-container');
    const gematriaCollectionRef = collection(db, "gematria-entries");

    const cleanInput = (text) => text.replace(/[^a-zA-Z]/g, '').toUpperCase();

    const getFactorizationChain = (n) => {
        if (n <= 0) return [];
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
        resultsContainer.innerHTML = '';
        if (!phrase) return;

        const cleaned = cleanInput(phrase);
        const letterValues = cleaned.split('').map(c => c.charCodeAt(0) - 64);

        const linearDist = letterValues.slice(1).map((v, i) => v - letterValues[i]);
        const circularDist = letterValues.slice(1).map((v, i) => {
            let diff = v - letterValues[i];
            if (diff > 13) diff -= 26; else if (diff < -13) diff += 26;
            return diff;
        });
        const toneMap = letterValues.map(v => ((v - 1) % 7) + 1);
        const toneMapIntStr = toneMap.join('');
        const toneMapB36 = toBase36(parseInt(toneMapIntStr, 10));

        const sGematria = cleaned.toLowerCase().split('').reduce((sum, char) => sum + (CIPHERS.Simple[char] || 0), 0);
        const eGematria = sGematria * 6;
        const jGematria = cleaned.toLowerCase().split('').reduce((sum, char) => sum + (CIPHERS.Jewish[char] || 0), 0);
        
        let initialNumber;
        try { initialNumber = BigInt(`${jGematria}${eGematria}${sGematria}`); } 
        catch(e) { initialNumber = BigInt(jGematria + eGematria + sGematria); }
        
        const factorChain = getFactorizationChain(Number(initialNumber));
        const base36Codes = factorChain.map(toBase36);
        const finalNumbers = new Set(base36Codes.flatMap(decodeBase36Pairs));

        displayUnfoldResults({
            linearDist, circularDist, toneMap, toneMapB36,
            initialNumber: initialNumber.toString(), factorChain, base36Codes,
            finalNumbers: Array.from(finalNumbers).sort((a, b) => a - b)
        });

        if (finalNumbers.size > 0) {
            findDbResonances(Array.from(finalNumbers));
        }
    };

    function displayUnfoldResults(data) { /* ... unchanged ... */ }
    async function findDbResonances(numbers) { /* ... unchanged ... */ }

    unfoldInput.addEventListener('input', debounce(performAnalysis, 500));
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
    return str.replace(/[&<>"']/g, match => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'})[match]);
}
