// --- Firebase Imports ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, getDocs, limit, writeBatch, or, doc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- GLOBAL STATE & CONSTANTS ---
const CIPHERS = {};
const PHI = 1.618033988749895;

// --- UTILITY: NUMBER ANALYSIS ---
function recursiveDigitSum(n) {
    let val = Math.abs(Math.round(n));
    while (val > 9) {
        val = String(val).split('').reduce((sum, digit) => sum + parseInt(digit, 10), 0);
    }
    return val;
}

// --- GEMATRIA CIPHER DEFINITIONS (EXPANDED) ---
function buildGematriaCiphers() {
    const a = 'abcdefghijklmnopqrstuvwxyz';
    const simpleMap = {};
    a.split('').forEach((l, i) => { simpleMap[l] = i + 1; });

    const jewishValues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 200, 300, 400, 500, 600, 700, 800];
    const jewishMap = {};
    a.split('').forEach((l, i) => { jewishMap[l] = jewishValues[i]; });

    const chaldeanMap = {a:1,b:2,c:3,d:4,e:5,f:8,g:3,h:5,i:1,j:1,k:2,l:3,m:4,n:5,o:7,p:8,q:1,r:2,s:3,t:4,u:6,v:6,w:6,x:5,y:1,z:7};

    const calculateWithMap = (text, map) => text.toLowerCase().split('').reduce((sum, char) => sum + (map[char] || 0), 0);
    
    // --- CORE CIPHERS ---
    CIPHERS['Simple'] = (text) => calculateWithMap(text, simpleMap);
    CIPHERS['English'] = (text) => CIPHERS.Simple(text) * 6;
    CIPHERS['Jewish'] = (text) => calculateWithMap(text, jewishMap);
    CIPHERS['Chaldean'] = (text) => calculateWithMap(text, chaldeanMap);
    CIPHERS['Reduction'] = (text) => recursiveDigitSum(CIPHERS.Simple(text));
    
    // --- REVERSE CIPHERS ---
    const reverse = (text) => text.split('').reverse().join('');
    CIPHERS['ReverseSimple'] = (text) => CIPHERS.Simple(reverse(text));
    CIPHERS['ReverseEnglish'] = (text) => CIPHERS.English(reverse(text));
}
buildGematriaCiphers();

// --- THEME MANAGEMENT ---
const ICONS = {
    sun: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`,
    moon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`
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
    
    initDeltaPage(db);
});

// --- DELTA PAGE LOGIC ---
function initDeltaPage(db) {
    const input1 = document.getElementById('delta-input-1');
    const input2 = document.getElementById('delta-input-2');
    const resultsContainer = document.getElementById('delta-results-container');
    const themeToggleButton = document.getElementById('theme-toggle');
    const fileInput = document.getElementById('file-input');
    const uploadButton = document.getElementById('upload-button');
    const uploadStatus = document.getElementById('upload-status');

    // --- Initialize Theme ---
    const savedTheme = localStorage.getItem('gematria-theme') || 'dark';
    applyTheme(savedTheme, themeToggleButton);
    themeToggleButton.addEventListener('click', () => toggleTheme(themeToggleButton));

    const handleInput = () => {
        const text1 = input1.value.trim();
        const text2 = input2.value.trim();

        if (!text1 || !text2) {
            resultsContainer.innerHTML = '';
            return;
        }
        calculateAndDisplayDelta(text1, text2);
    };

    const debouncedHandler = debounce(handleInput, 300);

    async function calculateAndDisplayDelta(text1, text2) {
        let resultsHtml = '<table><thead><tr><th>Cipher</th><th>Phrase 1 Value</th><th>Phrase 2 Value</th><th>Delta</th><th>Matching Words in DB</th></tr></thead><tbody>';
        
        for (const cipher of Object.keys(CIPHERS)) {
            const val1 = CIPHERS[cipher](text1);
            const val2 = CIPHERS[cipher](text2);
            const delta = Math.abs(val1 - val2);
            
            const matchesPromise = fetchMatchesForValue(db, delta, cipher);

            resultsHtml += `
                <tr data-delta="${delta}" data-cipher="${cipher}">
                    <td>${escapeHTML(cipher)}</td>
                    <td>${val1}</td>
                    <td>${val2}</td>
                    <td class="delta-value">${delta}</td>
                    <td class="matches-cell" id="matches-${cipher}-${delta}">Loading...</td>
                </tr>
            `;
            
            matchesPromise.then(matches => {
                const cell = document.getElementById(`matches-${cipher}-${delta}`);
                if (cell) {
                    cell.innerHTML = matches.length > 0 ? matches.map(escapeHTML).join(', ') : '<em>None found</em>';
                }
            });
        }
        
        resultsHtml += '</tbody></table>';
        resultsContainer.innerHTML = resultsHtml;
    }

    async function fetchMatchesForValue(db, value, cipher) {
        if (value < 1) return [];
        try {
            const entriesRef = collection(db, "entries");
            const q = query(entriesRef, where(cipher, "==", value), limit(10));
            const querySnapshot = await getDocs(q);
            const phrases = querySnapshot.docs.map(doc => doc.data().phrase);
            // Use a Set to get unique phrases in case of multiple matches on different ciphers
            return [...new Set(phrases)];
        } catch (error) {
            console.error(`Error fetching matches for ${cipher} = ${value}:`, error);
            return ["Error"];
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
            const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
            uploadStatus.textContent = `Found ${lines.length} lines. Processing...`;

            if (lines.length === 0) {
                uploadStatus.textContent = "File is empty or contains no valid lines.";
                return;
            }

            const entriesRef = collection(db, "entries");
            const batchSize = 400; // Firestore batch limit is 500, being safe
            let batch = writeBatch(db);
            let entriesInBatch = 0;
            let batchesCommitted = 0;
            
            for (let i = 0; i < lines.length; i++) {
                const phrase = lines[i].trim().toLowerCase();
                if (!phrase) continue;

                // For simplicity, we are not checking for duplicates before upload.
                // An alternative, more robust system would check for existence first,
                // but that is much slower for large files.
                const allCipherValues = {};
                Object.keys(CIPHERS).forEach(cipher => {
                    allCipherValues[cipher] = CIPHERS[cipher](phrase);
                });

                const dataToSave = { 
                    phrase, 
                    createdAt: new Date(), 
                    searchCount: 0, 
                    ...allCipherValues 
                };
                
                const newDocRef = doc(entriesRef); // Create a new doc with a random ID
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

            uploadStatus.textContent = `Upload complete! Added ${lines.length} entries in ${batchesCommitted} batches.`;
            fileInput.value = ''; // Reset file input
        };

        reader.onerror = () => {
            uploadStatus.textContent = "Error reading file.";
        };

        reader.readAsText(file);
    }

    input1.addEventListener('input', debouncedHandler);
    input2.addEventListener('input', debouncedHandler);
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

