document.addEventListener('DOMContentLoaded', () => {
    const mostSearchedBody = document.getElementById('most-searched-body');
    const recentSearchesBody = document.getElementById('recent-searches-body');
    const recentAdditionsBody = document.getElementById('recent-additions-body');
    const useLocalStorageCheckbox = document.getElementById('use-localstorage');

    const DISPLAY_LIMIT = 20;

    /**
     * Renders data into a table body with a consistent format.
     */
    function renderTable(tbody, data, message) {
        if (!tbody) return;
        if (!data || data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5">${message}</td></tr>`;
            return;
        }

        tbody.innerHTML = data.slice(0, DISPLAY_LIMIT).map(item => `
            <tr>
                <td><a href="calculator.html?word=${encodeURIComponent(item.word)}">${item.word}</a></td>
                <td>${item.jewish}</td>
                <td>${item.english}</td>
                <td>${item.simple}</td>
                <td>${item.searchCount || 0}</td>
            </tr>
        `).join('');
    }

    /**
     * Fetches and displays data from Firebase.
     */
    async function loadFirebaseData() {
        try {
            // This now correctly uses the Realtime Database SDK
            const snapshot = await firebase.database().ref('words').once('value');
            const data = snapshot.val();

            if (!data) {
                renderTable(mostSearchedBody, [], 'No data found in Firebase.');
                renderTable(recentSearchesBody, [], 'No data found in Firebase.');
                renderTable(recentAdditionsBody, [], 'No data found in Firebase.');
                return;
            }

            const wordsArray = Object.values(data);

            // 1. Most Searched (by searchCount)
            const mostSearched = wordsArray.slice().sort((a, b) => (b.searchCount || 0) - (a.searchCount || 0));
            renderTable(mostSearchedBody, mostSearched, 'No words have been searched yet.');

            // 2. Most Recently Searched (by lastSearched timestamp)
            const recentSearches = wordsArray.slice().sort((a, b) => new Date(b.lastSearched || 0) - new Date(a.lastSearched || 0));
            renderTable(recentSearchesBody, recentSearches, 'No searches recorded yet.');

            // 3. Most Recently Added (by createdAt timestamp)
            const recentAdditions = wordsArray.slice().sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
            renderTable(recentAdditionsBody, recentAdditions, 'No new words have been added yet.');

        } catch (error) {
            console.error("Error fetching Firebase data:", error);
            const errorMessage = 'Error loading data from Firebase.';
            renderTable(mostSearchedBody, [], errorMessage);
            renderTable(recentSearchesBody, [], errorMessage);
            renderTable(recentAdditionsBody, [], errorMessage);
        }
    }

    /**
     * Loads and displays data from Local Storage.
     */
    function loadLocalData() {
        const data = localStorage.getItem('wordDatabase');
        const wordsArray = data ? Object.values(JSON.parse(data)) : [];

        const mostSearched = wordsArray.slice().sort((a, b) => (b.searchCount || 0) - (a.searchCount || 0));
        renderTable(mostSearchedBody, mostSearched, 'No data in Local Storage.');
        
        const recentSearches = wordsArray.slice().sort((a, b) => new Date(b.lastSearched || 0) - new Date(a.lastSearched || 0));
        renderTable(recentSearchesBody, recentSearches, 'No data in Local Storage.');
        
        const recentAdditions = wordsArray.slice().sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        renderTable(recentAdditionsBody, recentAdditions, 'No new words in Local Storage.');
    }

    /**
     * Main function to decide which data source to use.
     */
    function refreshStatistics() {
        if (useLocalStorageCheckbox.checked) {
            loadLocalData();
        } else {
            loadFirebaseData();
        }
    }

    // --- Event Listeners and Initial Load ---
    useLocalStorageCheckbox.addEventListener('change', refreshStatistics);
    
    // Initial data load
    refreshStatistics();
});

