import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getFirestore, collection, query, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// This script assumes 'firebaseConfig' is loaded from firebase-config.js
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- DOM Elements ---
const recentTableBody = document.querySelector("#recent-table tbody");
const popularTableBody = document.querySelector("#popular-table tbody");
const themeToggleButton = document.getElementById('theme-toggle');

// --- Theme Management ---
const ICONS = {
    sun: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`,
    moon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`
};

function applyTheme(theme) {
    document.body.dataset.theme = theme;
    themeToggleButton.innerHTML = theme === 'dark' ? ICONS.sun : ICONS.moon;
    localStorage.setItem('gematria-theme', theme);
}

function toggleTheme() {
    const currentTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(currentTheme);
}

// --- Firestore Data Fetching ---

/**
 * Fetches entries from Firestore based on a specific ordering.
 * @param {string} orderByField - The field to order by (e.g., 'timestamp').
 * @param {number} resultLimit - The max number of results to fetch.
 * @returns {Array} An array of entry objects.
 */
async function fetchEntries(orderByField, resultLimit = 10) {
    try {
        const entriesRef = collection(db, 'entries');
        const q = query(entriesRef, orderBy(orderByField, 'desc'), limit(resultLimit));
        const querySnapshot = await getDocs(q);
        
        const entries = [];
        querySnapshot.forEach((doc) => {
            entries.push(doc.data());
        });
        return entries;

    } catch (error) {
        console.error(`Error fetching entries ordered by ${orderByField}:`, error);
        return []; // Return empty array on error
    }
}

/**
 * Populates a table with word/value data.
 * @param {HTMLElement} tableBody - The tbody element to populate.
 * @param {Array} entries - The data to display.
 */
function populateTable(tableBody, entries) {
    // Clear existing rows
    tableBody.innerHTML = '';

    if (entries.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="2">No data available.</td></tr>';
        return;
    }

    entries.forEach(entry => {
        const row = tableBody.insertRow();
        const cellWord = row.insertCell();
        const cellValue = row.insertCell();

        cellWord.textContent = entry.word;
        cellValue.textContent = entry.value;
    });
}

// --- Main Execution ---

document.addEventListener('DOMContentLoaded', async () => {
    // Set initial theme
    const savedTheme = localStorage.getItem('gematria-theme') || 'dark';
    applyTheme(savedTheme);

    // Add event listener for theme toggle
    themeToggleButton.addEventListener('click', toggleTheme);
    
    // Fetch and display data
    const recentEntries = await fetchEntries('timestamp');
    populateTable(recentTableBody, recentEntries);

    const popularEntries = await fetchEntries('searchCount');
    populateTable(popularTableBody, popularEntries);
});
