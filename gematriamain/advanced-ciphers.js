document.addEventListener('DOMContentLoaded', () => {

    // --- DOM ELEMENTS ---
    const wordInput = document.getElementById('word-input-adv');
    const cipherListContainer = document.getElementById('cipher-list-container');
    const resultsGrid = document.getElementById('results-grid');
    const viewToggle = document.getElementById('view-toggle');
    const selectAllBtn = document.getElementById('select-all-btn');

    // --- STATE & CONFIG ---
    const highlightTypes = {
        prime:      { name: 'Prime',      color: '#D6A100', enabled: true },
        composite:  { name: 'Composite',  color: '#2E8B57', enabled: true },
        palindrome: { name: 'Palindrome', color: '#FF1493', enabled: true },
        square:     { name: 'Square',     color: '#FF4500', enabled: true },
        repeating:  { name: 'Repeating',  color: '#1E90FF', enabled: true },
    };

    // --- UTILITY & HIGHLIGHTING FUNCTIONS ---
    function isPrime(n) {
        if (n <= 1) return false; if (n <= 3) return true;
        if (n % 2 === 0 || n % 3 === 0) return false;
        for (let i = 5; i * i <= n; i = i + 6) {
            if (n % i === 0 || n % (i + 2) === 0) return false;
        }
        return true;
    }
    function isPerfectSquare(n) {
        if (n < 0) return false; const sqrt = Math.sqrt(n);
        return sqrt === Math.floor(sqrt);
    }
    function isPalindrome(n) { const s = String(n); return s === s.split('').reverse().join(''); }
    function isRepeating(n) { const s = String(n); if (s.length < 2) return false; return new Set(s.split('')).size === 1; }

    function getHighlightClasses(n) {
        if (typeof n !== 'number' || !Number.isInteger(n) || n < 0) return [];
        
        const highlights = [];
        if (highlightTypes.palindrome.enabled && isPalindrome(n)) highlights.push('palindrome');
        if (highlightTypes.square.enabled && isPerfectSquare(n)) highlights.push('square');
        if (highlightTypes.repeating.enabled && isRepeating(n)) highlights.push('repeating');
        
        if (highlightTypes.prime.enabled && isPrime(n)) {
            highlights.push('prime');
        } else if (highlightTypes.composite.enabled && n > 1) {
            highlights.push('composite');
        }
        
        return highlights.map(h => `highlight-${h}`);
    }

    // --- MAIN FUNCTIONS ---
    function calculateAndDisplay() {
        const text = wordInput.value;
        resultsGrid.innerHTML = ''; 

        const selectedCiphers = Array.from(document.querySelectorAll('#cipher-list-container input:checked')).map(input => input.value);
        const isCondensed = viewToggle.checked;
        resultsGrid.classList.toggle('condensed-view', isCondensed);

        if (!text.trim() || selectedCiphers.length === 0) return;

        selectedCiphers.forEach(cipherName => {
            if (CIPHERS[cipherName]) {
                const result = CIPHERS[cipherName].calculate(text);
                const card = isCondensed ? createCondensedCard(cipherName, result) : createDetailedCard(cipherName, result, text);
                resultsGrid.appendChild(card);
            }
        });
    }

    function applyHighlights(element, number) {
        if (typeof number !== 'number') return;
        const highlightClasses = getHighlightClasses(number);
        if (highlightClasses.length > 0) {
            element.classList.add(...highlightClasses);
            if (highlightClasses.length > 1) {
                element.classList.add('highlight-multiple');
            }
        }
    }

    function createCondensedCard(cipherName, result) {
        const card = document.createElement('div');
        card.className = 'result-card-condensed';
        
        const nameEl = document.createElement('span');
        nameEl.className = 'cipher-name';
        nameEl.textContent = cipherName;
        card.appendChild(nameEl);

        const totalEl = document.createElement('span');
        totalEl.className = 'total';
        totalEl.textContent = typeof result.total === 'number' ? Math.round(result.total * 1000) / 1000 : result.total;
        applyHighlights(totalEl, result.total);
        card.appendChild(totalEl);

        return card;
    }

    function createDetailedCard(cipherName, result, originalText) {
        const card = document.createElement('div');
        card.className = 'result-card';
        
        const titleEl = document.createElement('h4');
        titleEl.textContent = cipherName;
        card.appendChild(titleEl);

        const totalEl = document.createElement('div');
        totalEl.className = 'total';
        totalEl.textContent = typeof result.total === 'number' ? Math.round(result.total * 1000) / 1000 : result.total;
        applyHighlights(totalEl, result.total);
        card.appendChild(totalEl);

        if (CIPHERS[cipherName].description) {
            const descEl = document.createElement('p');
            descEl.className = 'cipher-description';
            descEl.textContent = CIPHERS[cipherName].description;
            card.appendChild(descEl);
        }

        if (result.breakdown && result.breakdown.length > 0) {
            // ... breakdown logic remains the same
            const breakdownContainer = document.createElement('div');
            breakdownContainer.className = 'breakdown';
            const words = originalText.trim().split(/\s+/);
            const breakdownCardContainer = document.createElement('div');
            breakdownCardContainer.className = 'breakdown-card-container';
            let charIndex = 0;
            words.forEach(word => {
                const wordDiv = document.createElement('div');
                wordDiv.className = 'word-breakdown';
                for (let i = 0; i < word.length; i++) {
                    const originalChar = word[i];
                    const letterData = result.breakdown[charIndex];
                    if (letterData && letterData.char.toLowerCase() === originalChar.toLowerCase()) {
                         const letterCard = document.createElement('div');
                        letterCard.className = 'breakdown-letter-card';
                        letterCard.innerHTML = `<span class="letter">${letterData.char}</span><span class="value">${letterData.value}</span>`;
                        wordDiv.appendChild(letterCard);
                       charIndex++;
                    }
                }
                breakdownCardContainer.appendChild(wordDiv);
            });
            breakdownContainer.appendChild(breakdownCardContainer);
            card.appendChild(breakdownContainer);
        }
        
        return card;
    }
    
    function initializePage() {
        // --- Create Highlight Legend ---
        const legendContainer = document.getElementById('highlight-legend-container');
        if (legendContainer) {
            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'legend-toggle-btn';
            toggleBtn.textContent = 'Highlight Legend';
            
            const panel = document.createElement('div');
            panel.className = 'legend-panel';

            for (const type in highlightTypes) {
                const item = highlightTypes[type];
                const itemDiv = document.createElement('div');
                itemDiv.className = 'legend-item';
                
                const swatch = document.createElement('div');
                swatch.className = 'legend-color-swatch';
                swatch.style.backgroundColor = item.color;

                const label = document.createElement('label');
                label.className = 'legend-label';
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = item.enabled;
                checkbox.dataset.type = type;
                
                checkbox.addEventListener('change', (e) => {
                    highlightTypes[e.target.dataset.type].enabled = e.target.checked;
                    calculateAndDisplay(); // Recalculate to apply changes
                });

                label.appendChild(checkbox);
                label.appendChild(document.createTextNode(item.name));
                itemDiv.appendChild(swatch);
                itemDiv.appendChild(label);
                panel.appendChild(itemDiv);
            }

            legendContainer.appendChild(toggleBtn);
            legendContainer.appendChild(panel);

            toggleBtn.addEventListener('click', () => panel.classList.toggle('visible'));
            document.addEventListener('click', (e) => {
                if (!legendContainer.contains(e.target)) {
                    panel.classList.remove('visible');
                }
            });
        }
        
        const minimizeBtn = document.createElement('button');
        minimizeBtn.id = 'minimize-menu-btn';
        minimizeBtn.className = 'control-btn-local';
        minimizeBtn.textContent = 'Minimize Ciphers';
        document.querySelector('.view-toggle-container').appendChild(minimizeBtn);

        minimizeBtn.addEventListener('click', () => {
            cipherListContainer.classList.toggle('minimized');
            minimizeBtn.textContent = cipherListContainer.classList.contains('minimized') ? 'Show Ciphers' : 'Minimize Ciphers';
        });

        // --- Populate Cipher Categories ---
        const categories = {};
        Object.keys(CIPHERS).sort().forEach(cipherName => {
            const category = CIPHERS[cipherName].category || "Uncategorized";
            if (!categories[category]) categories[category] = [];
            categories[category].push(cipherName);
        });

        Object.keys(categories).sort().forEach(categoryName => {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'cipher-category';
            const categoryHeader = document.createElement('div');
            categoryHeader.className = 'category-header';
            const title = document.createElement('h3');
            title.textContent = categoryName;
            const categorySelectBtn = document.createElement('button');
            categorySelectBtn.className = 'category-select-btn';
            categorySelectBtn.textContent = 'Select All';
            categoryHeader.appendChild(title);
            categoryHeader.appendChild(categorySelectBtn);
            categoryDiv.appendChild(categoryHeader);
            const listDiv = document.createElement('div');
            listDiv.className = 'cipher-checkbox-list';
            categories[categoryName].forEach(cipherName => {
                const label = document.createElement('label');
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox'; checkbox.value = cipherName;
                label.appendChild(checkbox);
                label.appendChild(document.createTextNode(` ${cipherName}`));
                listDiv.appendChild(label);
            });
            categoryDiv.appendChild(listDiv);
            cipherListContainer.appendChild(categoryDiv);
            categorySelectBtn.addEventListener('click', () => {
                const checkboxes = listDiv.querySelectorAll('input[type="checkbox"]');
                const shouldSelect = Array.from(checkboxes).some(cb => !cb.checked);
                checkboxes.forEach(cb => cb.checked = shouldSelect);
                calculateAndDisplay();
            });
        });
        
        // --- Event Listeners ---
        cipherListContainer.addEventListener('change', e => { /* ... event listener logic ... */ });
        selectAllBtn.addEventListener('click', () => { /* ... event listener logic ... */ });

        cipherListContainer.addEventListener('change', (e) => {
            if(e.target.type !== 'checkbox') return;
            const categoryDiv = e.target.closest('.cipher-category');
            const checkboxes = categoryDiv.querySelectorAll('input[type="checkbox"]');
            const allChecked = Array.from(checkboxes).every(cb => cb.checked);
            categoryDiv.querySelector('.category-select-btn').textContent = allChecked ? 'Deselect All' : 'Select All';
            const allCheckboxes = cipherListContainer.querySelectorAll('input[type="checkbox"]');
            const allCheckedGlobal = Array.from(allCheckboxes).every(cb => cb.checked);
            selectAllBtn.textContent = allCheckedGlobal ? 'Deselect All' : 'Select All';
            calculateAndDisplay();
        });
        selectAllBtn.addEventListener('click', () => {
            const allCheckboxes = cipherListContainer.querySelectorAll('input[type="checkbox"]');
            const shouldSelect = Array.from(allCheckboxes).some(cb => !cb.checked);
            allCheckboxes.forEach(cb => cb.checked = shouldSelect);
            calculateAndDisplay();
            document.querySelectorAll('.category-select-btn').forEach(btn => btn.textContent = shouldSelect ? 'Deselect All' : 'Select All');
            selectAllBtn.textContent = shouldSelect ? 'Deselect All' : 'Select All';
        });
        wordInput.addEventListener('input', calculateAndDisplay);
        viewToggle.addEventListener('change', calculateAndDisplay);
    }
    initializePage();
});

