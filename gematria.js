import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, getDocs, limit, writeBatch, or, doc, serverTimestamp, runTransaction } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { firebaseConfig } from './firebase-config.js';

// The firebaseConfig is now imported from the firebase-config.js file.

let CIPHERS = {};
const PHI = 1.618033988749895;
const GOLDEN_ANGLE = 137.50776405;
let db, auth;
let originalPhraseValues = {};

const gematriaInput = document.getElementById('gematria-input');
const resultsSummary = document.getElementById('results-summary');
const breakdownContainer = document.getElementById('breakdown-container');
const dbMatchesContainer = document.getElementById('db-matches-container');
const cipherSettings = document.getElementById('cipher-settings');
const saveButton = document.getElementById('save-button');
const themeToggleButton = document.getElementById('theme-toggle');
const modal = document.getElementById('resonance-modal');
const modalCloseBtn = modal.querySelector('.modal-close-button');
const fileInput = document.getElementById('file-input');
const uploadStatus = document.getElementById('upload-status');

function recursiveDigitSum(n) {
    let val = Math.abs(Math.round(n));
    while (val > 9) {
        val = String(val).split('').reduce((sum, digit) => sum + parseInt(digit, 10), 0);
    }
    return val;
}

function buildGematriaCiphers() {
    const a = 'abcdefghijklmnopqrstuvwxyz';
    const simpleMap = {};
    a.split('').forEach((l, i) => { simpleMap[l] = i + 1; });
    const jewishValues = { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8, i: 9, k: 10, l: 20, m: 30, n: 40, o: 50, p: 60, q: 70, r: 80, s: 90, t: 100, u: 200, x: 300, y: 400, z: 500, j: 600, v: 700, w: 900 };
    const qwertyMap = {};
    'qwertyuiopasdfghjklzxcvbnm'.split('').forEach((l, i) => { qwertyMap[l] = i + 1; });
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
        "Spiral Gematria": (text) => {
            const cleaned = text.toLowerCase().replace(/[^a-z]/g, '');
            return Math.round(cleaned.split('').reduce((sum, char, i) => sum + (simpleMap[char] || 0) * Math.cos(GOLDEN_ANGLE * (i + 1)), 0));
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

document.addEventListener('DOMContentLoaded', async () => {
    CIPHERS = buildGematriaCiphers();
    
    try {
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);
        if (typeof __initial_auth_token !== 'undefined') {
            await signInWithCustomToken(auth, __initial_auth_token);
        } else {
            await signInAnonymously(auth);
        }
    } catch (error) {
        console.error("Firebase initialization failed:", error);
        alert("Firebase initialization failed. Please ensure your firebaseConfig in gematria.js is correct.");
        return;
    }

    setupTheme();
    populateCipherSettings();

    const debouncedHandler = debounce(handleInputChange, 300);
    gematriaInput.addEventListener('input', debouncedHandler);
    cipherSettings.addEventListener('change', handleInputChange);
    dbMatchesContainer.addEventListener('click', handleMatchClick);
    saveButton.addEventListener('click', saveToDatabase);
    fileInput.addEventListener('change', processAndUploadFile);
    modalCloseBtn.addEventListener('click', () => modal.style.display = 'none');
});

function calculateGematria(text) {
    const values = {};
    const breakdown = {};
    const cleanedText = text.toLowerCase().replace(/[^a-z]/g, '');

    for (const name in CIPHERS) {
        values[name] = CIPHERS[name](text);
        if (["English Ordinal", "Reverse Ordinal", "Full Reduction", "Jewish Gematria"].includes(name)) {
            breakdown[name] = [];
            for(const char of cleanedText) {
                const tempCipher = { [name]: CIPHERS[name] };
                breakdown[name].push({ char, value: tempCipher[name](char) });
            }
        }
    }
    return { values, breakdown };
}

async function handleInputChange() {
    const inputText = gematriaInput.value.trim();
    saveButton.disabled = !inputText;

    if (!inputText) {
        resultsSummary.innerHTML = '';
        breakdownContainer.innerHTML = '';
        dbMatchesContainer.innerHTML = '';
        return;
    }

    const { values, breakdown } = calculateGematria(inputText);
    originalPhraseValues = values;
    displaySummary(values);
    displayDetailedBreakdown(breakdown);
    await findAndDisplayMatches(values);
}

async function findAndDisplayMatches(values) {
    dbMatchesContainer.innerHTML = '<h4>Loading matches...</h4>';
    const activeCiphers = getActiveCiphers();
    if (activeCiphers.length === 0) {
        dbMatchesContainer.innerHTML = 'Select ciphers to see matches.';
        return;
    }

    const queries = activeCiphers.slice(0, 30).map(cipher => where(`values.${cipher}`, "==", values[cipher]));
    if (queries.length === 0) return;

    const mainQuery = query(collection(db, "phrases"), or(...queries));
    const querySnapshot = await getDocs(mainQuery);
    
    const jewishMatches = [];
    const englishMatches = [];
    const originalPhraseLower = gematriaInput.value.trim().toLowerCase();

    querySnapshot.forEach(doc => {
        const data = doc.data();
        if (data.phrase.toLowerCase() === originalPhraseLower) return;
        if (data.values["Jewish Gematria"] === values["Jewish Gematria"]) jewishMatches.push(data);
        if (data.values["English Ordinal"] === values["English Ordinal"]) englishMatches.push(data);
    });
    
    displayMatchTables(jewishMatches, englishMatches);
}

function displaySummary(values) {
    let html = '';
    getActiveCiphers().forEach(cipher => {
        html += `<div class="summary-card"><strong>${cipher.replace(" Gematria", "")}:</strong> ${values[cipher] || 0}</div>`;
    });
    resultsSummary.innerHTML = html;
}

function displayDetailedBreakdown(breakdown) {
    let html = '';
    const displayableCiphers = ["English Ordinal", "Reverse Ordinal", "Full Reduction", "Jewish Gematria"];
    for (const cipher of displayableCiphers) {
        if (breakdown[cipher] && breakdown[cipher].length > 0) {
            html += `<div class="breakdown-cipher-card"><h4>${cipher}</h4><div class="breakdown-calculation">`;
            breakdown[cipher].forEach((b, index) => {
                html += `<div class="char-value"><span class="char">${b.char.toUpperCase()}</span><span class="value">${b.value}</span></div>`;
                if (index < breakdown[cipher].length - 1) html += `<div class="operator">+</div>`;
            });
            const total = breakdown[cipher].reduce((sum, b) => sum + b.value, 0);
            html += `<div class="operator">=</div><div class="total">${total}</div></div></div>`;
        }
    }
    breakdownContainer.innerHTML = html;
}

function displayMatchTables(jewishMatches, englishMatches) {
    dbMatchesContainer.innerHTML = `
        <div class="tabs">
            <button class="tab-button active" data-tab="jewish">Jewish Gematria (${jewishMatches.length})</button>
            <button class="tab-button" data-tab="english">English Ordinal (${englishMatches.length})</button>
        </div>
        <div id="tab-jewish" class="tab-content active">
            ${createTable(jewishMatches, ['Jewish Gematria', 'English Ordinal', 'Full Reduction'])}
        </div>
        <div id="tab-english" class="tab-content">
             ${createTable(englishMatches, ['English Ordinal', 'Jewish Gematria', 'Full Reduction'])}
        </div>
    `;
    dbMatchesContainer.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', (e) => {
            dbMatchesContainer.querySelectorAll('.tab-button, .tab-content').forEach(el => el.classList.remove('active'));
            e.target.classList.add('active');
            dbMatchesContainer.querySelector(`#tab-${e.target.dataset.tab}`).classList.add('active');
        });
    });
}

