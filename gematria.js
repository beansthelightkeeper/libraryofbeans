// --- Firebase Imports ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, getDocs, limit, writeBatch, or, doc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

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

// --- THEME MANAGEMENT ---
const ICONS = {
    sun: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`,
    moon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`
};

function applyTheme(theme, themeToggleButton) {
    document.body.dataset.theme = theme;
    themeToggleButton.innerHTML = theme === 'dark' ? ICONS.sun : ICONS.moon;
    localStorage.setItem('gematria-theme', theme);
}

function toggleTheme(themeToggleButton) {
    const currentTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(currentTheme, themeToggleButton);
}

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
});


// --- CALCULATOR PAGE LOGIC ---
function initCalculatorPage(db) {
    const gematriaCollectionRef = collection(db, "entries");
    const gematriaInput = document.getElementById('gematria-input');
    const resultsSummary = document.getElementById('results-summary');
    const breakdownContainer = document.getElementById('breakdown-container');
    const dbMatchesContainer = document.getElementById('db-matches-container');
    const cipherSettings = document.getElementById('cipher-settings');
    const filterSettings = document.getElementById('filter-settings');
    const saveButton = document.getElementById('save-button');
    const themeToggleButton = document.getElementById('theme-toggle');
    const modal = document.getElementById('resonance-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const modalClose = modal.querySelector('.modal-close-button');
    const fileInput = document.getElementById('file-input');
    const uploadButton = document.getElementById('upload-button');
    const uploadStatus = document.getElementById('upload-status');

    let currentValues = null;

    // --- Initialize Theme ---
    const savedTheme = localStorage.getItem('gematria-theme') || 'dark';
    applyTheme(savedTheme, themeToggleButton);
    themeToggleButton.addEventListener('click', () => toggleTheme(themeToggleButton));

    // --- Dynamically populate cipher settings ---
    cipherSettings.innerHTML = '<p class="settings-info">Select Ciphers for Calculation & Matching</p>';
    Object.keys(CIPHERS).sort().forEach(key => {
        const isChecked = ['Simple', 'English', 'Jewish', 'Chaldean', 'ReverseSimple'].includes(key);
        const label = document.createElement('label');
        label.innerHTML = `<input type="checkbox" data-cipher="${key}" ${isChecked ? 'checked' : ''}> ${key}`;
        cipherSettings.appendChild(label);
    });

    const getSelectedCiphers = () => Array.from(cipherSettings.querySelectorAll('input:checked')).map(cb => cb.dataset.cipher);

    const handleInputChange = () => {
        const input = gematriaInput.value.trim();
        clearResults();
        if (!input) {
            saveButton.disabled = true;
            return;
        }
        const isNumberSearch = /^\d+$/.test(input);
        if (isNumberSearch) {
            fetchAndDisplayMatchesForNumber(parseInt(input, 10));
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
        const lowerCaseText = text.toLowerCase();
        const selectedCiphers = getSelectedCiphers();

        if (selectedCiphers.length === 0) {
            resultsSummary.innerHTML = 'Please select at least one cipher in Settings.';
            return;
        }

        selectedCiphers.forEach(cipher => {
            currentValues[cipher] = CIPHERS[cipher](lowerCaseText);
        });

        resultsSummary.innerHTML = '';
        breakdownContainer.innerHTML = '';
        
        selectedCiphers.forEach(cipher => {
            displayResultCard(cipher, currentValues[cipher]);
            displayBreakdown(cipher, text, currentValues[cipher]);
        });
        
        fetchAndDisplayMatchesForText();
    }
    
    async function fetchAndDisplayMatchesForText() {
        if (!currentValues) return;
        const selectedCiphers = getSelectedCiphers();
        if (selectedCiphers.length === 0) return;

        dbMatchesContainer.innerHTML = 'Loading matches...';

        // Create an "OR" query in Firestore
        const constraints = selectedCiphers.map(cipher => where(cipher, "==", currentValues[cipher])).filter(Boolean);
        if (constraints.length === 0) {
             dbMatchesContainer.innerHTML = '';
             return;
        }
        
        const q = query(gematriaCollectionRef, or(...constraints), limit(50));
        
        try {
            const querySnapshot = await getDocs(q);
            dbMatchesContainer.innerHTML = '';
            if (querySnapshot.empty) {
                dbMatchesContainer.innerHTML = '<p>No matches found in the database.</p>';
                return;
            }
            
            // Group phrases by their calculated value for each cipher
            const groupedMatches = {};
            selectedCiphers.forEach(cipher => {
                const value = currentValues[cipher];
                if (!groupedMatches[value]) groupedMatches[value] = { phrases: new Set(), ciphers: [] };
                groupedMatches[value].ciphers.push(cipher);
                
                querySnapshot.docs.forEach(doc => {
                    const data = doc.data();
                    if(data[cipher] === value) {
                        groupedMatches[value].phrases.add(data.phrase);
                    }
                });
            });

            for (const value in groupedMatches) {
                if (groupedMatches[value].phrases.size > 0) {
                    const phrasesData = Array.from(groupedMatches[value].phrases).map(p => ({phrase: p}));
                    renderTable(groupedMatches[value].ciphers.join(' / '), phrasesData, value);
                }
            }

        } catch (error) {
            console.error("Error fetching matches:", error);
            dbMatchesContainer.innerHTML = '<p class="error">Error fetching matches from database.</p>';
        }
    }

    async function fetchAndDisplayMatchesForNumber(number) {
        dbMatchesContainer.innerHTML = `Loading matches for value ${number}...`;
        const selectedCiphers = getSelectedCiphers();
        if (selectedCiphers.length === 0) {
            dbMatchesContainer.innerHTML = 'Please select at least one cipher in Settings.';
            return;
        };

        const constraints = selectedCiphers.map(cipher => where(cipher, "==", number));
        const q = query(gematriaCollectionRef, or(...constraints), limit(50));

        try {
            const querySnapshot = await getDocs(q);
            dbMatchesContainer.innerHTML = '';
             if (querySnapshot.empty) {
                dbMatchesContainer.innerHTML = `<p>No matches found for the value ${number}.</p>`;
                return;
            }
            const phrases = querySnapshot.docs.map(doc => ({phrase: doc.data().phrase}));
            renderTable(`Value`, phrases, number);

        } catch (error) {
            console.error("Error fetching matches:", error);
            dbMatchesContainer.innerHTML = `<p class="error">Error fetching matches for value ${number}.</p>`;
        }
    }


    function renderTable(cipherDisplay, phrasesData, value) {
        const valueClasses = ['value'];
        if (isPrime(value)) valueClasses.push('prime');
        if (isPerfectSquare(value)) valueClasses.push('square');
        if (isPalindrome(value)) valueClasses.push('palindrome');
        if (!isPrime(value) && value > 1) valueClasses.push('composite');

        const uniquePhrases = [...new Set(phrasesData.map(d => d.phrase))];

        const tableRows = uniquePhrases.map(phrase => `
            <tr data-phrase="${escapeHTML(phrase)}">
                <td class="phrase-col">${escapeHTML(phrase)}</td>
            </tr>`).join('');

        const tableHtml = `
            <details class="match-table-container" open>
                <summary>${escapeHTML(cipherDisplay)} = <span class="${valueClasses.join(' ')}">${value}</span> (${uniquePhrases.length} matches)</summary>
                <table class="match-table">
                    <thead><tr><th class="phrase-col">Phrase</th></tr></thead>
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
            if (char === ' ') return ' ';
            // This is a simplified breakdown; a real one would need the specific map.
            // We'll use the 'Simple' value for visualization purposes as it's the most intuitive.
            const value = CIPHERS['Simple'](char); 
            return `<span class="breakdown-letter"><span class="char">${escapeHTML(char)}</span><span class="val">${value}</span></span>`;
        }).join('+').replace(/\+ \+/g, '+'); // Clean up spaces
        
        const line = document.createElement('div');
        line.className = 'breakdown-line';
        line.innerHTML = `<b>${escapeHTML(cipher)} for "${escapeHTML(text)}"</b> (${total}): ${breakdownHtml}`;
        breakdownContainer.appendChild(line);
    }

    async function saveToDatabase() {
        const phrase = gematriaInput.value.trim().toLowerCase();
        if (!phrase) return;
        saveButton.disabled = true;
        saveButton.textContent = 'Checking...';

        try {
            const q = query(gematriaCollectionRef, where("phrase", "==", phrase));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                saveButton.textContent = 'Exists!';
            } else {
                saveButton.textContent = 'Saving...';
                // Recalculate all ciphers, not just selected, for a complete DB entry
                const allCipherValues = {};
                 Object.keys(CIPHERS).forEach(cipher => {
                    allCipherValues[cipher] = CIPHERS[cipher](phrase);
                });

                const dataToSave = { phrase, createdAt: new Date(), searchCount: 1, ...allCipherValues };
                await addDoc(gematriaCollectionRef, dataToSave);
                saveButton.textContent = 'Saved!';
                fetchAndDisplayMatchesForText(); // Refresh matches
            }
        } catch (error) {
            console.error("Error with database operation: ", error);
            saveButton.textContent = 'Error!';
        } finally {
            setTimeout(() => { 
                saveButton.textContent = 'Save'; 
                if (gematriaInput.value.trim()) saveButton.disabled = false; 
            }, 2000);
        }
    }
    
     async function processAndUploadFile() {
        const file = fileInput.files[0];
        if (!file) {
            uploadStatus.textContent = "Please select a file first.";
            return;
        }

        uploadStatus.textContent = "Reading file...";
        const reader = new FileReader();
        reader.onload = async (event) => {
            const content = event.target.result;
            
            // 1. Remove numbers and split by punctuation and newlines
            const phrases = content
                .replace(/[0-9]/g, '') // Remove all numbers
                .split(/[.?!;,\n\r]+/) // Split by common punctuation and newlines
                .map(phrase => phrase.trim()) // Trim whitespace from each potential phrase
                .filter(phrase => phrase.length > 1); // Filter out empty or single-character strings

            uploadStatus.textContent = `Found ${phrases.length} potential phrases. Processing...`;

            if (phrases.length === 0) {
                uploadStatus.textContent = "File contains no valid phrases after cleaning.";
                return;
            }

            const batchSize = 400;
            let batch = writeBatch(db);
            let entriesInBatch = 0;
            let batchesCommitted = 0;
            
            for (let i = 0; i < phrases.length; i++) {
                const phrase = phrases[i].toLowerCase();
                if (!phrase) continue;

                const allCipherValues = {};
                Object.keys(CIPHERS).forEach(cipher => {
                    allCipherValues[cipher] = CIPHERS[cipher](phrase);
                });

                const dataToSave = { phrase, createdAt: new Date(), searchCount: 0, ...allCipherValues };
                const newDocRef = doc(gematriaCollectionRef);
                batch.set(newDocRef, dataToSave);
                entriesInBatch++;

                if (entriesInBatch >= batchSize) {
                    await batch.commit();
                    batchesCommitted++;
                    uploadStatus.textContent = `Uploading... Batch ${batchesCommitted} committed.`;
                    batch = writeBatch(db);
                    entriesInBatch = 0;
                }
            }

            if (entriesInBatch > 0) {
                await batch.commit();
                batchesCommitted++;
                uploadStatus.textContent = `Finalizing... Batch ${batchesCommitted} committed.`;
            }

            uploadStatus.textContent = `Upload complete! Added ${phrases.length} entries in ${batchesCommitted} batches.`;
            fileInput.value = '';
        };
        reader.readAsText(file);
    }


    async function showResonanceReport(phrase) {
        modalTitle.textContent = `Resonance Report for "${phrase}"`;
        modalBody.innerHTML = 'Loading...';
        modal.style.display = 'flex';

        const reportCiphers = getSelectedCiphers();
        let reportHtml = '';

        for (const cipher of reportCiphers) {
            const value = CIPHERS[cipher](phrase.toLowerCase());
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
    uploadButton.addEventListener('click', processAndUploadFile);
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

