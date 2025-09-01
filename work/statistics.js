document.addEventListener('DOMContentLoaded', () => {
    const useLocalCheckbox = document.getElementById('use-localstorage');
    const popularityBody = document.getElementById('popularity-body');
    const recentSearchesBody = document.getElementById('recent-searches-body');
    const recentAdditionsBody = document.getElementById('recent-additions-body');

    /**
     * Populates the "Word Popularity" table.
     */
    function populatePopularityTable(dataArray) {
        if (!popularityBody) return;
        const sortedData = dataArray.sort((a, b) => (b.searchCount || 0) - (a.searchCount || 0));
        popularityBody.innerHTML = sortedData.length === 0 ? `<tr><td colspan="5">No data found.</td></tr>` : sortedData.map(entry => `
            <tr>
                <td><a href="calculator.html?word=${encodeURIComponent(entry.word)}">${entry.word}</a></td>
                <td>${entry.jewish || 'N/A'}</td>
                <td>${entry.english || 'N/A'}</td>
                <td>${entry.simple || 'N/A'}</td>
                <td>${entry.searchCount || 0}</td>
            </tr>
        `).join('');
    }

    /**
     * Populates the "Most Recently Searched" table.
     */
    function populateRecentSearchesTable(dataArray) {
        if (!recentSearchesBody) return;
        const sortedData = dataArray
            .filter(entry => entry.lastSearched) // Only include entries that have been searched
            .sort((a, b) => new Date(b.lastSearched) - new Date(a.lastSearched));
        
        recentSearchesBody.innerHTML = sortedData.length === 0 ? `<tr><td colspan="2">No search history found.</td></tr>` : sortedData.map(entry => `
            <tr>
                <td><a href="calculator.html?word=${encodeURIComponent(entry.word)}">${entry.word}</a></td>
                <td>${new Date(entry.lastSearched).toLocaleString()}</td>
            </tr>
        `).join('');
    }

    /**
     * Populates the "Most Recently Added" table.
     * Uses a heuristic: words with a search count of 1 are considered "new".
     */
    function populateRecentAdditionsTable(dataArray) {
        if (!recentAdditionsBody) return;
        const sortedData = dataArray
            .filter(entry => entry.searchCount === 1 && entry.lastSearched)
            .sort((a, b) => new Date(b.lastSearched) - new Date(a.lastSearched));
            
        recentAdditionsBody.innerHTML = sortedData.length === 0 ? `<tr><td colspan="4">No recently added words found.</td></tr>` : sortedData.map(entry => `
            <tr>
                <td><a href="calculator.html?word=${encodeURIComponent(entry.word)}">${entry.word}</a></td>
                <td>${entry.jewish || 'N/A'}</td>
                <td>${entry.english || 'N/A'}</td>
                <td>${entry.simple || 'N/A'}</td>
            </tr>
        `).join('');
    }

    /**
     * Loads and displays data from Firebase Realtime Database.
     */
    async function loadFirebaseData() {
        try {
            const snapshot = await firebase.database().ref('words').once('value');
            const data = snapshot.val();
            if (data) {
                const dataArray = Object.values(data);
                populatePopularityTable(dataArray);
                populateRecentSearchesTable(dataArray);
                populateRecentAdditionsTable(dataArray);
            } else {
                const emptyMessage = `<tr><td colspan="5">The Firebase database is empty.</td></tr>`;
                if (popularityBody) popularityBody.innerHTML = emptyMessage;
                if (recentSearchesBody) recentSearchesBody.innerHTML = `<tr><td colspan="2">The Firebase database is empty.</td></tr>`;
                if (recentAdditionsBody) recentAdditionsBody.innerHTML = `<tr><td colspan="4">The Firebase database is empty.</td></tr>`;
            }
        } catch (error) {
            console.error("Error loading Firebase data:", error);
            const errorMessage = `<tr><td colspan="5">Error connecting to the database.</td></tr>`;
            if (popularityBody) popularityBody.innerHTML = errorMessage;
            if (recentSearchesBody) recentSearchesBody.innerHTML = `<tr><td colspan="2">Error connecting to the database.</td></tr>`;
            if (recentAdditionsBody) recentAdditionsBody.innerHTML = `<tr><td colspan="4">Error connecting to the database.</td></tr>`;
        }
    }

    /**
     * Loads and displays data from the browser's Local Storage.
     */
    function loadLocalData() {
        const localData = localStorage.getItem('wordDatabase');
        if (localData) {
            const dataArray = JSON.parse(localData);
            populatePopularityTable(dataArray);
            populateRecentSearchesTable(dataArray);
            populateRecentAdditionsTable(dataArray);
        } else {
            const emptyMessage = `<tr><td colspan="5">No data found in Local Storage.</td></tr>`;
            if (popularityBody) popularityBody.innerHTML = emptyMessage;
            if (recentSearchesBody) recentSearchesBody.innerHTML = `<tr><td colspan="2">No data found in Local Storage.</td></tr>`;
            if (recentAdditionsBody) recentAdditionsBody.innerHTML = `<tr><td colspan="4">No data found in Local Storage.</td></tr>`;
        }
    }

    /**
     * Decides whether to load from Firebase or Local Storage based on the checkbox.
     */
    function refreshStatistics() {
        if (useLocalCheckbox.checked) {
            loadLocalData();
        } else {
            loadFirebaseData();
        }
    }

    // --- Event Listeners ---
    useLocalCheckbox.addEventListener('change', refreshStatistics);

    // --- Initial Load ---
    refreshStatistics();
});

