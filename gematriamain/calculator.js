document.addEventListener('DOMContentLoaded', () => {
    let wordDatabase = null; 

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
    const calculateBtn = document.getElementById('calculate-btn');
    const useLocalStorageCheckbox = document.getElementById('use_localstorage');
    const saveStatus = document.getElementById('save-status');
    const statsArea = document.getElementById('stats-area');

    const defaultData = [
        { word: 'God', jewish: 26, english: 204, simple: 34, searchCount: 0 }, 
        { word: 'Dog', jewish: 26, english: 162, simple: 27, searchCount: 0 },
        { word: 'Jesus', jewish: 75, english: 444, simple: 74, searchCount: 0 }, 
        { word: 'Cross', jewish: 139, english: 444, simple: 74, searchCount: 0 }
    ];

    async function loadDatabase() {
        const useLocalStorage = useLocalStorageCheckbox.checked;
        if (useLocalStorage) {
            const data = localStorage.getItem('wordDatabase');
            wordDatabase = data ? JSON.parse(data) : [...defaultData];
        } else {
            try {
                const db = firebase.database();
                const snapshot = await db.ref('words').once('value');
                const dbWords = snapshot.val();
                if (dbWords) {
                    wordDatabase = Object.entries(dbWords).map(([key, value]) => ({ ...value, firebaseKey: key }));
                } else {
                    wordDatabase = [...defaultData];
                }
            } catch (error) {
                console.error("Firebase connection failed, using default data:", error);
                wordDatabase = [...defaultData];
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

    function findMatches(calculatedValues, originalWord) {
        if (!wordDatabase) return [];
        const lowerOriginalWord = originalWord.toLowerCase();
        return wordDatabase.filter(entry =>
            entry.word.toLowerCase() !== lowerOriginalWord &&
            (entry.simple === calculatedValues.simple || entry.english === calculatedValues.english || entry.jewish === calculatedValues.jewish)
        );
    }

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
        return `<div class="breakdown-item"><p><strong>"${word}"</strong> in <strong>${title} Gematria</strong> equals <strong>${totalValue}</strong>:</p><table class="breakdown-table"><tbody><tr class="breakdown-letters">${lettersHtml}</tr><tr class="breakdown-numbers">${numbersHtml}</tr></tbody></table></div>`;
    }

    function displayResults(word, values, matches, searchCount) {
        let breakdownContainer = `<div class="breakdown-container">${createBreakdownHtml(word, 'jewish', values.jewish)}${createBreakdownHtml(word, 'english', values.english)}${createBreakdownHtml(word, 'simple', values.simple)}</div>`;
        let tablesHtml = `<table class="results-table"><caption>Gematria Values for "${word}"</caption><thead><tr><th>Jewish</th><th>English</th><th>Simple</th></tr></thead><tbody><tr><td>${values.jewish}</td><td>${values.english}</td><td>${values.simple}</td></tr></tbody></table>`;
        
        const jewishMatches = matches.filter(match => match.jewish === values.jewish);
        const otherMatches = matches.filter(match => (match.english === values.english || match.simple === values.simple) && !jewishMatches.some(m => m.word === match.word));

        tablesHtml += `<table class="results-table"><caption>Matches for Jewish Gematria (${values.jewish})</caption><thead><tr><th>Word</th><th>Jewish</th><th>English</th><th>Simple</th></tr></thead><tbody>`;
        if (jewishMatches.length > 0) {
            jewishMatches.forEach(match => tablesHtml += `<tr><td><a href="?word=${encodeURIComponent(match.word)}">${match.word}</a></td><td style="font-weight:bold; color:#c8a2c8;">${match.jewish}</td><td>${match.english}</td><td>${match.simple}</td></tr>`);
        } else {
            tablesHtml += `<tr><td colspan="4">No matching words found for this value.</td></tr>`;
        }
        tablesHtml += `</tbody></table>`;
        
        tablesHtml += `<table class="results-table"><caption>Matches for Simple / English Gematria</caption><thead><tr><th>Word</th><th>Jewish</th><th>English</th><th>Simple</th></tr></thead><tbody>`;
        if (otherMatches.length > 0) {
            otherMatches.forEach(match => tablesHtml += `<tr><td><a href="?word=${encodeURIComponent(match.word)}">${match.word}</a></td><td>${match.jewish}</td><td style="${match.english === values.english ? 'font-weight:bold; color:#c8a2c8;' : ''}">${match.english}</td><td style="${match.simple === values.simple ? 'font-weight:bold; color:#c8a2c8;' : ''}">${match.simple}</td></tr>`);
        } else {
             tablesHtml += `<tr><td colspan="4">No matching words found for these values.</td></tr>`;
        }
        tablesHtml += `</tbody></table>`;
        
        resultsArea.innerHTML = breakdownContainer + tablesHtml;

        if (searchCount > 0) {
            statsArea.innerHTML = `This word has been searched <strong>${searchCount}</strong> time${searchCount > 1 ? 's' : ''}.`;
            statsArea.style.display = 'block';
        } else {
            statsArea.style.display = 'none';
        }
    }

    async function performCalculation(word) {
        await loadDatabase();
        if (word && word.trim()) {
            const cleanWord = word.trim();
            wordDisplay.textContent = `"${cleanWord}"`;
            wordInput.value = cleanWord;
            const calculatedValues = calculateGematria(cleanWord);
            const matchingWords = findMatches(calculatedValues, cleanWord);

            let currentSearchCount = 0;
            const wordEntry = wordDatabase.find(entry => entry.word.toLowerCase() === cleanWord.toLowerCase());

            if (wordEntry) {
                wordEntry.searchCount = (wordEntry.searchCount || 0) + 1;
                wordEntry.lastSearched = new Date().toISOString();
                currentSearchCount = wordEntry.searchCount;

                if (useLocalStorageCheckbox.checked) {
                    localStorage.setItem('wordDatabase', JSON.stringify(wordDatabase));
                } else if (wordEntry.firebaseKey) {
                    firebase.database().ref('words/' + wordEntry.firebaseKey).update({
                        searchCount: wordEntry.searchCount,
                        lastSearched: wordEntry.lastSearched
                    });
                }
            }
            
            displayResults(cleanWord, calculatedValues, matchingWords, currentSearchCount);
        } else {
            wordDisplay.textContent = '...';
            resultsArea.innerHTML = '<p style="text-align:center;">Please enter a word or phrase.</p>';
            statsArea.style.display = 'none';
        }
    }

    async function saveWord() {
        await loadDatabase(); 
        const wordToSave = wordInput.value.trim();
        if (!wordToSave) {
            saveStatus.textContent = 'Please enter a word to save.';
            saveStatus.style.color = 'tomato';
        } else if (wordDatabase.some(entry => entry.word.toLowerCase() === wordToSave.toLowerCase())) {
            saveStatus.textContent = `"${wordToSave}" is already in the database.`;
            saveStatus.style.color = 'orange';
        } else {
            const calculatedValues = calculateGematria(wordToSave);
            const newEntry = { 
                word: wordToSave, 
                ...calculatedValues,
                searchCount: 1,
                lastSearched: new Date().toISOString()
            };

            if (useLocalStorageCheckbox.checked) {
                wordDatabase.push(newEntry);
                localStorage.setItem('wordDatabase', JSON.stringify(wordDatabase));
                saveStatus.textContent = `Saved "${wordToSave}" to local storage!`;
                saveStatus.style.color = 'lightgreen';
            } else {
                try {
                    const newWordRef = firebase.database().ref('words').push();
                    await newWordRef.set(newEntry);
                    saveStatus.textContent = `Saved "${wordToSave}" to Firebase!`;
                    saveStatus.style.color = 'lightgreen';
                } catch(error) {
                      saveStatus.textContent = `Failed to save to Firebase.`;
                      saveStatus.style.color = 'tomato';
                }
            }
            performCalculation(wordToSave); 
        }
        setTimeout(() => { saveStatus.textContent = ''; }, 4000);
    }

    function handleCalculation() {
        const word = wordInput.value;
        if (!word) return;
        const newUrl = `${window.location.pathname}?word=${encodeURIComponent(word)}`;
        window.history.pushState({ path: newUrl }, '', newUrl);
        performCalculation(word);
    }

    calculateBtn.addEventListener('click', handleCalculation);
    gematriaForm.addEventListener('submit', (event) => {
        event.preventDefault();
        handleCalculation();
    });
    saveWordBtn.addEventListener('click', saveWord);
    useLocalStorageCheckbox.addEventListener('change', () => performCalculation(wordInput.value));

    const initialUrlParams = new URLSearchParams(window.location.search);
    const initialWord = initialUrlParams.get('word');
    if (initialWord) {
        performCalculation(initialWord);
    }
});

