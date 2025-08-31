// NEW: Import Firestore functions and the initialized app from the window
import { getFirestore, collection, doc, getDocs, runTransaction, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";
const db = getFirestore(window.firebaseApp);

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
        { word: 'God', jewish: 26, english: 204, simple: 34 }, { word: 'Dog', jewish: 26, english: 162, simple: 27 },
        { word: 'Jesus', jewish: 75, english: 444, simple: 74 }, { word: 'Cross', jewish: 139, english: 444, simple: 74 },
        { word: 'Love', jewish: 95, english: 318, simple: 53 }, { word: 'Devil', jewish: 47, english: 318, simple: 53 },
        { word: 'Hate', jewish: 49, english: 222, simple: 37 }, { word: 'Sun', jewish: 104, english: 330, simple: 55 },
        { word: 'Moon', jewish: 97, english: 336, simple: 56 }, { word: 'Human', jewish: 82, english: 336, simple: 56 },
        { word: 'Truth', jewish: 74, english: 546, simple: 91 }, { word: 'Life', jewish: 60, english: 210, simple: 35 },
        { word: 'Die', jewish: 14, english: 108, simple: 18 }, { word: 'Blood', jewish: 65, english: 282, simple: 47 },
        { word: 'Holy', jewish: 454, english: 378, simple: 63 }, { word: 'Spirit', jewish: 198, english: 522, simple: 87 }
    ];

    async function loadDatabase() {
        const useLocalStorage = useLocalStorageCheckbox ? useLocalStorageCheckbox.checked : false;
        if (useLocalStorage) {
            const data = localStorage.getItem('wordDatabase');
            wordDatabase = data ? JSON.parse(data) : [...defaultData];
        } else {
            try {
                const querySnapshot = await getDocs(collection(db, "wordDatabase"));
                const firebaseWords = [];
                querySnapshot.forEach((doc) => {
                    firebaseWords.push(doc.data());
                });
                wordDatabase = firebaseWords.length > 0 ? firebaseWords : [...defaultData];
            } catch (error) {
                console.error("Firebase connection failed, using default data:", error);
                wordDatabase = [...defaultData];
            }
        }
    }

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

    function findMatches(calculatedValues, originalWord) {
        if (!wordDatabase) return [];
        return wordDatabase.filter(entry =>
            entry.word.toLowerCase() !== originalWord.toLowerCase() &&
            (entry.simple === calculatedValues.simple ||
             entry.english === calculatedValues.english ||
             entry.jewish === calculatedValues.jewish)
        );
    }
    
    // The createBreakdownHtml and displayResults functions can stay the same.
    // Make sure you copy them from your original file. For brevity, they are omitted here.
    function createBreakdownHtml(word, cipherName, totalValue) { /* ... copy from original ... */ }
    function displayResults(word, values, matches) { /* ... copy from original ... */ }


    async function logSearchToFirebase(term) {
        if (!term) return;
        try {
            // 1. Add to 'searchHistory' for "Recent Searches"
            await addDoc(collection(db, 'searchHistory'), {
                term: term,
                timestamp: serverTimestamp() // Firestore adds the current time
            });

            // 2. Update 'searches' for "Most Searched" using a transaction
            const searchDocRef = doc(db, 'searches', term.toLowerCase());
            await runTransaction(db, async (transaction) => {
                const searchDoc = await transaction.get(searchDocRef);
                const newCount = searchDoc.exists() ? searchDoc.data().count + 1 : 1;
                transaction.set(searchDocRef, { count: newCount }, { merge: true });
            });
        } catch (error) {
            console.error("Error logging search to Firebase:", error);
        }
    }

    async function performCalculation(word) {
        if (!word || !word.trim()) {
            wordDisplay.textContent = '...';
            resultsArea.innerHTML = '<p style="text-align:center;">Please enter a word or phrase.</p>';
            return;
        }
        
        const cleanWord = word.trim();
        wordDisplay.textContent = `"${cleanWord}"`;
        wordInput.value = cleanWord;

        // NEW: Log the search to Firestore if not using local storage
        if (!useLocalStorageCheckbox.checked) {
            await logSearchToFirebase(cleanWord);
        }

        await loadDatabase();
        const calculatedValues = calculateGematria(cleanWord);
        const matchingWords = findMatches(calculatedValues, cleanWord);
        displayResults(cleanWord, calculatedValues, matchingWords);
    }

    async function saveWord() {
        const wordToSave = wordInput.value.trim();
        if (!wordToSave) {
            saveStatus.textContent = 'Please enter a word to save.';
            saveStatus.style.color = 'tomato';
            setTimeout(() => { saveStatus.textContent = ''; }, 4000);
            return;
        }

        await loadDatabase();
        const exists = wordDatabase.some(entry => entry.word.toLowerCase() === wordToSave.toLowerCase());

        if (exists) {
            saveStatus.textContent = `"${wordToSave}" is already in the database.`;
            saveStatus.style.color = 'orange';
        } else {
            const calculatedValues = calculateGematria(wordToSave);
            const newEntry = {
                word: wordToSave,
                ...calculatedValues
            };
            
            if (useLocalStorageCheckbox.checked) {
                wordDatabase.push(newEntry);
                localStorage.setItem('wordDatabase', JSON.stringify(wordDatabase));
                saveStatus.textContent = `Saved "${wordToSave}" to local storage!`;
                saveStatus.style.color = 'lightgreen';
            } else {
                try {
                    // UPDATED: Save to Firestore 'wordDatabase' collection with a timestamp
                    await addDoc(collection(db, 'wordDatabase'), {
                        ...newEntry,
                        createdAt: serverTimestamp()
                    });
                    saveStatus.textContent = `Saved "${wordToSave}" to Firebase!`;
                    saveStatus.style.color = 'lightgreen';
                } catch (error) {
                    console.error("Error saving to Firebase:", error);
                    saveStatus.textContent = 'Error saving to Firebase.';
                    saveStatus.style.color = 'tomato';
                }
            }
            // Refresh the current calculation to show the newly added word if relevant
            performCalculation(wordInput.value);
        }
        setTimeout(() => { saveStatus.textContent = ''; }, 4000);
    }

    // --- Event Listeners & Initial Load ---
    if (gematriaForm) {
        gematriaForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const word = wordInput.value;
            const newUrl = `${window.location.pathname}?word=${encodeURIComponent(word)}`;
            window.history.pushState({ path: newUrl }, '', newUrl);
            performCalculation(word);
        });
    }

    if (saveWordBtn) {
        saveWordBtn.addEventListener('click', saveWord);
    }
    
    if (useLocalStorageCheckbox) {
        useLocalStorageCheckbox.addEventListener('change', () => {
            const currentWord = wordInput.value;
            performCalculation(currentWord);
        });
    }
    
    const initialUrlParams = new URLSearchParams(window.location.search);
    const initialWord = initialUrlParams.get('word');
    performCalculation(initialWord);
});