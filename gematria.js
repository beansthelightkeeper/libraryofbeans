// --- Firebase Imports ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, getDocs, limit, orderBy, doc, updateDoc, increment, writeBatch, or } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- GLOBAL STATE & CONSTANTS ---
const CIPHERS = {};
const PHI = 1.618033988749895;

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

// --- GEMATRIA CIPHER DEFINITIONS ---
function buildGematriaCiphers() {
    const a = 'abcdefghijklmnopqrstuvwxyz';
    const simpleMap = {};
    a.split('').forEach((l, i) => { simpleMap[l] = i + 1; });

    const jewishValues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 200, 300, 400, 500, 600, 700, 800];
    const jewishMap = {};
    a.split('').forEach((l, i) => { jewishMap[l] = jewishValues[i]; });

    const chaldeanMap = {a:1,b:2,c:3,d:4,e:5,f:8,g:3,h:5,i:1,j:1,k:2,l:3,m:4,n:5,o:7,p:8,q:1,r:2,s:3,t:4,u:6,v:6,w:6,x:5,y:1,z:7};
    const alwMap = {a:1,l:2,w:3,h:4,s:5,d:6,o:7,z:8,k:9,v:10,g:11,r:12,c:13,n:14,y:15,j:16,u:17,f:18,q:19,b:20,m:21,x:22,i:23,t:24,e:25,p:26};
    const trigrammatonMap = {l:1,c:2,h:3,p:4,a:5,x:6,j:7,w:8,t:9,o:10,g:11,f:12,e:13,r:14,s:15,q:16,k:17,y:18,z:19,b:20,m:21,v:22,d:23,n:24,u:25,i:0};
    const baconianMap = {a:0,b:1,c:2,d:3,e:4,f:5,g:6,h:7,i:8,j:8,k:9,l:10,m:11,n:12,o:13,p:14,q:15,r:16,s:17,t:18,u:19,v:19,w:20,x:21,y:22,z:23};
    const sumerianMap = {};
    a.split('').forEach((l, i) => { sumerianMap[l] = 6 * (i + 1); });
    const phoneMap = {a:2,b:2,c:2,d:3,e:3,f:3,g:4,h:4,i:4,j:5,k:5,l:5,m:6,n:6,o:6,p:7,q:7,r:7,s:7,t:8,u:8,v:8,w:9,x:9,y:9,z:9};
    const qwertyMap = {q:1,w:2,e:3,r:4,t:5,y:6,u:7,i:8,o:9,p:10,a:11,s:12,d:13,f:14,g:15,h:16,j:17,k:18,l:19,z:20,x:21,c:22,v:23,b:24,n:25,m:26};

    const calculateWithMap = (text, map) => text.toLowerCase().split('').reduce((sum, char) => sum + (map[char] || 0), 0);
    
    // --- CORE CIPHERS ---
    CIPHERS['Simple'] = (text) => calculateWithMap(text, simpleMap);
    CIPHERS['English'] = (text) => CIPHERS.Simple(text) * 6;
    CIPHERS['Jewish'] = (text) => calculateWithMap(text, jewishMap);
    CIPHERS['Chaldean'] = (text) => calculateWithMap(text, chaldeanMap);
    CIPHERS['ALW'] = (text) => calculateWithMap(text, alwMap);
    CIPHERS['Trigrammaton'] = (text) => calculateWithMap(text, trigrammatonMap);
    CIPHERS['Baconian'] = (text) => calculateWithMap(text, baconianMap);
    CIPHERS['Sumerian'] = (text) => calculateWithMap(text, sumerianMap);
    CIPHERS['PhoneKeypad'] = (text) => calculateWithMap(text, phoneMap);
    CIPHERS['QWERTY'] = (text) => calculateWithMap(text, qwertyMap);
    CIPHERS['ASCII'] = (text) => text.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    CIPHERS['BinarySum'] = (text) => text.split('').reduce((sum, char) => sum + char.charCodeAt(0).toString(2).split('1').length - 1, 0);
    CIPHERS['Reduction'] = (text) => recursiveDigitSum(CIPHERS.Simple(text));
    CIPHERS['SyllableResonance'] = (text) => {
        const cleaned = text.toLowerCase().replace(/[^a-z]/g, '');
        if (!cleaned) return 0;
        const syllableCount = (cleaned.match(/[aeiouy]{1,2}/g) || []).length;
        return CIPHERS.Simple(text) * Math.max(1, syllableCount);
    };
    
    // --- REVERSE CIPHERS ---
    const reverse = (text) => text.split('').reverse().join('');
    CIPHERS['ReverseSimple'] = (text) => CIPHERS.Simple(reverse(text));
    CIPHERS['ReverseEnglish'] = (text) => CIPHERS.English(reverse(text));
    CIPHERS['ReverseJewish'] = (text) => CIPHERS.Jewish(reverse(text));

    // --- COMPLEX & META CIPHERS ---
    CIPHERS['GeminiResonance'] = (text) => {
        const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101];
        let total = 1;
        text.toLowerCase().split('').forEach((char, i) => {
            if ('a' <= char && char <= 'z') { total += primes[char.charCodeAt(0) - 97] * (i + 1); }
        });
        return (total % 997) + text.length;
    };
    CIPHERS['LawOf6'] = (text) => {
        const len = text.replace(/[^a-zA-Z]/g, '').length;
        let val = 6;
        for (let i = 0; i < 3; i++) { val = val * 2 + 6; }
        return val * len;
    };
    CIPHERS['DoublingVortex'] = (text) => {
        let val = 6.0;
        for (const char of text.replace(/[^a-zA-Z]/g, '')) {
            val = (val * 2 * PHI) + 6.0;
        }
        return Math.round(val);
    };
}
buildGematriaCiphers();

