document.addEventListener('DOMContentLoaded', () => {
    // A key-value map to store both data and Firebase keys
    let wordDatabase = {}; 

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

    /**
     * Loads the word database from Firebase or Local Storage.
     */
    async function loadDatabase() {
        const useLocalStorage = useLocalStorageCheckbox.checked;

        if (useLocalStorage) {
            const data = localStorage.getItem('wordDatabase');
            wordDatabase = data ? JSON.parse(data) : {};
        } else {
            try {
                const snapshot = await firebase.database().ref('words').once('value');
                wordDatabase = snapshot.val() || {};
            } catch (error) {
                console.error("Firebase connection failed, using empty database:", error);
                wordDatabase = {};
            }
        }
    }

    /**
     * Calculates the Gematria values for a given text.
     */
    function calculateGematria(text) {
        const lowerText = text.toLowerCase().replace(/[^a-z\s]/g, '');
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
     * Creates the HTML for a single calculation breakdown.
     */
    function createBreakdownHtml(word, cipherName, totalValue) {
        const cipherMap = ciphers[cipherName];
        let lettersHtml = '';
        let numbersHtml = '';
        
        for (const char of word.toLowerCase().replace(/[^a-z]/g, '')) {
            if (cipherMap[char]) {
                lettersHtml += `<td>${char}</td>`;
                numbersHtml += `<td>${cipherMap[char]}</td>`;
            }
        }
        
        const title = cipherName.charAt(0).toUpperCase() + cipherName.slice(1);

        return `
            <div class="breakdown-item">
                <p><strong>"${word}"</strong> in <strong>${title} Gematria</strong> equals <strong>${totalValue}</strong>:</p>
                <table class="breakdown-table">
                    <tbody>
                        <tr class="breakdown-letters">${lettersHtml}</tr>
                        <tr class="breakdown-numbers">${numbersHtml}</tr>
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * Renders a results table for either word or number searches.
     * @param {string} title - The title for the table.
     * @param {Array} matches - The array of word objects to display.
     * @param {string} [searchedWord] - The original word that was searched for, to highlight it.
     */
    function createResultsTable(title, matches, searchedWord) {
        if (matches.length === 0) {
            return `
                <h2 class="results-header">${title}</h2>
                <p style="text-align:center; padding: 1rem; color: #888;">No matching words found.</p>
            `;
        }

        const rows = matches.map(match => {
            const isSearched = searchedWord && match.word.toLowerCase() === searchedWord.toLowerCase();
            const style = isSearched ? 'style="background-color: #e6e6fa;"' : ''; // Lilac highlight
            return `
            <tr ${style}>
                <td><a href="?word=${encodeURIComponent(match.word)}">${match.word}</a></td>
                <td>${match.jewish}</td>
                <td>${match.english}</td>
                <td>${match.simple}</td>
                <td>${match.searchCount || 0}</td>
            </tr>
        `}).join('');

        return `
            <h2 class="results-header">${title}</h2>
            <table class="results-table">
                <thead>
                    <tr>
                        <th>Word</th>
                        <th>Jewish</th>
                        <th>English</th>
                        <th>Simple</th>
                        <th>Search Count</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        `;
    }

    /**
     * Displays results for a WORD search.
     */
    function displayWordResults(word, values) {
        const allWords = Object.values(wordDatabase);
        
        // Find all matches for Jewish Gematria
        const jewishMatches = allWords.filter(entry => entry.jewish === values.jewish);

        // Find all matches for English or Simple Gematria
        const otherMatches = allWords.filter(entry => 
            entry.english === values.english || entry.simple === values.simple
        );

        // NOTE: The de-duplication logic that prevented a word from showing in both tables
        // has been removed to ensure the searched word appears in all relevant categories.

        let breakdownContainer = `<div class="breakdown-container">`;
        breakdownContainer += createBreakdownHtml(word, 'jewish', values.jewish);
        breakdownContainer += createBreakdownHtml(word, 'english', values.english);
        breakdownContainer += createBreakdownHtml(word, 'simple', values.simple);
        breakdownContainer += `</div>`;

        let tablesHtml = createResultsTable(`Matches for Jewish Gematria (${values.jewish})`, jewishMatches, word);
        tablesHtml += createResultsTable(`Matches for English/Simple Gematria`, otherMatches, word);
        
        resultsArea.innerHTML = breakdownContainer + tablesHtml;
    }

    /**
     * Displays results for a NUMBER search.
     */
    function displayValueResults(value) {
        const allWords = Object.values(wordDatabase);
        const jewishMatches = allWords.filter(entry => entry.jewish === value);
        const otherMatches = allWords.filter(entry => entry.english === value || entry.simple === value);
        
        let tablesHtml = createResultsTable(`Words with Jewish Gematria of ${value}`, jewishMatches);
        tablesHtml += createResultsTable(`Words with English/Simple Gematria of ${value}`, otherMatches);

        resultsArea.innerHTML = tablesHtml;
    }

    /**
     * Main function to perform calculation and display.
     */
    async function performCalculation(term) {
        await loadDatabase(); 
        if (!term || !term.trim()) {
            wordDisplay.textContent = '...';
            resultsArea.innerHTML = '<p style="text-align:center;">Please enter a word, phrase, or number.</p>';
            return;
        }

        const cleanTerm = term.trim();
        const isNumberSearch = /^\d+$/.test(cleanTerm);
        wordDisplay.textContent = `"${cleanTerm}"`;
        wordInput.value = cleanTerm;

        if (isNumberSearch) {
            displayValueResults(parseInt(cleanTerm, 10));
        } else {
            // This is a word search, proceed to update count
            const calculatedValues = calculateGematria(cleanTerm);
            
            // Find if the word exists to update its search count
            const entryKey = Object.keys(wordDatabase).find(key => wordDatabase[key].word.toLowerCase() === cleanTerm.toLowerCase());

            if (entryKey) {
                const entry = wordDatabase[entryKey];
                const newSearchCount = (entry.searchCount || 0) + 1;
                const updates = {
                    searchCount: newSearchCount,
                    lastSearched: new Date().toISOString()
                };
                if (!useLocalStorageCheckbox.checked) {
                    await firebase.database().ref(`words/${entryKey}`).update(updates);
                }
                // Also update our local copy
                wordDatabase[entryKey] = { ...entry, ...updates };
            }
            
            displayWordResults(cleanTerm, calculatedValues);
        }
    }

    /**
     * Saves a new word to the database.
     */
    async function saveWord() {
        await loadDatabase();
        const wordToSave = wordInput.value.trim();

        if (!wordToSave) {
            saveStatus.textContent = 'Please enter a word to save.';
            saveStatus.style.color = 'tomato';
            return;
        }

        const exists = Object.values(wordDatabase).some(entry => entry.word.toLowerCase() === wordToSave.toLowerCase());

        if (exists) {
            saveStatus.textContent = `"${wordToSave}" is already in the database.`;
            saveStatus.style.color = 'orange';
        } else {
            const calculatedValues = calculateGematria(wordToSave);
            const newEntry = {
                word: wordToSave,
                ...calculatedValues,
                searchCount: 1, // Initialize with 1
                createdAt: new Date().toISOString(),
                lastSearched: new Date().toISOString()
            };
            
            if (useLocalStorageCheckbox.checked) {
                // For local storage, we just add it to our object
                wordDatabase[Date.now()] = newEntry; // Use timestamp as a unique key
                localStorage.setItem('wordDatabase', JSON.stringify(wordDatabase));
                saveStatus.textContent = `Saved "${wordToSave}" to local storage!`;
                saveStatus.style.color = 'lightgreen';
            } else {
                // Save to Firebase
                const newWordRef = firebase.database().ref('words').push();
                await newWordRef.set(newEntry);
                saveStatus.textContent = `Saved "${wordToSave}" to Firebase!`;
                saveStatus.style.color = 'lightgreen';
            }
            // Immediately re-run calculation to show the word in the lists
            await performCalculation(wordToSave);
        }

        setTimeout(() => { saveStatus.textContent = ''; }, 4000);
    }

    // --- Event Listeners and Initial Load ---
    gematriaForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const term = wordInput.value;
        const newUrl = `${window.location.pathname}?word=${encodeURIComponent(term)}`;
        window.history.pushState({ path: newUrl }, '', newUrl);
        performCalculation(term);
    });

    saveWordBtn.addEventListener('click', saveWord);
    
    useLocalStorageCheckbox.addEventListener('change', () => {
        localStorage.setItem('useLocalStorage', useLocalStorageCheckbox.checked);
        const urlParams = new URLSearchParams(window.location.search);
        performCalculation(urlParams.get('word'));
    });
    
    const initialUrlParams = new URLSearchParams(window.location.search);
    performCalculation(initialUrlParams.get('word'));
});

