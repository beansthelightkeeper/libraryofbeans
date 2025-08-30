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

    CIPHERS['English Ordinal'] = (char) => simpleMap[char] || 0;
    CIPHERS['Reverse Ordinal'] = (char) => 27 - (simpleMap[char] || 0);
    CIPHERS['Full Reduction'] = (char) => ((simpleMap[char] - 1) % 9) + 1 || 0;
    CIPHERS['Reverse Full Reduction'] = (char) => 9 - ((simpleMap[char] - 1) % 9) || 0;
    CIPHERS['Jewish Gematria'] = (char) => jewishMap[char] || 0;
}

// --- CORE CALCULATION FUNCTIONS ---
function calculateAllCiphers(text) {
    const cleanedText = text.toLowerCase().replace(/[^a-z]/g, '');
    const results = {};
    for (const cipherName in CIPHERS) {
        results[cipherName] = cleanedText.split('').reduce((sum, char) => sum + CIPHERS[cipherName](char), 0);
    }
    return results;
}

// --- MAIN APPLICATION LOGIC ---
document.addEventListener('DOMContentLoaded', main);

function main() {
    // Assuming firebaseConfig is loaded from a separate file
    if (typeof firebaseConfig === 'undefined') {
        console.error("Firebase config is not defined. Please include firebase-config.js");
        return;
    }
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);
    signInAnonymously(auth);

    buildGematriaCiphers();

    const input1 = document.getElementById('delta-input-1');
    const input2 = document.getElementById('delta-input-2');
    const resultsContainer = document.getElementById('delta-results-container');
    const uploadButton = document.getElementById('upload-button');
    const fileInput = document.getElementById('file-input');

    const debouncedHandler = debounce(handleInputs, 300);

    async function handleInputs() {
        const text1 = input1.value.trim();
        const text2 = input2.value.trim();

        if (!text1 || !text2) {
            resultsContainer.innerHTML = '';
            return;
        }

        const values1 = calculateAllCiphers(text1);
        const values2 = calculateAllCiphers(text2);
        const deltas = {};

        for (const cipher in values1) {
            deltas[cipher] = Math.abs(values1[cipher] - values2[cipher]);
        }

        displayResults(values1, values2, deltas);
    }

    function displayResults(values1, values2, deltas) {
        let tableHtml = `
            <h2>Delta Analysis</h2>
            <table>
                <thead>
                    <tr>
                        <th>Cipher</th>
                        <th>Phrase 1 Value</th>
                        <th>Phrase 2 Value</th>
                        <th>Delta (Difference)</th>
                    </tr>
                </thead>
                <tbody>
        `;

        for (const cipher in deltas) {
            tableHtml += `
                <tr>
                    <td>${escapeHTML(cipher)}</td>
                    <td>${values1[cipher]}</td>
                    <td>${values2[cipher]}</td>
                    <td class="delta-value">${deltas[cipher]}</td>
                </tr>
            `;
        }

        tableHtml += `
                </tbody>
            </table>
        `;
        resultsContainer.innerHTML = tableHtml;
    }
    
    async function processAndUploadFile() {
        const file = fileInput.files[0];
        const uploadStatus = document.getElementById('upload-status');
        if (!file) {
            alert("Please select a file to upload.");
            return;
        }

        uploadStatus.textContent = "Reading file...";
        const reader = new FileReader();

        reader.onload = async (event) => {
            const content = event.target.result;
            const lines = content.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
            
            if (lines.length === 0) {
                uploadStatus.textContent = "File is empty or contains no valid lines.";
                return;
            }

            uploadStatus.textContent = `Processing ${lines.length} entries...`;
            const phrasesCollection = collection(db, "phrases");
            const batchSize = 500;
            let batch = writeBatch(db);
            let entriesInBatch = 0;
            let batchesCommitted = 0;

            for (const line of lines) {
                const gematriaValues = calculateAllCiphers(line);
                const dataToSave = {
                    phrase: line,
                    values: gematriaValues
                };
                const docRef = doc(phrasesCollection); // Auto-generate ID
                batch.set(docRef, dataToSave);
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
