document.addEventListener('DOMContentLoaded', () => {
    let wordDatabase = null; // Will be populated from either Firebase or localStorage

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

    // Default data if no other source is available
    const defaultData = [
        { word: 'God', jewish: 26, english: 204, simple: 34 },
        { word: 'Dog', jewish: 26, english: 162, simple: 27 },
        { word: 'Jesus', jewish: 75, english: 444, simple: 74 },
        { word: 'Cross', jewish: 139, english: 444, simple: 74 },
        { word: 'Love', jewish: 95, english: 318, simple: 53 },
        { word: 'Devil', jewish: 47, english: 318, simple: 53 },
        { word: 'Hate', jewish: 49, english: 222, simple: 37 },
        { word: 'Sun', jewish: 104, english: 330, simple: 55 },
        { word: 'Moon', jewish: 97, english: 336, simple: 56 },
        { word: 'Human', jewish: 82, english: 336, simple: 56 },
        { word: 'Truth', jewish: 74, english: 546, simple: 91 },
        { word: 'Life', jewish: 60, english: 210, simple: 35 },
        { word: 'Die', jewish: 14, english: 108, simple: 18 },
        { word: 'Blood', jewish: 65, english: 282, simple: 47 },
        { word: 'Holy', jewish: 454, english: 378, simple: 63 },
        { word: 'Spirit', jewish: 198, english: 522, simple: 87 }
    ];

    /**
     * Loads the word database based on the checkbox state.
     */
    async function loadDatabase() {
        // Check if the checkbox element exists before accessing its checked property
        const useLocalStorage = useLocalStorageCheckbox ? useLocalStorageCheckbox.checked : false;

        if (useLocalStorage) {
            const data = localStorage.getItem('wordDatabase');
            wordDatabase = data ? JSON.parse(data) : defaultData;
        } else {
            // Assume Firebase is initialized and ready
            try {
                const snapshot = await firebase.database().ref('words').once('value');
                wordDatabase = snapshot.val() ? Object.values(snapshot.val()) : defaultData;
            } catch (error) {
                console.error("Firebase connection failed, using default data:", error);
                wordDatabase = defaultData;
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
     * Creates and displays the HTML for all results.
     */
    function displayResults(word, values, matches) {
        if (!resultsArea) return;

        let breakdownContainer = `<div class="breakdown-container">`;
        breakdownContainer += createBreakdownHtml(word, 'jewish', values.jewish);
        breakdownContainer += createBreakdownHtml(word, 'english', values.english);
        breakdownContainer += createBreakdownHtml(word, 'simple', values.simple);
        breakdownContainer += `</div>`;

        let tablesHtml = `
            <table class="results-table">
                <caption>Gematria Values for "${word}"</caption>
                <thead>
                    <tr>
                        <th>Jewish Gematria</th>
                        <th>English Gematria</th>
                        <th>Simple Gematria</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>${values.jewish}</td>
                        <td>${values.english}</td>
                        <td>${values.simple}</td>
                    </tr>
                </tbody>
            </table>
        `;

        const jewishMatches = matches.filter(match => match.jewish === values.jewish);
        const otherMatches = matches.filter(match => (match.english === values.english || match.simple === values.simple) && !jewishMatches.find(m => m.word === match.word));

        // Jewish Gematria Table (always shown)
        tablesHtml += `
            <div style="text-align:center; margin-top: 2rem;">
                <img src="../icon2.png" alt="Site Icon" style="width: 100px; height: 100px; display: block; margin: 2rem auto 1rem auto; border-radius: 50%;">
                <h2 class="results-header">Matches for Jewish Gematria (${values.jewish})</h2>
            </div>
            <table class="results-table">
                <thead>
                    <tr>
                        <th>Word</th>
                        <th>Jewish</th>
                        <th>English</th>
                        <th>Simple</th>
                    </tr>
                </thead>
                <tbody>
                    ${jewishMatches.length > 0 ? 
                        jewishMatches.map(match => `
                            <tr>
                                <td><a href="calculator.html?word=${encodeURIComponent(match.word)}">${match.word}</a></td>
                                <td style="font-weight:bold; color:#c8a2c8;">${match.jewish}</td>
                                <td>${match.english}</td>
                                <td>${match.simple}</td>
                            </tr>
                        `).join('') : 
                        `<tr><td colspan="4" style="text-align:center; padding: 2rem; color: #888;">No matching words found for this value.</td></tr>`
                    }
                </tbody>
            </table>
        `;

        // Simple / English Gematria Table (always shown)
        tablesHtml += `
            <div style="text-align:center; margin-top: 2rem;">
                <img src="../icon4.png" alt="Site Icon" style="width: 100px; height: 100px; display: block; margin: 2rem auto 1rem auto; border-radius: 50%;">
                <h2 class="results-header">Matches for Simple / English Gematria</h2>
            </div>
            <table class="results-table">
                 <thead>
                    <tr>
                        <th>Word</th>
                        <th>Jewish</th>
                        <th>English</th>
                        <th>Simple</th>
                    </tr>
                </thead>
                <tbody>
                    ${otherMatches.length > 0 ? 
                        otherMatches.map(match => `
                            <tr>
                                <td><a href="calculator.html?word=${encodeURIComponent(match.word)}">${match.word}</a></td>
                                <td>${match.jewish}</td>
                                <td style="${match.english === values.english ? 'font-weight:bold; color:#c8a2c8;' : ''}">${match.english}</td>
                                <td style="${match.simple === values.simple ? 'font-weight:bold; color:#c8a2c8;' : ''}">${match.simple}</td>
                            </tr>
                        `).join('') :
                        `<tr><td colspan="4" style="text-align:center; padding: 2rem; color: #888;">No matching words found for these values.</td></tr>`
                    }
                </tbody>
            </table>
        `;
        
        resultsArea.innerHTML = breakdownContainer + tablesHtml;
    }

    /**
     * Main function to perform calculation and display.
     */
    async function performCalculation(word) {
        await loadDatabase(); // Ensure the database is loaded before calculating
        if (word && word.trim()) {
            const cleanWord = word.trim();
            wordDisplay.textContent = `"${cleanWord}"`;
            wordInput.value = cleanWord;

            const calculatedValues = calculateGematria(cleanWord);
            const matchingWords = findMatches(calculatedValues, cleanWord);
            displayResults(cleanWord, calculatedValues, matchingWords);
        } else {
            wordDisplay.textContent = '...';
            if(resultsArea) {
                resultsArea.innerHTML = '<p style="text-align:center;">Please enter a word or phrase in the search bar above.</p>';
            }
        }
    }

    /**
     * Saves a new word to the temporary database.
     */
    async function saveWord() {
        // Ensure the database is loaded before trying to use it
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
                    simple: calculatedValues.simple
                };
                
                if (useLocalStorageCheckbox && useLocalStorageCheckbox.checked) {
                    wordDatabase.push(newEntry);
                    localStorage.setItem('wordDatabase', JSON.stringify(wordDatabase));
                    saveStatus.textContent = `Successfully saved "${wordToSave}" to local storage!`;
                    saveStatus.style.color = 'lightgreen';
                } else {
                    // Save to Firebase
                    const newWordRef = firebase.database().ref('words').push();
                    await newWordRef.set(newEntry);
                    saveStatus.textContent = `Successfully saved "${wordToSave}" to Firebase!`;
                    saveStatus.style.color = 'lightgreen';
                }

                // Re-run the calculation to update the list
                const urlParams = new URLSearchParams(window.location.search);
                const currentWord = urlParams.get('word');
                if (currentWord && currentWord.trim().toLowerCase() === wordToSave.toLowerCase()) {
                    performCalculation(currentWord);
                }
            }
        } else {
            saveStatus.textContent = 'Please enter a word to save.';
            saveStatus.style.color = 'tomato';
        }

        setTimeout(() => { saveStatus.textContent = ''; }, 4000);
    }

    // --- Event Listeners ---
    if (gematriaForm) {
        gematriaForm.addEventListener('submit', (event) => {
            event.preventDefault(); // Prevents page reload
            const word = wordInput.value;
            // Update URL without reloading
            const newUrl = `${window.location.pathname}?word=${encodeURIComponent(word)}`;
            window.history.pushState({ path: newUrl }, '', newUrl);
            performCalculation(word);
        });
    }

    if (saveWordBtn) {
        saveWordBtn.addEventListener('click', saveWord);
    }
    
    // Listen for changes on the new checkbox
    if (useLocalStorageCheckbox) {
        useLocalStorageCheckbox.addEventListener('change', async (event) => {
            // Save the state of the checkbox
            localStorage.setItem('useLocalStorage', event.target.checked);
            
            // Reload the database based on the new state
            await loadDatabase();
            
            // Re-perform calculation for the current word
            const initialUrlParams = new URLSearchParams(window.location.search);
            const initialWord = initialUrlParams.get('word');
            performCalculation(initialWord);
        });
    }
    
    // --- Initial Load ---
    // Check for a word in the URL when the page first loads
    const initialUrlParams = new URLSearchParams(window.location.search);
    const initialWord = initialUrlParams.get('word');
    performCalculation(initialWord);
});
