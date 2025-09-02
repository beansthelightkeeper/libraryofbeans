// --- 1. Elemental Data ---
const ELEMENT_PROPERTIES = {
    "H": {atomic: 1, boiling: 20.271, name: "Hydrogen"}, "He": {atomic: 2, boiling: 4.222, name: "Helium"}, 
    "Li": {atomic: 3, boiling: 1603.0, name: "Lithium"}, "Be": {atomic: 4, boiling: 2742.0, name: "Beryllium"}, 
    "B": {atomic: 5, boiling: 4200.0, name: "Boron"}, "C": {atomic: 6, boiling: 4300.0, name: "Carbon"}, 
    "N": {atomic: 7, boiling: 77.355, name: "Nitrogen"}, "O": {atomic: 8, boiling: 90.188, name: "Oxygen"}, 
    "F": {atomic: 9, boiling: 85.03, name: "Fluorine"}, "Ne": {atomic: 10, boiling: 27.104, name: "Neon"}, 
    "Na": {atomic: 11, boiling: 1156.09, name: "Sodium"}, "Mg": {atomic: 12, boiling: 1363.0, name: "Magnesium"}, 
    "Al": {atomic: 13, boiling: 2743.0, name: "Aluminum"}, "Si": {atomic: 14, boiling: 3173.0, name: "Silicon"}, 
    "P": {atomic: 15, boiling: 553.7, name: "Phosphorus"}, "S": {atomic: 16, boiling: 717.8, name: "Sulfur"}, 
    "Cl": {atomic: 17, boiling: 239.11, name: "Chlorine"}, "Ar": {atomic: 18, boiling: 87.302, name: "Argon"}, 
    "K": {atomic: 19, boiling: 1032.0, name: "Potassium"}, "Ca": {atomic: 20, boiling: 1757.0, name: "Calcium"}, 
    "Sc": {atomic: 21, boiling: 3109.0, name: "Scandium"}, "Ti": {atomic: 22, boiling: 3560.0, name: "Titanium"}, 
    "V": {atomic: 23, boiling: 3680.0, name: "Vanadium"}, "Cr": {atomic: 24, boiling: 2944.0, name: "Chromium"}, 
    "Mn": {atomic: 25, boiling: 2334.0, name: "Manganese"}, "Fe": {atomic: 26, boiling: 3134.0, name: "Iron"}, 
    "Co": {atomic: 27, boiling: 3200.0, name: "Cobalt"}, "Ni": {atomic: 28, boiling: 3003.0, name: "Nickel"}, 
    "Cu": {atomic: 29, boiling: 2835.0, name: "Copper"}, "Zn": {atomic: 30, boiling: 1180.0, name: "Zinc"}, 
    "Ga": {atomic: 31, boiling: 2477.0, name: "Gallium"}, "Ge": {atomic: 32, boiling: 3093.0, name: "Germanium"}, 
    "As": {atomic: 33, boiling: 887.0, name: "Arsenic"}, "Se": {atomic: 34, boiling: 958.0, name: "Selenium"}, 
    "Br": {atomic: 35, boiling: 332.0, name: "Bromine"}, "Kr": {atomic: 36, boiling: 119.93, name: "Krypton"}, 
    "Rb": {atomic: 37, boiling: 961.0, name: "Rubidium"}, "Sr": {atomic: 38, boiling: 1650.0, name: "Strontium"}, 
    "Y": {atomic: 39, boiling: 3203.0, name: "Yttrium"}, "Zr": {atomic: 40, boiling: 4650.0, name: "Zirconium"}, 
    "Nb": {atomic: 41, boiling: 5017.0, name: "Niobium"}, "Mo": {atomic: 42, boiling: 4912.0, name: "Molybdenum"}, 
    "Tc": {atomic: 43, boiling: 4538.0, name: "Technetium"}, "Ru": {atomic: 44, boiling: 4423.0, name: "Ruthenium"}, 
    "Rh": {atomic: 45, boiling: 3968.0, name: "Rhodium"}, "Pd": {atomic: 46, boiling: 3236.0, name: "Palladium"}, 
    "Ag": {atomic: 47, boiling: 2435.0, name: "Silver"}, "Cd": {atomic: 48, boiling: 1040.0, name: "Cadmium"}, 
    "In": {atomic: 49, boiling: 2345.0, name: "Indium"}, "Sn": {atomic: 50, boiling: 2875.0, name: "Tin"}, 
    "Sb": {atomic: 51, boiling: 1860.0, name: "Antimony"}, "Te": {atomic: 52, boiling: 1261.0, name: "Tellurium"}, 
    "I": {atomic: 53, boiling: 457.4, name: "Iodine"}, "Xe": {atomic: 54, boiling: 165.05, name: "Xenon"}, 
    "Cs": {atomic: 55, boiling: 944.0, name: "Cesium"}, "Ba": {atomic: 56, boiling: 2118.0, name: "Barium"}, 
    "La": {atomic: 57, boiling: 3737.0, name: "Lanthanum"}, "Ce": {atomic: 58, boiling: 3716.0, name: "Cerium"}, 
    "Pr": {atomic: 59, boiling: 3403.0, name: "Praseodymium"}, "Nd": {atomic: 60, boiling: 3347.0, name: "Neodymium"}, 
    "Pm": {atomic: 61, boiling: 3273.0, name: "Promethium"}, "Sm": {atomic: 62, boiling: 2067.0, name: "Samarium"}, 
    "Eu": {atomic: 63, boiling: 1860.0, name: "Europium"}, "Gd": {atomic: 64, boiling: 3273.0, name: "Gadolinium"}, 
    "Tb": {atomic: 65, boiling: 3396.0, name: "Terbium"}, "Dy": {atomic: 66, boiling: 2840.0, name: "Dysprosium"}, 
    "Ho": {atomic: 67, boiling: 2873.0, name: "Holmium"}, "Er": {atomic: 68, boiling: 3141.0, name: "Erbium"}, 
    "Tm": {atomic: 69, boiling: 2223.0, name: "Thulium"}, "Yb": {atomic: 70, boiling: 1469.0, name: "Ytterbium"}, 
    "Lu": {atomic: 71, boiling: 3675.0, name: "Lutetium"}, "Hf": {atomic: 72, boiling: 4876.0, name: "Hafnium"}, 
    "Ta": {atomic: 73, boiling: 5731.0, name: "Tantalum"}, "W": {atomic: 74, boiling: 6203.0, name: "Tungsten"}, 
    "Re": {atomic: 75, boiling: 5869.0, name: "Rhenium"}, "Os": {atomic: 76, boiling: 5285.0, name: "Osmium"}, 
    "Ir": {atomic: 77, boiling: 4701.0, name: "Iridium"}, "Pt": {atomic: 78, boiling: 4098.0, name: "Platinum"}, 
    "Au": {atomic: 79, boiling: 3243.0, name: "Gold"}, "Hg": {atomic: 80, boiling: 629.88, name: "Mercury"}, 
    "Tl": {atomic: 81, boiling: 1746.0, name: "Thallium"}, "Pb": {atomic: 82, boiling: 2022.0, name: "Lead"}, 
    "Bi": {atomic: 83, boiling: 1837.0, name: "Bismuth"}, "Po": {atomic: 84, boiling: 1235.0, name: "Polonium"}, 
    "At": {atomic: 85, boiling: 610.0, name: "Astatine"}, "Rn": {atomic: 86, boiling: 211.5, name: "Radon"}, 
    "Fr": {atomic: 87, boiling: 950.0, name: "Francium"}, "Ra": {atomic: 88, boiling: 1413.0, name: "Radium"}, 
    "Ac": {atomic: 89, boiling: 3471.0, name: "Actinium"}, "Th": {atomic: 90, boiling: 5061.0, name: "Thorium"}, 
    "Pa": {atomic: 91, boiling: 4300.0, name: "Protactinium"}, "U": {atomic: 92, boiling: 4404.0, name: "Uranium"}, 
    "Np": {atomic: 93, boiling: 4273.0, name: "Neptunium"}, "Pu": {atomic: 94, boiling: 3505.0, name: "Plutonium"}, 
    "Am": {atomic: 95, boiling: 2880.0, name: "Americium"}, "Cm": {atomic: 96, boiling: 3383.0, name: "Curium"}, 
    "Bk": {atomic: 97, boiling: 2900.0, name: "Berkelium"}, "Cf": {atomic: 98, boiling: 1743.0, name: "Californium"}, 
    "Es": {atomic: 99, boiling: 1269.0, name: "Einsteinium"}, "Fm": {atomic: 100, boiling: null, name: "Fermium"}, 
    "Md": {atomic: 101, boiling: null, name: "Mendelevium"}, "No": {atomic: 102, boiling: null, name: "Nobelium"}, 
    "Lr": {atomic: 103, boiling: null, name: "Lawrencium"}, "Rf": {atomic: 104, boiling: null, name: "Rutherfordium"}, 
    "Db": {atomic: 105, boiling: null, name: "Dubnium"}, "Sg": {atomic: 106, boiling: null, name: "Seaborgium"}, 
    "Bh": {atomic: 107, boiling: null, name: "Bohrium"}, "Hs": {atomic: 108, boiling: null, name: "Hassium"}, 
    "Mt": {atomic: 109, boiling: null, name: "Meitnerium"}, "Ds": {atomic: 110, boiling: null, name: "Darmstadtium"}, 
    "Rg": {atomic: 111, boiling: null, name: "Roentgenium"}, "Cn": {atomic: 112, boiling: null, name: "Copernicium"}, 
    "Nh": {atomic: 113, boiling: null, name: "Nihonium"}, "Fl": {atomic: 114, boiling: null, name: "Flerovium"}, 
    "Mc": {atomic: 115, boiling: null, name: "Moscovium"}, "Lv": {atomic: 116, boiling: null, name: "Livermorium"}, 
    "Ts": {atomic: 117, boiling: null, name: "Tennessine"}, "Og": {atomic: 118, boiling: null, name: "Oganesson"}
};

