document.addEventListener('DOMContentLoaded', () => {
    let wordDatabase = {}; // Use an object to store key-value pairs
    const wordDisplay = document.getElementById('word-display');
    const wordInput = document.getElementById('word-input');
    const resultsArea = document.getElementById('results-area');
    const saveWordBtn = document.getElementById('save-word-btn');
    const gematriaForm = document.getElementById('gematria-form');
    const useLocalStorageCheckbox = document.getElementById('use_localstorage');
    const saveStatus = document.getElementById('save-status');

    const ciphers = {
        simple: { 'a': 1, 'b': 2, 'c': 3, 'd': 4, 'e': 5, 'f': 6, 'g': 7, 'h': 8, 'i': 9, 'j': 10, 'k': 11, 'l': 12, 'm': 13, 'n': 14, 'o': 15, 'p': 16, 'q': 17, 'r': 18, 's': 19, 't': 20, 'u': 21, 'v': 22, 'w': 23, 'x': 24, 'y': 25, 'z': 26 },
        english: { 'a': 6, 'b': 12, 'c': 18, 'd': 24, 'e': 30, 'f': 36, 'g': 42, 'h': 48, 'i': 54, 'j': 60, 'k': 66, 'l': 72, 'm': 78, 'n': 84, 'o': 90, 'p': 96, 'q': 102, 'r': 108, 's': 114, 't': 120, 'u': 126, 'v': 132, 'w': 138, 'x': 144, 'y': 150, 'z': 156 },
        jewish: { 'a': 1, 'b': 2, 'c': 3, 'd': 4, 'e': 5, 'f': 6, 'g': 7, 'h': 8, 'i': 9, 'j': 600, 'k': 10, 'l': 20, 'm': 30, 'n': 40, 'o': 50, 'p': 60, 'q': 70, 'r': 80, 's': 90, 't': 100, 'u': 200, 'v': 700, 'w': 900, 'x': 300, 'y': 400, 'z': 500 }
    };

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
    
    function findWordInDatabase(wordToFind) {
        const lowerWord = wordToFind.toLowerCase();
        for (const key in wordDatabase) {
            if (wordDatabase[key].word.toLowerCase() === lowerWord) {
                return { key, entry: wordDatabase[key] };
            }
        }
        return null;
    }

    // --- THIS IS THE UPDATED FUNCTION ---
    function createBreakdownHtml(word, cipherName, totalValue) {
        const cipherMap = ciphers[cipherName];
        let pairsHtml = ''; // To hold our new letter-pair divs
        
        // Loop through each character to create a "card" for it
        for (const char of word.toLowerCase().replace(/[^a-z]/g, '')) {
            if (cipherMap[char]) {
                pairsHtml += `<div class="letter-pair">
                                <span class="letter">${char}</span>
                                <span class="number">${cipherMap[char]}</span>
                              </div>`;
            }
        }

        const title = cipherName.charAt(0).toUpperCase() + cipherName.slice(1);

        // The main container now uses a div with the class "breakdown-flex-container"
        return `<div class="breakdown-item">
                    <p><strong>"${word}"</strong> in <strong>${title} Gematria</strong> equals <strong>${totalValue}</strong>:</p>
                    <div class="breakdown-flex-container">${pairsHtml}</div>
                </div>`;
    }
    
    function createResultsTable(title, matches, searchedWord = '') {
        let tableHtml = `<div class="results-section" style="margin-top: 2rem;"><h2 class="results-header">${title}</h2><table class="results-table"><thead><tr><th>Word</th><th>Jewish</th><th>English</th><th>Simple</th><th>Search Count</th></tr></thead><tbody>`;
        if (matches.length > 0) {
            matches.forEach(match => {
                const highlightClass = searchedWord && match.word.toLowerCase() === searchedWord.toLowerCase() ? 'highlight' : '';
                tableHtml += `<tr class="${highlightClass}"><td><a href="?word=${encodeURIComponent(match.word)}">${match.word}</a></td><td>${match.jewish}</td><td>${match.english}</td><td>${match.simple}</td><td>${match.searchCount || 0}</td></tr>`;
            });
        } else {
            tableHtml += `<tr><td colspan="5">No matching words found.</td></tr>`;
        }
        tableHtml += `</tbody></table></div>`;
        return tableHtml;
    }

    function displayWordResults(word, values) {
        let breakdownContainer = `<div class="breakdown-container">${createBreakdownHtml(word, 'jewish', values.jewish)}${createBreakdownHtml(word, 'english', values.english)}${createBreakdownHtml(word, 'simple', values.simple)}</div>`;
        const wordsArray = Object.values(wordDatabase);

        const jewishMatches = wordsArray.filter(entry => entry.jewish === values.jewish);
        const englishSimpleMatches = wordsArray.filter(entry => entry.english === values.english || entry.simple === values.simple);

        let tablesHtml = createResultsTable(`Matches for Jewish Gematria (${values.jewish})`, jewishMatches, word);
        tablesHtml += createResultsTable(`Matches for English/Simple Gematria`, englishSimpleMatches, word);
        
        resultsArea.innerHTML = breakdownContainer + tablesHtml;
    }

    function displayNumericResults(number) {
        const wordsArray = Object.values(wordDatabase);
        const jewishMatches = wordsArray.filter(entry => entry.jewish === number);
        const englishSimpleMatches = wordsArray.filter(entry => entry.english === number || entry.simple === number);

        let tablesHtml = createResultsTable(`Words with Jewish Gematria of ${number}`, jewishMatches);
        tablesHtml += createResultsTable(`Words with English/Simple Gematria of ${number}`, englishSimpleMatches);
        
        resultsArea.innerHTML = tablesHtml;
    }
    
    async function performCalculation(word, incrementCount = true) {
        if (!word || !word.trim()) {
            wordDisplay.textContent = '...';
            resultsArea.innerHTML = '<p style="text-align:center;">Please enter a word or number.</p>';
            return;
        }
        
        await loadDatabase();
        const cleanWord = word.trim();
        wordDisplay.textContent = `"${cleanWord}"`;
        wordInput.value = cleanWord;

        const isNumericSearch = !isNaN(cleanWord) && !isNaN(parseFloat(cleanWord));

        if (isNumericSearch) {
            displayNumericResults(parseFloat(cleanWord));
        } else {
            if (incrementCount) {
                const wordData = findWordInDatabase(cleanWord);
                if (wordData) {
                    const newCount = (wordData.entry.searchCount || 0) + 1;
                    const updates = {
                        searchCount: newCount,
                        lastSearched: new Date().toISOString()
                    };
                    if (useLocalStorageCheckbox.checked) {
                        wordDatabase[wordData.key].searchCount = newCount;
                        wordDatabase[wordData.key].lastSearched = updates.lastSearched;
                        localStorage.setItem('wordDatabase', JSON.stringify(wordDatabase));
                    } else {
                        firebase.database().ref(`words/${wordData.key}`).update(updates);
                    }
                    wordData.entry.searchCount = newCount; // Update local cache
                }
            }
            const calculatedValues = calculateGematria(cleanWord);
            displayWordResults(cleanWord, calculatedValues);
        }
    }

    async function saveWord() {
        const wordToSave = wordInput.value.trim();
        if (!wordToSave || !isNaN(wordToSave)) {
            saveStatus.textContent = 'Please enter a valid word to save.';
            saveStatus.style.color = 'tomato';
            setTimeout(() => { saveStatus.textContent = ''; }, 4000);
            return;
        }

        await loadDatabase();
        const existingWord = findWordInDatabase(wordToSave);

        if (existingWord) {
            saveStatus.textContent = `"${wordToSave}" is already in the database.`;
            saveStatus.style.color = 'orange';
        } else {
            const calculatedValues = calculateGematria(wordToSave);
            const newEntry = {
                word: wordToSave,
                ...calculatedValues,
                searchCount: 1,
                createdAt: new Date().toISOString(),
                lastSearched: new Date().toISOString()
            };

            if (useLocalStorageCheckbox.checked) {
                const newKey = `local_${Date.now()}`;
                wordDatabase[newKey] = newEntry;
                localStorage.setItem('wordDatabase', JSON.stringify(wordDatabase));
                saveStatus.textContent = `Saved "${wordToSave}" to Local Storage!`;
                saveStatus.style.color = 'lightgreen';
            } else {
                const newWordRef = firebase.database().ref('words').push();
                await newWordRef.set(newEntry);
                saveStatus.textContent = `Saved "${wordToSave}" to Firebase!`;
                saveStatus.style.color = 'lightgreen';
            }
            performCalculation(wordToSave, false); 
        }
        setTimeout(() => { saveStatus.textContent = ''; }, 4000);
    }

    function handleFormSubmit(event) {
        event.preventDefault();
        const word = wordInput.value;
        const newUrl = `${window.location.pathname}?word=${encodeURIComponent(word)}`;
        window.history.pushState({ path: newUrl }, '', newUrl);
        performCalculation(word);
    }
    
    async function handleStorageChange(event) {
        localStorage.setItem('useLocalStorage', event.target.checked);
        const urlParams = new URLSearchParams(window.location.search);
        const currentWord = urlParams.get('word');
        performCalculation(currentWord);
    }

    // --- Event Listeners ---
    gematriaForm.addEventListener('submit', handleFormSubmit);
    saveWordBtn.addEventListener('click', saveWord);
    useLocalStorageCheckbox.addEventListener('change', handleStorageChange);
    
    // --- Initial Load ---
    const initialUrlParams = new URLSearchParams(window.location.search);
    const initialWord = initialUrlParams.get('word');
    performCalculation(initialWord);
});