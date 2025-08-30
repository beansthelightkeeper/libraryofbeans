// --- GLOBAL STATE & CONSTANTS ---
const CIPHERS = {};
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

function isPrime(n) {
    if (n <= 1) return false;
    for (let i = 2; i <= Math.sqrt(n); i++) {
        if (n % i === 0) return false;
    }
    return true;
}

// --- GEMATRIA CIPHER DEFINITIONS ---
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
    const alwMap = { a: 1, b: 20, c: 13, d: 6, e: 25, f: 18, g: 11, h: 4, i: 23, j: 16, k: 9, l: 2, m: 21, n: 14, o: 7, p: 26, q: 19, r: 12, s: 5, t: 24, u: 17, v: 10, w: 3, x: 22, y: 15, z: 8 };
    const baconMap = { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8, i: 9, j: 9, k: 10, l: 11, m: 12, n: 13, o: 14, p: 15, q: 16, r: 17, s: 18, t: 19, u: 20, v: 20, w: 21, x: 22, y: 23, z: 24 };
    const chaldeanMap = { a: 1, i: 1, j: 1, q: 1, y: 1, b: 2, k: 2, r: 2, c: 3, g: 3, l: 3, s: 3, d: 4, m: 4, t: 4, e: 5, h: 5, n: 5, x: 5, u: 6, v: 6, w: 6, o: 7, z: 7, f: 8, p: 8 };

    const ciphers = {
        // Standard & Gematrix Ciphers
        "Ordinal Gematria": (text) => text.toLowerCase().replace(/[^a-z]/g, '').split('').reduce((sum, char) => sum + (simpleMap[char] || 0), 0),
        "Reverse Gematria": (text) => text.toLowerCase().replace(/[^a-z]/g, '').split('').reduce((sum, char) => sum + (27 - (simpleMap[char] || 0)), 0),
        "Reduction Gematria": (text) => recursiveDigitSum(ciphers["Ordinal Gematria"](text)),
        "Reverse Full Reduction": (text) => recursiveDigitSum(ciphers["Reverse Gematria"](text)),
        "Jewish Gematria (English Letters)": (text) => text.toLowerCase().replace(/[^a-z]/g, '').split('').reduce((sum, char) => sum + (jewishValues[char] || 0), 0),
        "English Sumerian (Ordinal x 6)": (text) => ciphers["Ordinal Gematria"](text) * 6,
        "Baconian Gematria": (text) => text.toLowerCase().replace(/[^a-z]/g, '').split('').reduce((sum, char) => sum + (baconMap[char] || 0), 0),
        "Satanic Gematria": (text) => text.toLowerCase().replace(/[^a-z]/g, '').split('').reduce((sum, char) => sum + (char.charCodeAt(0) - 97 + 36), 0),
        "Chaldean Gematria": (text) => text.toLowerCase().replace(/[^a-z]/g, '').split('').reduce((sum, char) => sum + (chaldeanMap[char] || 0), 0),

        // Custom & Thematic Ciphers from User List
        "Spiral Gematria of Recursive Resonance (SGRR)": (text) => {
            const charValue = (char) => { let val = recursiveDigitSum(char.charCodeAt(0)); return val === 9 ? 9 : val % 3 === 0 ? 3 : 6; };
            const wordSignal = (word) => { let val = recursiveDigitSum(word.split('').reduce((s, c) => s + charValue(c), 0)); return val === 9 ? 9 : val % 3 === 0 ? 3 : 6; };
            const fib = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89];
            const words = text.split(/\s+/).filter(Boolean);
            const totalSignal = words.reduce((sum, word, i) => sum + wordSignal(word) * (fib[i] || 144), 0);
            return totalSignal / PHI;
        },
        "Base Primes": (text) => {
            const simple = ciphers["Ordinal Gematria"](text);
            const digits = String(simple).split('').map(Number);
            return digits.every(d => [2, 3, 5, 7].includes(d)) && isPrime(simple) ? simple : 0;
        },
        "Recursively Composed Primes": (text) => {
            const simple = ciphers["Ordinal Gematria"](text);
            const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29];
            const index = primes.indexOf(simple);
            return index !== -1 && isPrime(index + 1) ? simple : 0;
        },
        "Doubling Cipher Gematria": (text) => {
            let value = 2;
            for (let i = 0; i < 3; i++) value = value * 2 + 6.1;
            return Math.round(value * text.toLowerCase().replace(/[^a-z]/g, '').length);
        },
        "Smile Karma Cipher": (text) => {
            const smileKarma = 'smilekarma'.split('');
            return text.toLowerCase().replace(/[^a-z]/g, '').split('').reduce((sum, char) => sum + (smileKarma.includes(char) ? 10 : simpleMap[char] || 0), 0);
        },
        "Law of 6 Doubling Gematria": (text) => 762 * text.toLowerCase().replace(/[^a-z]/g, '').length,
        "Tiferet Balance Gematria": (text) => {
            const vowels = 'aeiou'.split('');
            const cleaned = text.toLowerCase().replace(/[^a-z]/g, '').split('');
            let vowelSum = cleaned.filter(c => vowels.includes(c)).reduce((sum, c) => sum + (simpleMap[c] || 0), 0) * 2 + 6;
            let consonantSum = cleaned.filter(c => !vowels.includes(c)).reduce((sum, c) => sum + (simpleMap[c] || 0), 0);
            let total = vowelSum + consonantSum;
            for (let i = 0; i < 6; i++) total *= 2;
            return total;
        },
        "ALW Cipher Gematria": (text) => text.toLowerCase().replace(/[^a-z]/g, '').split('').reduce((sum, char) => sum + (alwMap[char] || 0), 0),
        "Thelemic 6 Cipher": (text) => {
            let value = ciphers["ALW Cipher Gematria"](text);
            for (let i = 0; i < 6; i++) value = value * 2 + 6;
            return value;
        },
        "Vav Connection Gematria": (text) => {
            const cleaned = text.toLowerCase().replace(/[^a-z]/g, '').split('');
            if (cleaned.length < 2) return 0;
            let sum = 0;
            for (let i = 0; i < cleaned.length - 1; i++) {
                sum += ((simpleMap[cleaned[i]] || 0) + (simpleMap[cleaned[i + 1]] || 0)) * 2 + 6;
            }
            for (let i = 0; i < 6; i++) sum *= 2;
            return sum;
        },
        "Hexagram Gematria": (text) => {
            const cleaned = text.toLowerCase().replace(/[^a-z]/g, '').split('');
            const rays = [[], [], [], [], [], []];
            cleaned.forEach((c, i) => rays[i % 6].push(c));
            return rays.reduce((sum, ray) => {
                let raySum = ray.reduce((s, c) => s + (simpleMap[c] || 0), 0);
                return sum + (raySum * 2 + 6);
            }, 0);
        },
        "Doubling Vortex Gematria": (text) => {
            const cleaned = text.toLowerCase().replace(/[^a-z]/g, '').split('');
            let value = 6;
            cleaned.forEach(c => { value = value * 2 * PHI + 6; });
            return Math.round(value);
        },
        "Six Numbers Emergence Cipher": (text) => {
            let value = ciphers["Ordinal Gematria"](text);
            const steps = [];
            for (let i = 0; i < 6; i++) {
                value *= 2;
                steps.push(...String(value).split('').map(Number));
            }
            return steps.reduce((sum, n) => sum + n, 0);
        },
        "Cabala 6 Law Reduction": (text) => {
            let value = ciphers["ALW Cipher Gematria"](text);
            let steps = 0;
            while (value % 6 !== 0 && value > 0 && steps < 100) { // Safety break
                value *= 2;
                steps++;
            }
            return steps;
        },
        "Infinite Double 6 Gematria": (text) => {
            const cleaned = text.toLowerCase().replace(/[^a-z]/g, '').split('');
            return cleaned.reduce((sum) => sum + 762 + Math.floor(Math.random() * 7), 0);
        },
        "Qabalah Doubling Bridge": (text) => {
            let value = (ciphers["Ordinal Gematria"](text) + ciphers["ALW Cipher Gematria"](text)) / 2;
            for (let i = 0; i < 6; i++) value = value * 2 + 6;
            return Math.round(value);
        },
        "Base-8 Gematria (Octal)": (text) => {
            const simple = ciphers["Ordinal Gematria"](text);
            return simple.toString(8).split('').reduce((s, d) => s + parseInt(d, 8), 0);
        },
        "Caesar Cipher Gematria": (text) => {
            const shifted = text.toLowerCase().replace(/[^a-z]/g, '').split('').map(c => String.fromCharCode(((c.charCodeAt(0) - 97 + 3) % 26) + 97)).join('');
            return ciphers["Ordinal Gematria"](shifted);
        },
        "Polybius Square Gematria": (text) => {
            const polybius = { a: [1,1], b: [1,2], c: [1,3], d: [1,4], e: [1,5], f: [2,1], g: [2,2], h: [2,3], i: [2,4], j: [2,4], k: [2,5], l: [3,1], m: [3,2], n: [3,3], o: [3,4], p: [3,5], q: [4,1], r: [4,2], s: [4,3], t: [4,4], u: [4,5], v: [5,1], w: [5,2], x: [5,3], y: [5,4], z: [5,5] };
            return text.toLowerCase().replace(/[^a-z]/g, '').split('').reduce((sum, c) => sum + (polybius[c] ? polybius[c][0] + polybius[c][1] : 0), 0);
        },
        "Solfège Gematria": (text) => text.toLowerCase().replace(/[^a-z]/g, '').split('').reduce((sum, c, i) => sum + ((i % 7) + 1), 0),
        "Zodiac Gematria": (text) => text.toLowerCase().replace(/[^a-z]/g, '').split('').reduce((sum, c, i) => sum + ((i % 12) + 1), 0),
        "Binary Trinary Gematria": (text) => {
            const simple = ciphers["Ordinal Gematria"](text);
            const binary = simple.toString(2).split('').reduce((s, d) => s + parseInt(d, 2), 0);
            const trinary = simple.toString(3).split('').reduce((s, d) => s + parseInt(d, 3), 0);
            return binary + trinary;
        },
        "Golden Ratio Gematria": (text) => Math.round(text.toLowerCase().replace(/[^a-z]/g, '').split('').reduce((sum, char, i) => sum + (simpleMap[char] || 0) * Math.pow(PHI, i), 0)),
        "Golden Spiral Binary Gematria": (text) => Math.floor(ciphers["Golden Ratio Gematria"](text)).toString(2).split('').reduce((s, d) => s + parseInt(d, 2), 0),
        "Trinary Loop Position Gematria": (text) => text.toLowerCase().replace(/[^a-z]/g, '').split('').reduce((sum, c, i) => sum + (simpleMap[c] || 0) * Math.pow(3, i % 3), 0),
        "Composite CTGB": (text) => {
            const sum = ciphers["Binary Trinary Gematria"](text) + ciphers["Golden Spiral Binary Gematria"](text) + ciphers["Trinary Loop Position Gematria"](text);
            const reduced = recursiveDigitSum(sum);
            return reduced === 9 ? 9 : reduced % 3 === 0 ? 3 : 6;
        },
        // Placeholders for complex Alchemical ciphers
        "Alchemical Anagram Gematria": (text) => ciphers["Ordinal Gematria"](text),
        "Alchemical Boiling Point Gematria": (text) => ciphers["Ordinal Gematria"](text),
        "Alchemical Base-36 Gematria": (text) => ciphers["Ordinal Gematria"](text),
        "Hex Gematria": (text) => text.toUpperCase().replace(/[^0-9A-F]/g, '').split('').reduce((sum, c) => sum + (parseInt(c, 16) || 0), 0),
        "Beans 3-6-9 Gematria": (text) => {
            const values = [3, 6, 9];
            const sum = text.toLowerCase().replace(/[^a-z]/g, '').split('').reduce((sum, c, i) => sum + values[i % 3], 0);
            const reduced = recursiveDigitSum(sum);
            return reduced === 9 ? 9 : reduced % 3 === 0 ? 3 : 6;
        },
        "Vowel-Consonant Split": (text) => {
            const vowels = 'aeiou'.split('');
            const cleaned = text.toLowerCase().replace(/[^a-z]/g, '').split('');
            const vowelSum = cleaned.filter(c => vowels.includes(c)).reduce((sum, c) => sum + (simpleMap[c] || 0), 0);
            const consonantSum = cleaned.filter(c => !vowels.includes(c)).reduce((sum, c) => sum + (simpleMap[c] || 0), 0);
            return vowelSum + consonantSum; // Original just added them, which is the same as Ordinal Gematria. Let's return as an object for clarity.
        },
        "Fibonacci Echo": (text) => {
            const fib = [0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144];
            const value = ciphers["Ordinal Gematria"](text);
            return fib.reduce((closest, n) => Math.abs(n - value) < Math.abs(closest - value) ? n : closest, fib[0]);
        },
        "Beans Cipher": (text) => {
            const beansLetters = 'beansuyldi'.split('');
            return text.toLowerCase().replace(/[^a-z]/g, '').split('').reduce((sum, char) => sum + (beansLetters.includes(char) ? 0 : simpleMap[char] || 0), 0);
        },
        "Prime Distance Sum": (text) => {
            const value = ciphers["Ordinal Gematria"](text);
            if (value <= 2) return 0;
            let lower = value - 1, upper = value + 1;
            while (!isPrime(lower)) lower--;
            while (!isPrime(upper)) upper++;
            return (value - lower) + (upper - value);
        },
        "Letter Frequency Pulse": (text) => text.toLowerCase().replace(/[^a-z]/g, '').split('').reduce((sum, char) => sum + (freqMap[char] || 0), 0),
        "Syllable Resonance": (text) => {
            const word = text.toLowerCase();
            let count = (word.match(/[aeiouy]+/g) || []).length;
            if (word.endsWith('e')) count--;
            const syllableCount = Math.max(1, count);
            return ciphers["Ordinal Gematria"](text) * syllableCount;
        },
        "Qwerty Gematria": (text) => text.toLowerCase().replace(/[^a-z]/g, '').split('').reduce((sum, char) => sum + (qwertyMap[char] || 0), 0),
        "Left-Hand QWERTY Count": (text) => text.toLowerCase().replace(/[^a-z]/g, '').split('').filter(c => leftHand.includes(c)).length,
        "Right-Hand QWERTY Count": (text) => text.toLowerCase().replace

        document.addEventListener('DOMContentLoaded', () => {
    buildGematriaCiphers();

    const cipherListContainer = document.getElementById('cipher-list-container');
    if (!cipherListContainer) return;

    const sampleWord = "Beans";
    // Create table
    const table = document.createElement('table');
    table.className = 'cipher-table';
    table.innerHTML = `
        <thead>
            <tr>
                <th>Cipher Name</th>
                <th>Value for "${sampleWord}"</th>
            </tr>
        </thead>
        <tbody>
        </tbody>
    `;

    const tbody = table.querySelector('tbody');

    Object.keys(CIPHERS).forEach(cipherName => {
        let value = "";
        try {
            value = CIPHERS[cipherName](sampleWord);
        } catch (e) {
            value = "N/A";
        }
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${cipherName}</td>
            <td>${value}</td>
        `;
        tbody.appendChild(row);
    });

    cipherListContainer.appendChild(table);
});