const ELEMENTS_FOR_SEARCH = Object.keys(ELEMENT_PROPERTIES)
    .map(symbol => {
        const counter = new Map();
        for (const char of symbol.toUpperCase()) {
            counter.set(char, (counter.get(char) || 0) + 1);
        }
        return { symbol, counter };
    })
    .sort((a, b) => b.symbol.length - a.symbol.length || a.symbol.localeCompare(b.symbol));

// --- 2. Core Logic ---
const memo = new Map();

function getMemoKey(lettersCounter) {
    return Array.from(lettersCounter.entries())
        .filter(([, count]) => count > 0)
        .sort()
        .map(([char, count]) => `${char}${count}`)
        .join(',');
}

function findAllElementCombinations(lettersCounter) {
    const memoKey = getMemoKey(lettersCounter);
    if (memo.has(memoKey)) {
        return memo.get(memoKey);
    }

    const solutions = [[]]; // Start with the "use no elements" option

    for (const { symbol, counter: elementLetters } of ELEMENTS_FOR_SEARCH) {
        let canForm = true;
        for (const [char, needed] of elementLetters.entries()) {
            if ((lettersCounter.get(char) || 0) < needed) {
                canForm = false;
                break;
            }
        }

        if (canForm) {
            const nextLettersCounter = new Map(lettersCounter);
            for (const [char, needed] of elementLetters.entries()) {
                nextLettersCounter.set(char, nextLettersCounter.get(char) - needed);
            }
            
            const subSolutions = findAllElementCombinations(nextLettersCounter);
            
            for (const subSolution of subSolutions) {
                solutions.push([symbol, ...subSolution]);
            }
        }
    }

    const uniqueKeys = new Set();
    const uniqueSolutions = [];
    for(const solution of solutions){
        const sortedKey = solution.slice().sort().join(',');
        if(!uniqueKeys.has(sortedKey)){
            uniqueKeys.add(sortedKey);
            uniqueSolutions.push(solution);
        }
    }
    
    memo.set(memoKey, uniqueSolutions);
    return uniqueSolutions;
}