function createTable(matches, columns) {
    let table = `<table class="match-table"><thead><tr><th>Phrase</th>`;
    columns.forEach(col => table += `<th>${col.split(' ')[0]}</th>`);
    table += '</tr></thead><tbody>';
    matches.sort((a,b) => (b.searchCount || 0) - (a.searchCount || 0)).slice(0, 25).forEach(match => {
        table += `<tr data-phrase='${escapeHTML(match.phrase)}'><td>${escapeHTML(match.phrase)}</td>`;
        columns.forEach(col => table += `<td>${match.values[col] || 0}</td>`);
        table += '</tr>';
    });
    return table + '</tbody></table>';
}

function displayResonanceReport(matchedPhrase) {
    const { values: matchedValues } = calculateGematria(matchedPhrase);
    const originalPhrase = gematriaInput.value.trim();
    let report = `<h3>'${escapeHTML(originalPhrase)}' vs '${escapeHTML(matchedPhrase)}'</h3><table>`;
    getActiveCiphers().forEach(cipher => {
        const v1 = originalPhraseValues[cipher];
        const v2 = matchedValues[cipher];
        report += `<tr><td><strong>${cipher}</strong></td><td>${v1}</td><td>${v2}</td><td style="color:${v1===v2 ? 'lime' : 'red'}">${v1===v2 ? 'MATCH' : ' '}</td></tr>`;
    });
    report += '</table>';
    document.getElementById('modal-body').innerHTML = report;
    modal.style.display = 'flex';
}

