// --- Firebase Imports ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, getDocs, limit } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- GLOBAL STATE & CONSTANTS ---
const CIPHERS = {};

// --- NUMBER ANALYSIS HELPERS ---
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
function recursiveDigitSum(n) {
    let val = Math.abs(Math.round(n));
    while (val > 9) {
        val = String(val).split('').reduce((sum, digit) => sum + parseInt(digit, 10), 0);
    }
    return val;
}

// --- TESLA-INSPIRED GEMATRIA CIPHER DEFINITIONS ---
function buildTeslaCiphers() {
    const a = 'abcdefghijklmnopqrstuvwxyz';
    const calculateWithMap = (text, map) => text.toLowerCase().split('').reduce((sum, char) => sum + (map[char] || 0), 0);

    // 1. Tesla Triad Gematria
    const teslaTriadMap = {};
    const triadValues = [3, 6, 9];
    a.split('').forEach((l, i) => { teslaTriadMap[l] = triadValues[i % 3]; });
    CIPHERS['TeslaTriad'] = (text) => calculateWithMap(text, teslaTriadMap);
    CIPHERS['TeslaTriadRoot'] = (text) => recursiveDigitSum(CIPHERS.TeslaTriad(text));

    // 2. Tesla Frequency Gematria
    const teslaFrequencyMap = {};
    const freqValues = [24, 48, 72]; // 8Hz * (3, 6, 9)
    a.split('').forEach((l, i) => { teslaFrequencyMap[l] = freqValues[i % 3]; });
    CIPHERS['TeslaFrequency'] = (text) => calculateWithMap(text, teslaFrequencyMap);
    CIPHERS['TeslaFrequencyQuotient'] = (text) => Math.round(CIPHERS.TeslaFrequency(text) / 8);

    // 3. Tesla Patent Gematria
    const teslaPatentMap = {};
    a.split('').forEach((l, i) => { teslaPatentMap[l] = (i % 22) + 1; });
    CIPHERS['TeslaPatent'] = (text) => calculateWithMap(text, teslaPatentMap);
    CIPHERS['TeslaPatentCipher'] = (text) => CIPHERS.TeslaPatent(text) % 22;
}
buildTeslaCiphers();

// --- MAIN APP LOGIC ---
document.addEventListener('DOMContentLoaded', async () => {
    let db;
    try {
        if (typeof firebaseConfig === 'undefined') {
            console.error("Firebase config is not loaded. Make sure firebase-config.js is present and correct.");
            return;
        }
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        await signInAnonymously(auth);
        db = getFirestore(app);
        initCalculatorPage(db);
    } catch (error) {
        console.error("Firebase initialization failed:", error);
    }
});