function analyzeWord(textInput) {
    const normalizedInput = (textInput.match(/[a-zA-Z]/g) || []).join('').toUpperCase();
    if (!normalizedInput) {
        return { error: "No alphabetic characters found in input." };
    }

    const initialLettersPool = new Map();
    for (const char of normalizedInput) {
        initialLettersPool.set(char, (initialLettersPool.get(char) || 0) + 1);
    }
    
    memo.clear();
    const allCombos = findAllElementCombinations(new Map(initialLettersPool));

    if (allCombos.length <= 1 && allCombos[0].length === 0) {
         return { error: "No element combinations could be formed." };
    }

    const results = allCombos
        .filter(combo => combo.length > 0) 
        .map(combo => {
            const lettersUsedStr = combo.join('');
            const boilingPoints = combo.map(el => ELEMENT_PROPERTIES[el].boiling).filter(bp => bp !== null);
            const avgBoilingPoint = boilingPoints.length > 0 ? boilingPoints.reduce((a, b) => a + b, 0) / boilingPoints.length : null;
            
            const tempPool = new Map(initialLettersPool);
            for(const char of lettersUsedStr) {
                tempPool.set(char, tempPool.get(char) - 1);
            }

            let remainingStr = '';
            for(const [char, count] of Array.from(tempPool.entries()).sort()) {
                if (count > 0) { remainingStr += char.repeat(count); }
            }
            
            return {
                elements: combo,
                atomic_sum: combo.reduce((sum, el) => sum + ELEMENT_PROPERTIES[el].atomic, 0),
                avg_boiling_point: avgBoilingPoint,
                letters_used: lettersUsedStr.length,
                unmatched_letters: remainingStr
            };
        });
    
    results.sort((a, b) => b.letters_used - a.letters_used || (b.avg_boiling_point || -1) - (a.avg_boiling_point || -1));

    return { results };
}