async function handleMatchClick(event) {
    const row = event.target.closest('tr[data-phrase]');
    if (!row) return;
    const resonantPhrase = row.dataset.phrase;
    displayResonanceReport(resonantPhrase);
    gematriaInput.value = resonantPhrase;
    await handleInputChange();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function populateCipherSettings() {
    let html = '';
    const defaultChecked = ["English Ordinal", "Reverse Ordinal", "Full Reduction", "Jewish Gematria"];
    Object.keys(CIPHERS).sort().forEach(name => {
        html += `<label><input type="checkbox" data-cipher="${name}" ${defaultChecked.includes(name) ? 'checked' : ''}> ${name}</label>`;
    });
    cipherSettings.innerHTML = html;
}

function getActiveCiphers() {
    return Array.from(cipherSettings.querySelectorAll('input:checked')).map(cb => cb.dataset.cipher);
}

async function saveToDatabase() {
    const phrase = gematriaInput.value.trim();
    if (!phrase) return;
    saveButton.disabled = true;
    saveButton.textContent = 'Saving...';
    const { values } = calculateGematria(phrase);
    await addDoc(collection(db, "phrases"), {
        phrase, values, searchCount: 1, timestamp: serverTimestamp()
    });
    saveButton.textContent = 'Save';
    await handleInputChange();
}

async function processAndUploadFile() {
    const file = fileInput.files[0];
    if (!file) {
        uploadStatus.textContent = 'Please select a file.';
        return;
    }
    uploadStatus.textContent = "Reading file...";
    const reader = new FileReader();
    reader.onload = async (event) => {
        const lines = event.target.result.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        if (lines.length === 0) { uploadStatus.textContent = "File is empty."; return; }
        uploadStatus.textContent = `Processing ${lines.length} entries...`;
        
        const batchSize = 499;
        for (let i = 0; i < lines.length; i += batchSize) {
            const batch = writeBatch(db);
            const chunk = lines.slice(i, i + batchSize);
            chunk.forEach(line => {
                const { values } = calculateGematria(line);
                const docRef = doc(collection(db, "phrases"));
                batch.set(docRef, { phrase: line, values, searchCount: 0, timestamp: serverTimestamp() });
            });
            await batch.commit();
            uploadStatus.textContent = `Uploaded ${i + chunk.length} of ${lines.length} entries...`;
        }
        
        uploadStatus.textContent = `Upload complete! Added ${lines.length} entries.`;
        fileInput.value = '';
    };
    reader.onerror = () => { uploadStatus.textContent = "Error reading file."; };
    reader.readAsText(file);
}

function setupTheme() {
    const savedTheme = localStorage.getItem('gematria-theme') || 'dark';
    document.body.setAttribute('data-theme', savedTheme);
    themeToggleButton.addEventListener('click', () => {
        let newTheme = document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('gematria-theme', newTheme);
    });
}

function debounce(func, delay) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

function escapeHTML(str) {
    const p = document.createElement("p");
    p.textContent = str;
    return p.innerHTML;
}