// --- CALCULATOR PAGE LOGIC ---
function initCalculatorPage(db) {
    const gematriaCollectionRef = collection(db, "tesla-gematria-entries");
    const gematriaInput = document.getElementById('gematria-input');
    const resultsSummary = document.getElementById('results-summary');
    const dbMatchesContainer = document.getElementById('db-matches-container');
    const cipherSettings = document.getElementById('cipher-settings');
    const saveButton = document.getElementById('save-button');

    let currentValues = null;

    // Dynamically populate cipher settings
    cipherSettings.innerHTML = '';
    Object.keys(CIPHERS).sort().forEach(key => {
        const label = document.createElement('label');
        label.innerHTML = `<input type="checkbox" data-cipher="${key}" checked> ${key}`;
        cipherSettings.appendChild(label);
    });

    const handleInputChange = () => {
        const input = gematriaInput.value.trim();
        if (!input) {
            clearResults();
            saveButton.disabled = true;
            return;
        }
        calculateGematriaForText(input);
        saveButton.disabled = false;
    };
    
    const debouncedHandler = debounce(handleInputChange, 300);

    function clearResults() {
        resultsSummary.innerHTML = ''; 
        dbMatchesContainer.innerHTML = '';
        currentValues = null;
    }

    function calculateGematriaForText(text) {
        currentValues = {};
        const activeCiphers = Array.from(cipherSettings.querySelectorAll('input:checked')).map(cb => cb.dataset.cipher);
        
        resultsSummary.innerHTML = '';
        activeCiphers.forEach(cipher => {
            const value = CIPHERS[cipher](text);
            currentValues[cipher] = value;
            displayResultCard(cipher, value);
        });
        
        fetchAndDisplayMatches();
    }

    async function fetchAndDisplayMatches() {
        if (!currentValues) return;
        dbMatchesContainer.innerHTML = 'Searching for resonance...';
        
        const activeCiphers = Object.keys(currentValues);
        let matchesFound = false;

        const queryPromises = activeCiphers.map(cipher => {
            const value = currentValues[cipher];
            if (value > 0) {
                const q = query(gematriaCollectionRef, where(cipher, "==", value), limit(20));
                return getDocs(q).then(snapshot => ({ cipher, snapshot, value }));
            }
            return Promise.resolve(null);
        });

        const results = await Promise.all(queryPromises);
        dbMatchesContainer.innerHTML = '';

        results.forEach(result => {
            if (result && !result.snapshot.empty) {
                matchesFound = true;
                const phrasesData = result.snapshot.docs.map(doc => doc.data());
                renderTable(result.cipher, phrasesData, result.value);
            }
        });

        if (!matchesFound) {
            dbMatchesContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No resonant phrases found in the database.</p>';
        }
    }

    function renderTable(cipher, phrasesData, value) {
        const valueClasses = ['value'];
        if (isPrime(value)) valueClasses.push('prime');
        if (isPerfectSquare(value)) valueClasses.push('square');
        if (isPalindrome(value)) valueClasses.push('palindrome');
        if (!isPrime(value) && value > 1) valueClasses.push('composite');

        const tableRows = phrasesData
            .filter(data => data.phrase.toLowerCase() !== gematriaInput.value.trim().toLowerCase())
            .map(data => `<tr><td>${escapeHTML(data.phrase)}</td></tr>`)
            .join('');

        if (!tableRows) return;

        const tableHtml = `
            <details class="match-table-container" open>
                <summary>${escapeHTML(cipher)} = <span class="${valueClasses.join(' ')}">${value}</span></summary>
                <table class="match-table">
                    <tbody>${tableRows}</tbody>
                </table>
            </details>
        `;
        dbMatchesContainer.innerHTML += tableHtml;
    }

    function displayResultCard(cipher, value) {
        const card = document.createElement('div');
        card.className = 'result-card-summary';
        card.innerHTML = `<span class="cipher-name">${escapeHTML(cipher)}:</span><span class="cipher-value">${value}</span>`;
        resultsSummary.appendChild(card);
    }

    async function saveToDatabase() {
        const phrase = gematriaInput.value.trim();
        if (!phrase || !currentValues) return;
        
        saveButton.disabled = true;
        saveButton.textContent = 'Checking...';

        // Case-insensitive check for duplicates
        const lowerCasePhrase = phrase.toLowerCase();
        const q = query(gematriaCollectionRef, where("lowerCasePhrase", "==", lowerCasePhrase), limit(1));
        const existingDocs = await getDocs(q);

        if (!existingDocs.empty) {
            saveButton.textContent = 'Already Exists';
            setTimeout(() => {
                saveButton.textContent = 'Save to Database';
                if (gematriaInput.value.trim()) saveButton.disabled = false;
            }, 2000);
            return;
        }

        saveButton.textContent = 'Saving...';
        try {
            const dataToSave = { 
                phrase, 
                lowerCasePhrase,
                createdAt: new Date(), 
                ...currentValues 
            };
            await addDoc(gematriaCollectionRef, dataToSave);
            saveButton.textContent = 'Saved!';
            setTimeout(() => {
                saveButton.textContent = 'Save to Database';
                if (gematriaInput.value.trim()) saveButton.disabled = false;
            }, 2000);
            fetchAndDisplayMatches();
        } catch (error) {
            console.error("Error adding document: ", error);
            saveButton.textContent = 'Error!';
            setTimeout(() => {
                saveButton.textContent = 'Save to Database';
                if (gematriaInput.value.trim()) saveButton.disabled = false;
            }, 2000);
        }
    }
    
    gematriaInput.addEventListener('input', debouncedHandler);
    saveButton.addEventListener('click', saveToDatabase);
    cipherSettings.addEventListener('change', handleInputChange);
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
