// --- GLOBAL STATE & CONSTANTS ---
let CIPHERS = {};
const CIPHER_DESCRIPTIONS = {};
const PHI = 1.618033988749895;
const GOLDEN_ANGLE = 137.50776405;

// --- DOM ELEMENTS ---
const cipherListContainer = document.getElementById('cipher-list-container');
const internalNavContainer = document.getElementById('internal-nav-container');
const themeToggleButton = document.getElementById('theme-toggle');

// --- UTILITY: NUMBER ANALYSIS ---
function recursiveDigitSum(n) {
    let val = Math.abs(Math.round(n));
    while (val > 9) {
        val = String(val).split('').reduce((sum, digit) => sum + parseInt(digit, 10), 0);
    }
    return val;
}

// --- GEMATRIA CIPHER DEFINITIONS (This must be kept in sync with other JS files) ---
function buildGematriaCiphers() {
    const a = 'abcdefghijklmnopqrstuvwxyz';
    const simpleMap = {};
    a.split('').forEach((l, i) => { simpleMap[l] = i + 1; });

    const jewishValues = { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8, i: 9, k: 10, l: 20, m: 30, n: 40, o: 50, p: 60, q: 70, r: 80, s: 90, t: 100, u: 200, x: 300, y: 400, z: 500, j: 600, v: 700, w: 900 };
    
    const qwertyMap = {};
    'qwertyuiopasdfghjklzxcvbnm'.split('').forEach((l, i) => { qwertyMap[l] = i + 1; });
    const leftHand = 'qwertasdfgzxcvb'.split('');
    const rightHand = 'yuiophjklnm'.split('');
    
    const freqMap = { e: 26, t: 25, a: 24, o: 23, i: 22, n: 21, s: 20, h: 19, r: 18, d: 17, l: 16, c: 15, u: 14, m: 13, w: 12, f: 11, g: 10, y: 9, p: 8, b: 7, v: 6, k: 5, j: 4, x: 3, q: 2, z: 1 };

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
        "Left-Hand Qwerty": (text) => text.toLowerCase().replace(/[^a-z]/g, '').split('').filter(c => leftHand.includes(c)).reduce((sum, char) => sum + (qwertyMap[char] || 0), 0),
        "Right-Hand Qwerty": (text) => text.toLowerCase().replace(/[^a-z]/g, '').split('').filter(c => rightHand.includes(c)).reduce((sum, char) => sum + (qwertyMap[char] || 0), 0),
        "Binary Sum": (text) => text.split('').map(c => c.charCodeAt(0).toString(2)).join('').split('').reduce((sum, bit) => sum + (bit === '1' ? 1 : 0), 0),
        "Frequent Letters": (text) => text.toLowerCase().replace(/[^a-z]/g, '').split('').reduce((sum, char) => sum + (freqMap[char] || 0), 0),
        "Spiral Gematria": (text) => {
            const cleaned = text.toLowerCase().replace(/[^a-z]/g, '');
            return Math.round(cleaned.split('').reduce((sum, char, i) => sum + (simpleMap[char] || 0) * Math.cos(GOLDEN_ANGLE * (i + 1)), 0));
        },
        "Golden Ratio Position": (text) => {
            const cleaned = text.toLowerCase().replace(/[^a-z]/g, '');
            return Math.round(cleaned.split('').reduce((sum, char, i) => sum + (simpleMap[char] || 0) * Math.pow(PHI, i), 0));
        },
         "SGRR Signal Signature": (text) => {
            const charValue = (char) => {
                let val = recursiveDigitSum(char.charCodeAt(0));
                return val === 9 ? 9 : val % 3 === 0 ? 3 : 6;
            };
            const wordSignal = (word) => {
                let val = recursiveDigitSum(word.split('').reduce((s, c) => s + charValue(c), 0));
                 return val === 9 ? 9 : val % 3 === 0 ? 3 : 6;
            };
            const fib = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89];
            const words = text.split(/\s+/).filter(Boolean);
            const totalSignal = words.reduce((sum, word, i) => sum + wordSignal(word) * (fib[i] || 144), 0);
            return totalSignal / PHI;
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

// --- CIPHER DESCRIPTIONS & CATEGORIES ---
function buildCipherDescriptions() {
    return {
        "English Ordinal": {
            description: "The most fundamental cipher. Each letter is assigned its numerical position in the alphabet (A=1, B=2, ..., Z=26).",
            category: "Core Ciphers"
        },
        "Reverse Ordinal": {
            description: "The alphabet is reversed, assigning Z=1, Y=2, ..., A=26. This often reveals hidden or 'shadow' meanings.",
            category: "Core Ciphers"
        },
        "Full Reduction": {
            description: "A numerological cipher where letter values are reduced to a single digit (1-9) by repeatedly summing their digits if necessary (e.g., K=11 -> 1+1=2). It reveals the core vibrational essence of a word.",
            category: "Core Ciphers"
        },
        "Reverse Full Reduction": {
            description: "Applies the Full Reduction principle to the reversed alphabet values (Z=1, Y=2, etc.).",
            category: "Core Ciphers"
        },
        "Jewish Gematria": {
            description: "Uses the Hebrew letter values applied to the English alphabet, featuring values that increase in tens and hundreds (e.g., K=10, L=20, S=90, T=100).",
            category: "Core Ciphers"
        },
        "Sumerian": {
            description: "An ancient system where letter values are multiples of 6 (A=6, B=12, C=18, etc.), reflecting a base-60 counting system.",
            category: "Core Ciphers"
        },
        "Chaldean": {
            description: "An ancient system based on the sound of letters, assigning values from 1 to 8. It is considered one of the oldest forms of numerology.",
            category: "Core Ciphers"
        },
        "Qwerty Gematria": {
            description: "Assigns values based on the letter's position on a standard QWERTY keyboard, starting from left-to-right, top-to-bottom (Q=1, W=2, etc.).",
            category: "Keyboard Ciphers"
        },
        "Left-Hand Qwerty": {
            description: "A variation of Qwerty Gematria that only sums the values of letters typed with the left hand.",
            category: "Keyboard Ciphers"
        },
        "Right-Hand Qwerty": {
            description: "A variation of Qwerty Gematria that only sums the values of letters typed with the right hand.",
            category: "Keyboard Ciphers"
        },
        "Phone Keypad": {
            description: "Assigns values based on the standard telephone keypad layout (A,B,C=2; D,E,F=3, etc.).",
            category: "Alternative Systems"
        },
        "Spiral Gematria": {
            description: "A complex positional cipher that weights each letter's ordinal value by the cosine of the Golden Angle (137.5°) multiplied by its position, creating a spiral or wave-like calculation.",
            category: "Positional & Esoteric Ciphers"
        },
        "Golden Ratio Position": {
            description: "A positional cipher where each letter's ordinal value is multiplied by the golden ratio (φ ≈ 1.618) raised to the power of its position in the word.",
            category: "Positional & Esoteric Ciphers"
        },
        "SGRR Signal Signature": {
            description: "A multi-step framework calculating a 'Signal Signature' using recursive character values, Fibonacci positional weights, and Golden Ratio coherence.",
            category: "Positional & Esoteric Ciphers"
        },
        "ASCII Sum": {
            description: "Calculates the value by summing the standard ASCII computer codes of each character in the word, including case, symbols, and spaces.",
            category: "Computational Ciphers"
        },
        "Binary Sum": {
            description: "Converts each character in a word to its 8-bit binary representation (e.g., 'A' is 01000001) and then counts the total number of '1s'.",
            category: "Computational Ciphers"
        },
        // Descriptions for Base-N
        ...Object.fromEntries([...Array(11).keys()].map(i => [`Base-${i + 2} Sum`, {
            description: `Calculates the English Ordinal value, converts it to a Base-${i + 2} number, and then sums the digits of the new number.`,
            category: "Computational Ciphers"
        }])),
        // Generic description for Reverse ciphers
        ...Object.keys(buildGematriaCiphers()).filter(k => k.startsWith("Reverse")).reduce((acc, key) => {
            acc[key] = {
                description: `Applies the '${key.replace("Reverse ", "")}' calculation to the reversed version of the word (e.g., 'BEANS' becomes 'SNAEB').`,
                category: "Reverse Ciphers"
            };
            return acc;
        }, {})
    };
}


// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    Object.assign(CIPHERS, buildGematriaCiphers());
    Object.assign(CIPHER_DESCRIPTIONS, buildCipherDescriptions());
    setupTheme();
    displayCipherList();
});

