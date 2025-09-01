// NOTE: The 'DOMContentLoaded' wrapper has been removed, as it's no longer needed.

let wordDatabase = {};
let wordKeys = {};

// --- Gematria Cipher Definitions ---
const ciphers = {
    simple: { 'a': 1, 'b': 2, 'c': 3, 'd': 4, 'e': 5, 'f': 6, 'g': 7, 'h': 8, 'i': 9, 'j': 10, 'k': 11, 'l': 12, 'm': 13, 'n': 14, 'o': 15, 'p': 16, 'q': 17, 'r': 18, 's': 19, 't': 20, 'u': 21, 'v': 22, 'w': 23, 'x': 24, 'y': 25, 'z': 26 },
    english: { 'a': 6, 'b': 12, 'c': 18, 'd': 24, 'e': 30, 'f': 36, 'g': 42, 'h': 48, 'i': 54, 'j': 60, 'k': 66, 'l': 72, 'm': 78, 'n': 84, 'o': 90, 'p': 96, 'q': 102, 'r': 108, 's': 114, 't': 120, 'u': 126, 'v': 132, 'w': 138, 'x': 144, 'y': 150, 'z': 156 },
    jewish: { 'a': 1, 'b': 2, 'c': 3, 'd': 4, 'e': 5, 'f': 6, 'g': 7, 'h': 8, 'i': 9, 'j': 600, 'k': 10, 'l': 20, 'm': 30, 'n': 40, 'o': 50, 'p': 60, 'q': 70, 'r': 80, 's': 90, 't': 100, 'u': 200, 'v': 700, 'w': 900, 'x': 300, 'y': 400, 'z': 500 }
};

const wordDisplay = document.getElementById('word-display');
const wordInput = document.getElementById('word-input');
const resultsArea = document.getElementById('results-area');
const saveWordBtn = document.getElementById('save-word-btn');
const gematriaForm = document.getElementById('gematria-form');
const useLocalStorageCheckbox = document.getElementById('use_localstorage');
const saveStatus = document.getElementById('save-status');
const calculateBtn = document.getElementById('calculate-btn');


// Default data if no other source is available
const defaultData = [
    { word: 'God', jewish: 26, english: 204, simple: 34, searchCount: 0 },
    { word: 'Dog', jewish: 26, english: 162, simple: 27, searchCount: 0 },
];

/**
 * Loads the word database from Firebase or localStorage.
 */
async function loadDatabase() {
    const useLocalStorage = useLocalStorageCheckbox ? useLocalStorageCheckbox.checked : false;

    if (useLocalStorage) {
        const data = localStorage.getItem('wordDatabase');
        wordDatabase = data ? JSON.parse(data) : defaultData;
        wordKeys = {}; // Keys are not used for local storage
    } else {
        try {
            const snapshot = await firebase.database().ref('words').once('value');
            const data = snapshot.val();
            if (data) {
                wordDatabase = Object.values(data);
                wordKeys = Object.keys(data);
            } else {
                wordDatabase = defaultData;
                wordKeys = {};
            }
        } catch (error) {
            console.error("Firebase connection failed, using default data:", error);
            wordDatabase = defaultData;
            wordKeys = {};
        }
    }
}

/**
 * Calculates the Gematria values for a given text.
 */
function calculateGematria(text) {
    const lowerText = text.toLowerCase().replace(/[^a-z]/g, '');
    let simple = 0, english = 0, jewish = 0;

    for (const char of lowerText) {
        if (ciphers.simple[char]) {
            simple += ciphers.simple[char];
            english += ciphers.english[char];
            jewish += ciphers.jewish[char];
        }
    }
    return { simple, english, jewish };
}

/**
 * Finds words in the database that match the calculated Gematria values.
 */
function findMatches(calculatedValues, originalWord) {
    if (!wordDatabase) return [];
    return wordDatabase.filter(entry =>
        entry.word.toLowerCase() !== originalWord.toLowerCase() &&
        (entry.simple === calculatedValues.simple ||
         entry.english === calculatedValues.english ||
         entry.jewish === calculatedValues.jewish)
    );
}

/**
 * Creates and displays the HTML for all results.
 */
