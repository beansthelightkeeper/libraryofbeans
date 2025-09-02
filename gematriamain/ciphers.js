// --- GLOBAL STATE & CONSTANTS ---
const CIPHERS = {};
const PHI = 1.61803398875; // Golden Ratio

// --- UTILITY FUNCTIONS ---
function recursiveDigitSum(n, masterNumbers = false) {
    let val = Math.abs(Math.round(n));
    if (isNaN(val) || !isFinite(val)) return 0;
    if (masterNumbers && (val === 11 || val === 22)) return val;
    while (val > 9) {
        if (masterNumbers && (val === 11 || val === 22)) return val;
        val = String(val).split('').reduce((sum, digit) => sum + parseInt(digit, 10), 0);
    }
    return val;
}

function isPrime(n) {
    if (n <= 1) return false;
    if (n <= 3) return true;
    if (n % 2 === 0 || n % 3 === 0) return false;
    for (let i = 5; i * i <= n; i = i + 6) {
        if (n % i === 0 || n % (i + 2) === 0) return false;
    }
    return true;
}

// --- GEMATRIA CIPHER DEFINITIONS ---
function buildGematriaCiphers() {
    // --- CHARACTER MAPS ---
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    const simpleMap = {};
    alphabet.split('').forEach((l, i) => { simpleMap[l] = i + 1; });

    const reverseSimpleMap = {};
    alphabet.split('').forEach((l, i) => { reverseSimpleMap[l] = 26 - i; });

    const fibonacciMap = { a: 1, b: 1, c: 2, d: 3, e: 5, f: 8, g: 13, h: 21, i: 34, j: 55, k: 89, l: 144, m: 233, n: 233, o: 144, p: 89, q: 55, r: 34, s: 21, t: 13, u: 8, v: 5, w: 3, x: 2, y: 1, z: 1 };
    const squaresMap = {};
    alphabet.split('').forEach((l, i) => { squaresMap[l] = (i + 1) * (i + 1); });
    const trigonalMap = {};
    alphabet.split('').forEach((l, i) => { const n = i + 1; trigonalMap[l] = n * (n + 1) / 2; });
    const primesMap = { a: 2, b: 3, c: 5, d: 7, e: 11, f: 13, g: 17, h: 19, i: 23, j: 29, k: 31, l: 37, m: 41, n: 43, o: 47, p: 53, q: 59, r: 61, s: 67, t: 71, u: 73, v: 79, w: 83, x: 89, y: 97, z: 101 };
    const latinMap = { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8, i: 9, k: 10, l: 20, m: 30, n: 40, o: 50, p: 60, q: 70, r: 80, s: 90, t: 100, u: 200, x: 300, y: 400, z: 500, j: 600, v: 700, w: 900 };
    const sumerianMap = {};
    alphabet.split('').forEach((l, i) => { sumerianMap[l] = (i + 1) * 6; });
    const chaldeanMap = { a: 1, i: 1, j: 1, q: 1, y: 1, b: 2, k: 2, r: 2, c: 3, g: 3, l: 3, s: 3, d: 4, m: 4, t: 4, e: 5, h: 5, n: 5, x: 5, u: 6, v: 6, w: 6, o: 7, z: 7, f: 8, p: 8 };

    // Exception Maps
    const epExceptionMap = { a: 8, b: 7, c: 6, d: 5, e: 22, f: 3, g: 2, h: 1, i: 9, j: 8, k: 7, l: 6, m: 5, n: 4, o: 3, p: 11, q: 1, r: 9, s: 8, t: 7, u: 6, v: 5, w: 4, x: 3, y: 2, z: 1 };
    const ehpExceptionMap = { a: 8, b: 7, c: 6, d: 5, e: 22, f: 3, g: 2, h: 10, i: 9, j: 8, k: 7, l: 6, m: 5, n: 4, o: 3, p: 11, q: 1, r: 9, s: 8, t: 7, u: 6, v: 5, w: 4, x: 3, y: 2, z: 1 };
    const skvExceptionMap = { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8, i: 9, j: 1, k: 11, l: 3, m: 4, n: 5, o: 6, p: 7, q: 8, s: 9, t: 10, u: 2, v: 3, w: 22, x: 5, y: 6, z: 7, r: 8 };
    const kvExceptionMap = { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8, i: 9, j: 1, k: 11, l: 3, m: 4, n: 5, o: 6, p: 7, q: 8, r: 9, s: 1, t: 2, u: 3, v: 22, w: 5, x: 6, y: 7, z: 8 };
    
    // Case-sensitive & Thematic Maps
    const capsAddedMap = {};
    alphabet.split('').forEach((l, i) => { capsAddedMap[l] = i + 1; });
    alphabet.toUpperCase().split('').forEach((l, i) => { capsAddedMap[l] = i + 27; });
    const capsMixedMap = {};
    alphabet.split('').forEach((l, i) => { capsMixedMap[l.toUpperCase()] = i*2 + 1; capsMixedMap[l] = i*2 + 2; });
    const freqMap = { e: 26, t: 25, a: 24, o: 23, i: 22, n: 21, s: 20, h: 19, r: 18, d: 17, l: 16, c: 15, u: 14, m: 13, w: 12, f: 11, g: 10, y: 9, p: 8, b: 7, v: 6, k: 5, j: 4, x: 3, q: 2, z: 1 };
    const keypadMap = { a: 2, b: 2, c: 2, d: 3, e: 3, f: 3, g: 4, h: 4, i: 4, j: 5, k: 5, l: 5, m: 6, n: 6, o: 6, p: 7, q: 7, r: 7, s: 7, t: 8, u: 8, v: 8, w: 9, x: 9, y: 9, z: 9 };


    // --- HELPER FUNCTIONS ---
    const createCipher = (mapper, description, category = "Standard") => ({
        description, category,
        calculate: (text) => {
            const cleanedText = text.toLowerCase().replace(/[^a-z]/g, '');
            const breakdown = [];
            let total = 0;
            for (const char of cleanedText) {
                const value = mapper[char] || 0;
                breakdown.push({ char, value });
                total += value;
            }
            return { total, breakdown };
        }
    });

    const createCaseSensitiveCipher = (mapper, description, category = "Special") => ({
        description, category,
        calculate: (text) => {
            const cleanedText = text.replace(/[^a-zA-Z]/g, '');
            const breakdown = [];
            let total = 0;
            for (const char of cleanedText) {
                const value = mapper[char] || 0;
                breakdown.push({ char, value });
                total += value;
            }
            return { total, breakdown };
        }
    });
    
    const createTotalOnlyCipher = (calculator, description, category = "Mathematical") => ({
        description, category,
        calculate: (text) => {
            const total = calculator(text);
            return { total, breakdown: [] };
        }
    });

    // --- BASE CIPHER DEFINITIONS ---
    const ciphers = {
        // Core & Standard Ciphers
        "English Ordinal": createCipher(simpleMap, "A=1, B=2, C=3..."),
        "Latin (Jewish)": createCipher(latinMap, "Hebrew values on English letters."),
        "Sumerian": createCipher(sumerianMap, "Ordinal values multiplied by 6."),
        "Primes": createCipher(primesMap, "Each letter is its corresponding prime number."),
        "Trigonal": createCipher(trigonalMap, "Each letter is its trigonal number value."),
        "Squares": createCipher(squaresMap, "Each letter is its square number value."),
        "Fibonacci": createCipher(fibonacciMap, "Letters map to the Fibonacci sequence."),
        "Chaldean": createCipher(chaldeanMap, "Ancient system based on sound values 1-8."),
        "Satanic": createCipher({}, "Satanic Gematria", "Standard"),

        // Reduction Ciphers
        "Full Reduction": createCipher(Object.fromEntries(alphabet.split('').map(l => [l, recursiveDigitSum(simpleMap[l])])), "Each letter's value is reduced to a single digit.", "Reduction"),
        "Reverse Reduction": createCipher(Object.fromEntries(alphabet.split('').map(l => [l, recursiveDigitSum(reverseSimpleMap[l]+1)])), "Each reverse letter's value is reduced.", "Reduction"),
        "Single Reduction": createTotalOnlyCipher(text => recursiveDigitSum(ciphers["English Ordinal"].calculate(text).total), "The total Ordinal value reduced to a single digit.", "Reduction"),
        
        // Exception Ciphers
        "KV Exception": createCipher(kvExceptionMap, "Special values for K and V.", "Exceptions"),
        "SKV Exception": createCipher(skvExceptionMap, "Special values for S, K, and V.", "Exceptions"),
        "EP Exception": createCipher(epExceptionMap, "Special values for E and P.", "Exceptions"),
        "EHP Exception": createCipher(ehpExceptionMap, "Special values for E, H, and P.", "Exceptions"),

        // Case-Sensitive Ciphers
        "Caps Added": createCaseSensitiveCipher(capsAddedMap, "a=1, A=27."),
        "Caps Mixed": createCaseSensitiveCipher(capsMixedMap, "A=1, a=2, B=3, b=4..."),
        "Reverse Caps Added": createCaseSensitiveCipher(Object.fromEntries(Object.entries(capsAddedMap).map(([k,v]) => [k, 53-v])), "a=52, A=26..."),
    };

    // --- THEMATIC & CUSTOM CIPHERS ---
    const thematicCiphers = {
        "Vowel-Consonant Split": createTotalOnlyCipher(text => {
            const vowels = 'aeiou';
            const cleaned = text.toLowerCase().replace(/[^a-z]/g, '');
            const vowelSum = cleaned.split('').filter(c => vowels.includes(c)).reduce((sum, c) => sum + (simpleMap[c] || 0), 0);
            const consonantSum = cleaned.split('').filter(c => !vowels.includes(c)).reduce((sum, c) => sum + (simpleMap[c] || 0), 0);
            return `V:${vowelSum} C:${consonantSum}`;
        }, "Splits sum between vowels and consonants.", "Thematic & Custom"),

        "Syllable Resonance": createTotalOnlyCipher(text => {
            const word = text.toLowerCase();
            let count = (word.match(/[aeiouy]+/g) || []).length;
            if (word.endsWith('e') && !word.endsWith('le')) count--;
            const syllableCount = Math.max(1, count);
            return ciphers["English Ordinal"].calculate(text).total * syllableCount;
        }, "Ordinal value multiplied by syllable count.", "Thematic & Custom"),

        "Smile Karma": createCipher(Object.fromEntries(alphabet.split('').map(l => [l, 'smilekarma'.includes(l) ? 10 : simpleMap[l]])), "Letters in 'smilekarma' = 10.", "Thematic & Custom"),
        "Beans Cipher": createCipher(Object.fromEntries(alphabet.split('').map(l => [l, 'beansuyldi'.includes(l) ? 0 : simpleMap[l]])), "Letters in 'beansuyldi' = 0.", "Thematic & Custom"),

        "Prime Gematria": createTotalOnlyCipher(text => {
            const total = ciphers["English Ordinal"].calculate(text).total;
            return isPrime(total) ? total : 0;
        }, "Returns Ordinal value only if it's a prime number.", "Thematic & Custom"),

        "Binary Sum": createTotalOnlyCipher(text => {
            const cleaned = text.toLowerCase().replace(/[^a-z]/g, '');
            return cleaned.split('').reduce((sum, char) => {
                const binary = (simpleMap[char] || 0).toString(2);
                return sum + (binary.match(/1/g) || []).length;
            }, 0);
        }, "Sums the '1's in each letter's binary value.", "Thematic & Custom"),

        "ASCII Sum": {
            description: "Sums the standard ASCII codes of each character.",
            category: "Thematic & Custom",
            calculate: (text) => {
                const breakdown = [];
                let total = 0;
                for (const char of text) {
                    const value = char.charCodeAt(0);
                    breakdown.push({ char, value });
                    total += value;
                }
                return { total, breakdown };
            }
        },

        "Qwerty": createCipher(Object.fromEntries(alphabet.split('').map(l => {
            const qwerty = 'qwertyuiopasdfghjklzxcvbnm';
            return [l, qwerty.indexOf(l) + 1];
        })), "Values based on keyboard position.", "Thematic & Custom"),

        "Solfège": createCipher(Object.fromEntries(alphabet.split('').map((l, i) => [l, (i % 7) + 1])), "Repeating 1-7 sequence (Do, Re, Mi...).", "Thematic & Custom"),
        "Zodiac": createCipher(Object.fromEntries(alphabet.split('').map((l, i) => [l, (i % 12) + 1])), "Repeating 1-12 sequence.", "Thematic & Custom"),

        "Caesar Cipher (+3)": createTotalOnlyCipher(text => {
            const cleaned = text.toLowerCase().replace(/[^a-z]/g, '');
            const shiftedText = cleaned.split('').map(char => {
                const newCode = ((char.charCodeAt(0) - 97 + 3) % 26) + 97;
                return String.fromCharCode(newCode);
            }).join('');
            return ciphers["English Ordinal"].calculate(shiftedText).total;
        }, "Calculates Ordinal after shifting letters by 3.", "Thematic & Custom"),

        "Polybius Square": createCipher(
            Object.fromEntries(alphabet.split('').map(l => {
                const polybiusMap = { a: [1, 1], b: [1, 2], c: [1, 3], d: [1, 4], e: [1, 5], f: [2, 1], g: [2, 2], h: [2, 3], i: [2, 4], j: [2, 4], k: [2, 5], l: [3, 1], m: [3, 2], n: [3, 3], o: [3, 4], p: [3, 5], q: [4, 1], r: [4, 2], s: [4, 3], t: [4, 4], u: [4, 5], v: [5, 1], w: [5, 2], x: [5, 3], y: [5, 4], z: [5, 5] };
                const coords = polybiusMap[l];
                return [l, coords ? coords[0] + coords[1] : 0];
            })
        ), "Sum of 5x5 grid coordinates for each letter.", "Thematic & Custom"),
        
        "Letter Frequency Pulse": createCipher(freqMap, "Values based on letter frequency in English.", "Thematic & Custom"),
        
        "Idea Numerology": createTotalOnlyCipher(text => {
            const { total } = ciphers["Squares"].calculate(text);
            return total % 100;
        }, "Sum of (ordinal^2) mod 100.", "Thematic & Custom"),

        "Leet Code": createTotalOnlyCipher(text => {
            const leetLetters = 'ieastbo';
            const cleaned = text.toLowerCase().replace(/[^a-z]/g, '');
            const filteredText = cleaned.split('').filter(c => !leetLetters.includes(c)).join('');
            return ciphers["English Ordinal"].calculate(filteredText).total;
        }, "Ignores common leetspeak letters (i,e,a,s,t,b,o).", "Thematic & Custom"),

        "Simple Forms": createTotalOnlyCipher(text => {
            let transformedText = text.toLowerCase()
              .replace(/\byou\b/g, 'u')
              .replace(/\bare\b/g, 'r')
              .replace(/\bbefore\b/g, 'b4')
              .replace(/\bwhy\b/g, 'y');
            return ciphers["English Ordinal"].calculate(transformedText).total;
        }, "Converts common words to shorter forms first.", "Thematic & Custom"),

        "Love Resonance": createTotalOnlyCipher(text => {
            const loveWords = ['love', 'spirit', 'soul', 'heart', 'light', 'truth', 'unity', 'joy', 'peace'];
            return loveWords.includes(text.toLowerCase().trim()) ? 1 : 0;
        }, "Returns 1 if word is in a 'love/spirit' list.", "Thematic & Custom"),
        
        "Phone Keypad": createCipher(keypadMap, "Values from a standard telephone keypad.", "Thematic & Custom"),
    };
    Object.assign(ciphers, thematicCiphers);

    // --- CUSTOM LOGIC & FINAL ASSEMBLY ---
    ciphers["Satanic"].calculate = (text) => {
        const cleanedText = text.toLowerCase().replace(/[^a-z]/g, '');
        const breakdown = [];
        let total = 0;
        for(const char of cleanedText){
            const value = simpleMap[char] + 35;
            breakdown.push({char, value});
            total += value;
        }
        return {total, breakdown};
    };
    
    // Automatically generate Reverse Variants
    const ciphersToReverse = Object.keys(ciphers);
    for (const cipherName of ciphersToReverse) {
        if (cipherName.includes("Reverse") || ciphers[cipherName].category === 'Special') {
            continue;
        }
        
        ciphers[`Reverse ${cipherName}`] = {
            description: `Reversed ${cipherName}`,
            category: "Reverse Variants",
            calculate: (text) => {
                const reversedText = text.split('').reverse().join('');
                return ciphers[cipherName].calculate(reversedText);
            }
        };
    }

    // Assign the final, complete ciphers object to the global CIPHERS variable
    Object.assign(CIPHERS, ciphers);
}

// --- INITIALIZATION ---
buildGematriaCiphers();