document.addEventListener('DOMContentLoaded', () => {
    // Expanded local database to make finding matches more likely.
    const wordDatabase = [
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

    // --- Gematria Cipher Definitions ---
    const ciphers = {
        simple: { 'a': 1, 'b': 2, 'c': 3, 'd': 4, 'e': 5, 'f': 6, 'g': 7, 'h': 8, 'i': 9, 'j': 10, 'k': 11, 'l': 12, 'm': 13, 'n': 14, 'o': 15, 'p': 16, 'q': 17, 'r': 18, 's': 19, 't': 20, 'u': 21, 'v': 22, 'w': 23, 'x': 24, 'y': 25, 'z': 26 },
        english: { 'a': 6, 'b': 12, 'c': 18, 'd': 24, 'e': 30, 'f': 36, 'g': 42, 'h': 48, 'i': 54, 'j': 60, 'k': 66, 'l': 72, 'm': 78, 'n': 84, 'o': 90, 'p': 96, 'q': 102, 'r': 108, 's': 114, 't': 120, 'u': 126, 'v': 132, 'w': 138, 'x': 144, 'y': 150, 'z': 156 },
        jewish: { 'a': 1, 'b': 2, 'c': 3, 'd': 4, 'e': 5, 'f': 6, 'g': 7, 'h': 8, 'i': 9, 'j': 600, 'k': 10, 'l': 20, 'm': 30, 'n': 40, 'o': 50, 'p': 60, 'q': 70, 'r': 80, 's': 90, 't': 100, 'u': 200, 'v': 700, 'w': 900, 'x': 300, 'y': 400, 'z': 500 }
    };

    /**
     * Calculates the Gematria values for a given text.
     */
    function calculateGematria(text) {
        const lowerText = text.toLowerCase();
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
        
        for (const char of word.toLowerCase()) {
            if (cipherMap[char]) {
                lettersHtml += `<td>${char}</td>`;
                numbersHtml += `<td>${cipherMap[char]}</td>`;
            }
        }
        
        const title = cipherName.charAt(0).toUpperCase() + cipherName.slice(1);

        return `
            <div class="breakdown-item">
                <p><strong>${word}</strong> in <strong>${title} Gematria</strong> equals <strong>${totalValue}</strong>:</p>
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
        const resultsArea = document.getElementById('results-area');
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

        if (matches.length > 0) {
            tablesHtml += `
                <table class="results-table">
                    <caption>Words with the Same Gematria Value</caption>
                    <thead>
                        <tr>
                            <th>Word</th>
                            <th>Jewish</th>
                            <th>English</th>
                            <th>Simple</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${matches.map(match => `
                            <tr>
                                <td><a href="calculator.html?word=${match.word}">${match.word}</a></td>
                                <td style="${match.jewish === values.jewish ? 'font-weight:bold; color:#8a2be2;' : ''}">${match.jewish}</td>
                                <td style="${match.english === values.english ? 'font-weight:bold; color:#8a2be2;' : ''}">${match.english}</td>
                                <td style="${match.simple === values.simple ? 'font-weight:bold; color:#8a2be2;' : ''}">${match.simple}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } else {
            tablesHtml += `<p style="text-align:center; margin-top:20px;">No other words in our dictionary match these values.</p>`;
        }
        
        resultsArea.innerHTML = breakdownContainer + tablesHtml;
    }

    // --- Main Execution ---
    const urlParams = new URLSearchParams(window.location.search);
    const word = urlParams.get('word');
    const wordDisplay = document.getElementById('word-display');
    const wordInput = document.getElementById('word-input');

    if (word) {
        const cleanWord = word.trim();
        wordDisplay.textContent = cleanWord;
        wordInput.value = cleanWord;

        const calculatedValues = calculateGematria(cleanWord);
        const matchingWords = findMatches(calculatedValues, cleanWord);
        displayResults(cleanWord, calculatedValues, matchingWords);
    } else {
        wordDisplay.textContent = '...';
        document.getElementById('results-area').innerHTML = '<p style="text-align:center;">Please enter a word or phrase in the search bar above.</p>';
    }
});