// --- 3. UI Interaction ---
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('gematria-form');
    const input = document.getElementById('word-input');
    const primaryResultContainer = document.getElementById('primary-result-container');
    const atomicSumDisplay = document.getElementById('atomic-sum-display');
    const elementsContainer = document.getElementById('elements-container');
    const unmatchedContainer = document.getElementById('unmatched-letters-container');
    const infoContainer = document.getElementById('info-container');
    const alternativesContainer = document.getElementById('alternatives-container');
    const initialMessage = document.getElementById('initial-message');
    const errorMessage = document.getElementById('error-message');

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const word = input.value;
        if (word.trim() === '') return;

        primaryResultContainer.classList.add('hidden');
        alternativesContainer.classList.add('hidden');
        initialMessage.classList.add('hidden');
        errorMessage.classList.add('hidden');
        
        const analysis = analyzeWord(word);
        
        if (analysis.error) {
            displayError(analysis.error);
        } else {
            displayResults(analysis.results);
        }
    });

    function displayError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
    }

    function displayResults(resultsArray) {
        if (!resultsArray || resultsArray.length === 0) {
            displayError("No element combinations could be formed.");
            return;
        }

        // Clear previous content
        elementsContainer.innerHTML = '';
        unmatchedContainer.innerHTML = '';
        infoContainer.innerHTML = '';
        alternativesContainer.innerHTML = '';

        primaryResultContainer.classList.remove('hidden');
        const topResult = resultsArray[0];
        
        // Display top result's atomic sum
        atomicSumDisplay.textContent = topResult.atomic_sum;

        // Display top result's element tiles
        topResult.elements.forEach(symbol => {
            const el = ELEMENT_PROPERTIES[symbol];
            const tile = document.createElement('div');
            tile.className = 'element-tile';
            tile.innerHTML = `<div class="atomic-number">${el.atomic}</div><div class="symbol">${symbol}</div><div class="name">${el.name}</div>`;
            elementsContainer.appendChild(tile);
        });

        // Display unmatched letters for top result
        unmatchedContainer.textContent = topResult.unmatched_letters ? topResult.unmatched_letters : '';
        
        // Display info card for top result
        const infoCard = document.createElement('div');
        infoCard.className = 'info-card';
        const bp_str = topResult.avg_boiling_point !== null ? `${topResult.avg_boiling_point.toFixed(2)} K` : "N/A";
        infoCard.innerHTML = `
            <h3>Top Analysis</h3>
            <div class="info-row"><span class="info-label">Avg. Boiling Point:</span> <span class="info-value">${bp_str}</span></div>
            <div class="info-row"><span class="info-label">Letters Used:</span> <span class="info-value">${topResult.letters_used}</span></div>
        `;
        infoContainer.appendChild(infoCard);

        // Display up to 3 alternatives
        const alternatives = resultsArray.slice(1, 4);
        if (alternatives.length > 0) {
            alternativesContainer.classList.remove('hidden');
            alternativesContainer.innerHTML = '<h4>Other Possibilities</h4>';
            alternatives.forEach(alt => {
                const altContainer = document.createElement('div');
                altContainer.className = 'alternative-result';
                
                const sumSpan = document.createElement('span');
                sumSpan.className = 'alternative-sum';
                sumSpan.textContent = alt.atomic_sum;
                altContainer.appendChild(sumSpan);

                alt.elements.forEach(symbol => {
                    const el = ELEMENT_PROPERTIES[symbol];
                    const tile = document.createElement('div');
                    tile.className = 'alternative-tile';
                    tile.innerHTML = `<div class="atomic-number">${el.atomic}</div><div class="symbol">${symbol}</div><div class="name">${el.name}</div>`;
                    altContainer.appendChild(tile);
                });

                if (alt.unmatched_letters) {
                    const unmatchedSpan = document.createElement('span');
                    unmatchedSpan.className = 'alternative-unmatched';
                    unmatchedSpan.textContent = alt.unmatched_letters;
                    altContainer.appendChild(unmatchedSpan);
                }
                alternativesContainer.appendChild(altContainer);
            });
        }
    }
});

