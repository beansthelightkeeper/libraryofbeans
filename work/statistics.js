import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getFirestore, collection, query, orderBy, limit, onSnapshot } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { firebaseConfig } from '../firebase-config2.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

document.addEventListener('DOMContentLoaded', () => {
    const DISPLAY_LIMIT = 20;
    
    const useLocalCheckbox = document.getElementById('use-localstorage');
    const mostSearchedBody = document.getElementById('most-searched-body');
    const recentSearchesBody = document.getElementById('recent-searches-body');
    const recentAdditionsBody = document.getElementById('recent-additions-body');

    // Store unsubscribe functions to clean up listeners
    let unsubscribeSearches = null;
    let unsubscribeHistory = null;
    let unsubscribeWords = null;

    // NEW: Function to set up real-time listeners
    function setupFirebaseListeners() {
        // Unsubscribe from any existing listeners before creating new ones
        if (unsubscribeSearches) unsubscribeSearches();
        if (unsubscribeHistory) unsubscribeHistory();
        if (unsubscribeWords) unsubscribeWords();

        // Most Searched
        const mostSearchedQuery = query(collection(db, 'searches'), orderBy('count', 'desc'), limit(DISPLAY_LIMIT));
        unsubscribeSearches = onSnapshot(mostSearchedQuery, (snapshot) => {
            mostSearchedBody.innerHTML = snapshot.empty ?
                `<tr><td colspan="2">No search data yet.</td></tr>` :
                snapshot.docs.map(doc => `<tr><td>${doc.id}</td><td>${doc.data().count}</td></tr>`).join('');
        }, (error) => {
            console.error("Error fetching most searched:", error);
            mostSearchedBody.innerHTML = `<tr><td colspan="2">Error loading data.</td></tr>`;
        });

        // Recent Searches
        const recentSearchesQuery = query(collection(db, 'searchHistory'), orderBy('timestamp', 'desc'), limit(DISPLAY_LIMIT));
        unsubscribeHistory = onSnapshot(recentSearchesQuery, (snapshot) => {
            recentSearchesBody.innerHTML = snapshot.empty ?
                `<tr><td>No recent searches yet.</td></tr>` :
                snapshot.docs.map(doc => `<tr><td><a href="calculator.html?word=${encodeURIComponent(doc.data().term)}">${doc.data().term}</a></td></tr>`).join('');
        }, (error) => {
            console.error("Error fetching recent searches:", error);
            recentSearchesBody.innerHTML = `<tr><td>Error loading data.</td></tr>`;
        });

        // Recent Additions
        const recentAdditionsQuery = query(collection(db, 'wordDatabase'), orderBy('createdAt', 'desc'), limit(DISPLAY_LIMIT));
        unsubscribeWords = onSnapshot(recentAdditionsQuery, (snapshot) => {
            recentAdditionsBody.innerHTML = snapshot.empty ?
                `<tr><td colspan="4">No words added yet.</td></tr>` :
                snapshot.docs.map(doc => {
                    const d = doc.data();
                    return `<tr><td><a href="calculator.html?word=${encodeURIComponent(d.word)}">${d.word}</a></td><td>${d.jewish}</td><td>${d.english}</td><td>${d.simple}</td></tr>`
                }).join('');
        }, (error) => {
            console.error("Error fetching recent additions:", error);
            recentAdditionsBody.innerHTML = `<tr><td colspan="4">Error loading data.</td></tr>`;
        });
    }

    function loadLocalData() {
        // If switching to local, make sure to unsubscribe from Firebase listeners
        if (unsubscribeSearches) unsubscribeSearches();
        if (unsubscribeHistory) unsubscribeHistory();
        if (unsubscribeWords) unsubscribeWords();

        const db = JSON.parse(localStorage.getItem('wordDatabase') || '[]');
        const recentAdditions = db.slice().reverse().slice(0, DISPLAY_LIMIT);
        recentAdditionsBody.innerHTML = recentAdditions.length === 0 ?
            `<tr><td colspan="4">No words in Local Storage.</td></tr>` :
            recentAdditions.map(e => `<tr><td><a href="calculator.html?word=${encodeURIComponent(e.word)}">${e.word}</a></td><td>${e.jewish}</td><td>${e.english}</td><td>${e.simple}</td></tr>`).join('');
        
        mostSearchedBody.innerHTML = `<tr><td colspan="2">Search tracking is only available with Firebase.</td></tr>`;
        recentSearchesBody.innerHTML = `<tr><td>Search tracking is only available with Firebase.</td></tr>`;
    }

    function refreshStatistics() {
        if (useLocalCheckbox.checked) {
            loadLocalData();
        } else {
            // Sign in anonymously to get permission to read data
            signInAnonymously(auth).then(() => {
                console.log("Signed in anonymously.");
                setupFirebaseListeners();
            }).catch((error) => {
                console.error("Anonymous sign-in failed:", error);
                // Display error in all tables if sign-in fails
                mostSearchedBody.innerHTML = `<tr><td colspan="2">Authentication failed.</td></tr>`;
                recentSearchesBody.innerHTML = `<tr><td>Authentication failed.</td></tr>`;
                recentAdditionsBody.innerHTML = `<tr><td colspan="4">Authentication failed.</td></tr>`;
            });
        }
    }

    useLocalCheckbox.addEventListener('change', refreshStatistics);
    refreshStatistics(); // Initial load
});