// --- MAIN APP LOGIC ---
document.addEventListener('DOMContentLoaded', async () => {
    let db;
    try {
        if (typeof firebaseConfig === 'undefined') throw new Error("Firebase config is not loaded.");
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        await signInAnonymously(auth);
        db = getFirestore(app);
    } catch (error) { console.error("Firebase initialization failed:", error); return; }
    
    const page = window.location.pathname.split("/").pop();
    if (page === 'gematria.html' || page === '') initCalculatorPage(db);
    // Add initializers for other pages here if they exist
});


// --- CALCULATOR PAGE LOGIC ---
function initCalculatorPage(db) {
    const gematriaCollectionRef = collection(db, "gematria-entries");
    const gematriaInput = document.getElementById('gematria-input');
    const resultsSummary = document.getElementById('results-summary');
    const breakdownContainer = document.getElementById('breakdown-container');
    const dbMatchesContainer = document.getElementById('db-matches-container');
    const cipherSettings = document.getElementById('cipher-settings');
    const filterSettings = document.getElementById('filter-settings');
    const saveButton = document.getElementById('save-button');
    const modal = document.getElementById('resonance-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const modalClose = modal.querySelector('.modal-close-button');

    let currentValues = null;
    let activeFilters = [];

    // Dynamically populate cipher settings
    cipherSettings.innerHTML = '<p class="settings-info">Select Ciphers for Resonance Report</p>';
    Object.keys(CIPHERS).sort().forEach(key => {
        const isChecked = ['Simple', 'English', 'Jewish', 'Chaldean', 'GeminiResonance'].includes(key);
        const label = document.createElement('label');
        label.innerHTML = `<input type="checkbox" data-cipher="${key}" ${isChecked ? 'checked' : ''}> ${key}`;
        cipherSettings.appendChild(label);
    });

    const handleInputChange = () => {
        const input = gematriaInput.value.trim();
        clearResults();
        if (!input) {
            saveButton.disabled = true;
            return;
        }
        const isNumberSearch = /^\d+$/.test(input);
        if (isNumberSearch) {
            fetchAndDisplayMatches(true, parseInt(input, 10));
            saveButton.disabled = true;
        } else {
            calculateGematriaForText(input);
            saveButton.disabled = false;
        }
    };
    
    const debouncedHandler = debounce(handleInputChange, 300);

    function clearResults() {
        resultsSummary.innerHTML = ''; 
        breakdownContainer.innerHTML = '';
        dbMatchesContainer.innerHTML = '';
        currentValues = null;
    }

    function calculateGematriaForText(text) {
        currentValues = {};
        Object.keys(CIPHERS).forEach(cipher => {
            currentValues[cipher] = CIPHERS[cipher](text);
        });

        const summaryCiphers = ['Simple', 'English', 'Jewish', 'GeminiResonance', 'LawOf6'];
        resultsSummary.innerHTML = '';
        summaryCiphers.forEach(cipher => {
            if (currentValues.hasOwnProperty(cipher)) {
                displayResultCard(cipher, currentValues[cipher]);
            }
        });
        
        displayBreakdown('Simple', text, currentValues['Simple']);
        fetchAndDisplayMatches(false);
    }

    async function fetchAndDisplayMatches(isNumberSearch, number = 0) {
        dbMatchesContainer.innerHTML = 'Loading matches...';
        const ciphersToFetch = ['Jewish', 'Simple'];
        
        const queries = ciphersToFetch.map(cipher => {
            const value = isNumberSearch ? number : currentValues[cipher];
            if (value > 0) {
                let q = query(gematriaCollectionRef, where(cipher, "==", value), limit(50));
                return getDocs(q);
            }
            return Promise.resolve(null);
        });

        const snapshots = await Promise.all(queries);
        dbMatchesContainer.innerHTML = '';
        snapshots.forEach((snapshot, index) => {
            const cipher = ciphersToFetch[index];
            const value = isNumberSearch ? number : currentValues[cipher];
            if (snapshot && !snapshot.empty) {
                const phrasesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                renderTable(cipher, phrasesData, value);
            }
        });
    }

    function renderTable(cipher, phrasesData, value) {
        const valueClasses = ['value'];
        if (isPrime(value)) valueClasses.push('prime');
        if (isPerfectSquare(value)) valueClasses.push('square');
        if (isPalindrome(value)) valueClasses.push('palindrome');
        if (!isPrime(value) && value > 1) valueClasses.push('composite');

        const tableRows = phrasesData.map(data => `
            <tr data-phrase="${escapeHTML(data.phrase)}">
                <td class="phrase-col">${escapeHTML(data.phrase)}</td>
                <td class="number-col">${data.searchCount || 0}</td>
            </tr>`).join('');

        const tableHtml = `
            <details class="match-table-container" open>
                <summary>${escapeHTML(cipher)} = <span class="${valueClasses.join(' ')}">${value}</span> (${phrasesData.length} matches)</summary>
                <table class="match-table">
                    <thead><tr><th class="phrase-col">Phrase</th><th class="number-col">Searches</th></tr></thead>
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
    
    function displayBreakdown(cipher, text, total) {
        const breakdownHtml = text.toLowerCase().split('').map(char => {
            const value = CIPHERS[cipher](char);
            return `<span class="breakdown-letter"><span class="char">${escapeHTML(char)}</span><span class="val">${value}</span></span>`;
        }).join('');
        const line = document.createElement('div');
        line.className = 'breakdown-line';
        line.innerHTML = `<b>${escapeHTML(text)}</b> in ${escapeHTML(cipher)} equals <strong>${total}</strong>: ${breakdownHtml}`;
        breakdownContainer.appendChild(line);
    }

    async function saveToDatabase() {
        const phrase = gematriaInput.value.trim();
        if (!phrase || !currentValues) return;
        saveButton.disabled = true;
        saveButton.textContent = 'Saving...';
        try {
            const dataToSave = { phrase, createdAt: new Date(), searchCount: 0, ...currentValues };
            await addDoc(gematriaCollectionRef, dataToSave);
            saveButton.textContent = 'Saved!';
            setTimeout(() => { saveButton.textContent = 'Save'; if (gematriaInput.value.trim()) saveButton.disabled = false; }, 2000);
            fetchAndDisplayMatches(false);
        } catch (error) {
            console.error("Error adding document: ", error);
            saveButton.textContent = 'Error!';
            setTimeout(() => { saveButton.textContent = 'Save'; if (gematriaInput.value.trim()) saveButton.disabled = false; }, 2000);
        }
    }

    async function showResonanceReport(phrase) {
        modalTitle.textContent = `Resonance Report for "${phrase}"`;
        modalBody.innerHTML = 'Loading...';
        modal.style.display = 'flex';

        const reportCiphers = Array.from(cipherSettings.querySelectorAll('input:checked')).map(cb => cb.dataset.cipher);
        let reportHtml = '';

        for (const cipher of reportCiphers) {
            const value = CIPHERS[cipher](phrase);
            const q = query(gematriaCollectionRef, where(cipher, "==", value), limit(3));
            const snapshot = await getDocs(q);
            const matches = snapshot.docs
                .map(doc => doc.data().phrase)
                .filter(p => p.toLowerCase() !== phrase.toLowerCase())
                .slice(0, 2);

            reportHtml += `
                <div class="resonance-item">
                    <span class="cipher-name">${escapeHTML(cipher)}:</span>
                    <span class="cipher-value">${value}</span>
                    <span class="matches">${matches.length > 0 ? `(resonates with: ${matches.map(escapeHTML).join(', ')})` : '(no other matches found)'}</span>
                </div>
            `;
        }
        modalBody.innerHTML = reportHtml;
    }

    dbMatchesContainer.addEventListener('click', (e) => {
        const row = e.target.closest('tr');
        if (row && row.dataset.phrase) {
            showResonanceReport(row.dataset.phrase);
        }
    });

    modalClose.addEventListener('click', () => modal.style.display = 'none');
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });
    
    gematriaInput.addEventListener('input', debouncedHandler);
    saveButton.addEventListener('click', saveToDatabase);
    cipherSettings.addEventListener('change', handleInputChange);
    filterSettings.addEventListener('change', handleInputChange);
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
