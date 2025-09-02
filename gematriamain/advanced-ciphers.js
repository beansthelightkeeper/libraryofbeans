document.addEventListener('DOMContentLoaded', () => {

    // --- DOM ELEMENTS ---
    const wordInput = document.getElementById('word-input-adv');
    const cipherListContainer = document.getElementById('cipher-list-container');
    const resultsGrid = document.getElementById('results-grid');
    const viewToggle = document.getElementById('view-toggle');
    const selectAllBtn = document.getElementById('select-all-btn');

    if (!wordInput || !cipherListContainer || !resultsGrid || !viewToggle || !selectAllBtn) {
        console.error("Essential HTML elements not found. Check the IDs in your HTML file.");
        return;
    }

    // --- FUNCTIONS ---

    /**
     * Calculates and displays the results for the selected ciphers based on the view mode.
     */
    function calculateAndDisplay() {
        const text = wordInput.value;
        resultsGrid.innerHTML = ''; // Clear previous results

        const selectedCiphers = Array.from(document.querySelectorAll('#cipher-list-container input:checked'))
            .map(input => input.value);
        
        const isCondensed = viewToggle.checked;
        resultsGrid.classList.toggle('condensed-view', isCondensed);

        if (!text.trim() || selectedCiphers.length === 0) {
            return;
        }

        selectedCiphers.forEach(cipherName => {
            if (CIPHERS[cipherName]) {
                const result = CIPHERS[cipherName].calculate(text);
                const card = isCondensed ? createCondensedCard(cipherName, result) : createDetailedCard(cipherName, result, text);
                resultsGrid.appendChild(card);
            }
        });
    }

    /**
     * Creates a condensed result card (name and total only).
     */
    function createCondensedCard(cipherName, result) {
        const card = document.createElement('div');
        card.className = 'result-card-condensed';
        
        let totalDisplay = result.total;
        if (typeof result.total === 'number') {
            totalDisplay = Math.round(result.total * 1000) / 1000;
        }

        card.innerHTML = `
            <span class="cipher-name">${cipherName}</span>
            <span class="total">${totalDisplay}</span>
        `;
        return card;
    }

    /**
     * Creates a detailed result card with a letter-by-letter breakdown.
     */
    function createDetailedCard(cipherName, result, originalText) {
        const card = document.createElement('div');
        card.className = 'result-card';
        
        let totalDisplay = result.total;
        if (typeof result.total === 'number') {
            totalDisplay = Math.round(result.total * 1000) / 1000;
        }
        
        const descriptionHTML = CIPHERS[cipherName].description ? `<p class="cipher-description">${CIPHERS[cipherName].description}</p>` : '';

        card.innerHTML = `
            <h4>${cipherName}</h4>
            <div class="total">${totalDisplay}</div>
            ${descriptionHTML}
        `;

        if (result.breakdown && result.breakdown.length > 0) {
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
                    // Match the character from the original word to the breakdown array
                    const letterData = result.breakdown[charIndex];
                    if (letterData && letterData.char.toLowerCase() === originalChar.toLowerCase()) {
                         const letterCard = document.createElement('div');
                        letterCard.className = 'breakdown-letter-card';
                        letterCard.innerHTML = `
                            <span class="letter">${letterData.char}</span>
                            <span class="value">${letterData.value}</span>
                        `;
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

    /**
     * Populates the categorized checkbox list and sets up event listeners.
     */
    function initializePage() {
        const categories = {};
        Object.keys(CIPHERS).sort().forEach(cipherName => {
            const category = CIPHERS[cipherName].category || "Uncategorized";
            if (!categories[category]) {
                categories[category] = [];
            }
            categories[category].push(cipherName);
        });

        const sortedCategories = Object.keys(categories).sort();
        
        sortedCategories.forEach(categoryName => {
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
                checkbox.type = 'checkbox';
                checkbox.value = cipherName;
                label.appendChild(checkbox);
                label.appendChild(document.createTextNode(` ${cipherName}`));
                listDiv.appendChild(label);
            });
            
            categoryDiv.appendChild(listDiv);
            cipherListContainer.appendChild(categoryDiv);

            // Add event listener for this category's select all button
            categorySelectBtn.addEventListener('click', () => {
                const checkboxes = listDiv.querySelectorAll('input[type="checkbox"]');
                const shouldSelect = Array.from(checkboxes).some(cb => !cb.checked);
                checkboxes.forEach(cb => cb.checked = shouldSelect);
                calculateAndDisplay();
            });
        });
        
        // Add listeners for dynamic button text updates
        cipherListContainer.addEventListener('change', (e) => {
            if(e.target.type === 'checkbox'){
                // Update category button
                const categoryDiv = e.target.closest('.cipher-category');
                const checkboxes = categoryDiv.querySelectorAll('input[type="checkbox"]');
                const allChecked = Array.from(checkboxes).every(cb => cb.checked);
                categoryDiv.querySelector('.category-select-btn').textContent = allChecked ? 'Deselect All' : 'Select All';

                // Update main button
                const allCheckboxes = cipherListContainer.querySelectorAll('input[type="checkbox"]');
                const allCheckedGlobal = Array.from(allCheckboxes).every(cb => cb.checked);
                selectAllBtn.textContent = allCheckedGlobal ? 'Deselect All' : 'Select All';

                calculateAndDisplay();
            }
        });

        // Main event listeners
        selectAllBtn.addEventListener('click', () => {
            const allCheckboxes = cipherListContainer.querySelectorAll('input[type="checkbox"]');
            const shouldSelect = Array.from(allCheckboxes).some(cb => !cb.checked);
            allCheckboxes.forEach(cb => cb.checked = shouldSelect);
            calculateAndDisplay();

            // Update all button texts
            document.querySelectorAll('.category-select-btn').forEach(btn => btn.textContent = shouldSelect ? 'Deselect All' : 'Select All');
            selectAllBtn.textContent = shouldSelect ? 'Deselect All' : 'Select All';
        });

        wordInput.addEventListener('input', calculateAndDisplay);
        viewToggle.addEventListener('change', calculateAndDisplay);
    }

    // --- INITIALIZATION ---
    initializePage();
});