function displayResults(word, values, matches, stats) {
    if (!resultsArea) return;

    let tablesHtml = `...`; // (Existing display logic)

    const jewishMatches = matches.filter(match => match.jewish === values.jewish);
    const otherMatches = matches.filter(match => (match.english === values.english || match.simple === values.simple) && !jewishMatches.find(m => m.word === match.word));

    tablesHtml = `
        <table class="results-table">
            <caption>Gematria Values for "${word}"</caption>
            <thead><tr><th>Jewish</th><th>English</th><th>Simple</th></tr></thead>
            <tbody><tr><td>${values.jewish}</td><td>${values.english}</td><td>${values.simple}</td></tr></tbody>
        </table>
        
        <h2 class="results-header">Matches for Jewish Gematria (${values.jewish})</h2>
        <table class="results-table">
            <thead><tr><th>Word</th><th>Jewish</th><th>English</th><th>Simple</th></tr></thead>
            <tbody>
                ${jewishMatches.length > 0 ? jewishMatches.map(m => `<tr><td><a href="?word=${encodeURIComponent(m.word)}">${m.word}</a></td><td class="match-highlight">${m.jewish}</td><td>${m.english}</td><td>${m.simple}</td></tr>`).join('') : `<tr><td colspan="4">No matches found.</td></tr>`}
            </tbody>
        </table>

        <h2 class="results-header">Matches for Simple / English Gematria</h2>
        <table class="results-table">
            <thead><tr><th>Word</th><th>Jewish</th><th>English</th><th>Simple</th></tr></thead>
            <tbody>
                ${otherMatches.length > 0 ? otherMatches.map(m => `<tr><td><a href="?word=${encodeURIComponent(m.word)}">${m.word}</a></td><td>${m.jewish}</td><td class="${m.english === values.english ? 'match-highlight' : ''}">${m.english}</td><td class="${m.simple === values.simple ? 'match-highlight' : ''}">${m.simple}</td></tr>`).join('') : `<tr><td colspan="4">No matches found.</td></tr>`}
            </tbody>
        </table>
    `;
    
    let statsHtml = '';
    if (stats.found) {
        statsHtml = `
            <div class="stats-area">
                <h3>Statistics for "${word}"</h3>
                <p>This word has been searched <strong>${stats.searchCount || 0}</strong> times.</p>
            </div>
        `;
    }

    resultsArea.innerHTML = tablesHtml + statsHtml;
}

/**
 * Main function to perform calculation and display.
 */
async function performCalculation(word) {
    await loadDatabase();
    if (word && word.trim()) {
        const cleanWord = word.trim();
        if (wordDisplay) wordDisplay.textContent = `"${cleanWord}"`;
        if (wordInput) wordInput.value = cleanWord;

        const calculatedValues = calculateGematria(cleanWord);
        const matchingWords = findMatches(calculatedValues, cleanWord);
        
        const stats = { found: false, searchCount: 0 };
        const wordIndex = wordDatabase.findIndex(entry => entry.word.toLowerCase() === cleanWord.toLowerCase());

        if (wordIndex !== -1) {
            stats.found = true;
            const entry = wordDatabase[wordIndex];
            entry.searchCount = (entry.searchCount || 0) + 1;
            stats.searchCount = entry.searchCount;
            
            if (!useLocalStorageCheckbox.checked && wordKeys[wordIndex]) {
                const firebaseKey = wordKeys[wordIndex];
                firebase.database().ref(`words/${firebaseKey}`).update({
                    searchCount: entry.searchCount,
                    lastSearched: new Date().toISOString()
                });
            }
        }
        
        displayResults(cleanWord, calculatedValues, matchingWords, stats);
    } else {
        if (wordDisplay) wordDisplay.textContent = '...';
        if (resultsArea) resultsArea.innerHTML = '<p>Please enter a word or phrase.</p>';
    }
}

/**
 * Saves a new word to the database.
 */
async function saveWord() {
    await loadDatabase();
    const wordToSave = wordInput.value.trim();

    if (wordToSave) {
        const exists = wordDatabase.some(entry => entry.word.toLowerCase() === wordToSave.toLowerCase());

        if (exists) {
            saveStatus.textContent = `"${wordToSave}" is already in the database.`;
            saveStatus.style.color = 'orange';
        } else {
            const calculatedValues = calculateGematria(wordToSave);
            const newEntry = {
                word: wordToSave,
                jewish: calculatedValues.jewish,
                english: calculatedValues.english,
                simple: calculatedValues.simple,
                searchCount: 1, // Initialize with 1 search
                lastSearched: new Date().toISOString()
            };

            if (useLocalStorageCheckbox.checked) {
                wordDatabase.push(newEntry);
                localStorage.setItem('wordDatabase', JSON.stringify(wordDatabase));
                saveStatus.textContent = `Saved "${wordToSave}" to local storage!`;
            } else {
                await firebase.database().ref('words').push(newEntry);
                saveStatus.textContent = `Saved "${wordToSave}" to Firebase!`;
            }
            saveStatus.style.color = 'lightgreen';
            performCalculation(wordToSave); // Refresh results
        }
    } else {
        saveStatus.textContent = 'Please enter a word to save.';
        saveStatus.style.color = 'tomato';
    }
    setTimeout(() => { saveStatus.textContent = ''; }, 4000);
}

function handleCalculation(event) {
    event.preventDefault();
    const word = wordInput.value;
    const newUrl = `${window.location.pathname}?word=${encodeURIComponent(word)}`;
    window.history.pushState({path: newUrl}, '', newUrl);
    performCalculation(word);
}

// --- Event Listeners ---
if (gematriaForm) {
    gematriaForm.addEventListener('submit', handleCalculation);
}
if (saveWordBtn) {
    saveWordBtn.addEventListener('click', saveWord);
}
if (useLocalStorageCheckbox) {
    useLocalStorageCheckbox.addEventListener('change', () => performCalculation(wordInput.value));
}

// --- Initial Load ---
const initialUrlParams = new URLSearchParams(window.location.search);
const initialWord = initialUrlParams.get('word');
performCalculation(initialWord);