// --- DISPLAY FUNCTION ---
function displayCipherList() {
    const categories = {};
    const sortedCiphers = Object.keys(CIPHERS).sort();

    // Group ciphers by category
    for (const cipherName of sortedCiphers) {
        const info = CIPHER_DESCRIPTIONS[cipherName];
        if (!info) continue;
        
        if (!categories[info.category]) {
            categories[info.category] = [];
        }
        categories[info.category].push(cipherName);
    }
    
    let internalNavHtml = '';
    let listHtml = '';

    const sortedCategories = Object.keys(categories).sort();

    for (const category of sortedCategories) {
        const categoryId = category.replace(/\s+/g, '-').toLowerCase();
        internalNavHtml += `<a href="#${categoryId}">${category}</a>`;
        listHtml += `<section id="${categoryId}"><h2>${category}</h2>`;

        for (const cipherName of categories[category]) {
            listHtml += createCipherCard(cipherName);
        }
        listHtml += `</section>`;
    }
    
    internalNavContainer.innerHTML = internalNavHtml;
    cipherListContainer.innerHTML = listHtml;
}

function createCipherCard(cipherName) {
    const description = CIPHER_DESCRIPTIONS[cipherName]?.description || "No description available.";
    const exampleWord = "BEANS";
    const exampleValue = CIPHERS[cipherName](exampleWord);
    
    let breakdownHtml = '';
    const displayableCiphers = ["English Ordinal", "Reverse Ordinal", "Full Reduction", "Jewish Gematria"];
    if (displayableCiphers.includes(cipherName)) {
        const cleaned = exampleWord.toLowerCase();
        breakdownHtml = '<div class="breakdown-calculation">';
        for (let i = 0; i < cleaned.length; i++) {
            const char = cleaned[i];
            const tempCipher = { [cipherName]: CIPHERS[cipherName] };
            const value = tempCipher[cipherName](char);
            breakdownHtml += `<div class="char-value"><span class="char">${char.toUpperCase()}</span><span class="value">${value}</span></div>`;
            if (i < cleaned.length - 1) {
                breakdownHtml += `<div class="operator">+</div>`;
            }
        }
        breakdownHtml += `<div class="operator">=</div><div class="total">${exampleValue}</div></div>`;
    } else {
        breakdownHtml = `<div class="breakdown-calculation"><span class="total">${exampleValue}</span></div>`;
    }

    return `
        <div class="cipher-card">
            <h3>${cipherName}</h3>
            <p>${description}</p>
            <div class="example-container">
                <span class="example-label">Example ("${exampleWord}"):</span>
                ${breakdownHtml}
            </div>
        </div>
    `;
}


// --- THEME & HELPERS ---
function setupTheme() {
    const savedTheme = localStorage.getItem('gematria-theme') || 'dark';
    document.body.setAttribute('data-theme', savedTheme);
    if (themeToggleButton) {
        themeToggleButton.addEventListener('click', () => {
            let currentTheme = document.body.getAttribute('data-theme');
            let newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.body.setAttribute('data-theme', newTheme);
            localStorage.setItem('gematria-theme', newTheme);
        });
    }
}

