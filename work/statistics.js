import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getFirestore, collection, query, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";
import { firebaseConfig } from '../firebase-config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', () => {
    const DISPLAY_LIMIT = 20;
    
    // Element References
    const useLocalCheckbox = document.getElementById('use-localstorage');
    const mostSearchedBody = document.getElementById('most-searched-body');
    const recentSearchesBody = document.getElementById('recent-searches-body');
    const recentAdditionsBody = document.getElementById('recent-additions-body');

    // --- FIREBASE DATA FETCHING ---
    async function loadMostSearchedFromFirebase() {
        if (!mostSearchedBody) return;
        try {
            const searchesCol = collection(db, 'searches');
            const q = query(searchesCol, orderBy('count', 'desc'), limit(DISPLAY_LIMIT));
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) {
                mostSearchedBody.innerHTML = `<tr><td colspan="2">No search data in Firebase.</td></tr>`;
            } else {
                let html = '';
                querySnapshot.forEach(doc => html += `<tr><td>${doc.id}</td><td>${doc.data().count}</td></tr>`);
                mostSearchedBody.innerHTML = html;
            }
        } catch (error) {
            console.error("Firebase Error (Most Searched):", error);
            mostSearchedBody.innerHTML = `<tr><td colspan="2">Error loading Firebase data.</td></tr>`;
        }
    }

    async function loadRecentSearchesFromFirebase() {
        if (!recentSearchesBody) return;
        try {
            const historyCol = collection(db, 'searchHistory');
            const q = query(historyCol, orderBy('timestamp', 'desc'), limit(DISPLAY_LIMIT));
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) {
                recentSearchesBody.innerHTML = `<tr><td>No recent searches in Firebase.</td></tr>`;
            } else {
                let html = '';
                querySnapshot.forEach(doc => html += `<tr><td><a href="gematria_calculator.html?word=${encodeURIComponent(doc.data().term)}">${doc.data().term}</a></td></tr>`);
                recentSearchesBody.innerHTML = html;
            }
        } catch (error) {
            console.error("Firebase Error (Recent Searches):", error);
            recentSearchesBody.innerHTML = `<tr><td>Error loading Firebase data.</td></tr>`;
        }
    }

    async function loadRecentAdditionsFromFirebase() {
        if (!recentAdditionsBody) return;
        try {
            const wordsCol = collection(db, 'wordDatabase');
            const q = query(wordsCol, orderBy('createdAt', 'desc'), limit(DISPLAY_LIMIT));
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) {
                recentAdditionsBody.innerHTML = `<tr><td colspan="4">No words added in Firebase.</td></tr>`;
            } else {
                let html = '';
                querySnapshot.forEach(doc => {
                    const entry = doc.data();
                    html += `<tr><td><a href="gematria_calculator.html?word=${encodeURIComponent(entry.word)}">${entry.word}</a></td><td>${entry.jewish}</td><td>${entry.english}</td><td>${entry.simple}</td></tr>`;
                });
                recentAdditionsBody.innerHTML = html;
            }
        } catch (error) {
            console.error("Firebase Error (Recent Additions):", error);
            recentAdditionsBody.innerHTML = `<tr><td colspan="4">Error loading Firebase data.</td></tr>`;
        }
    }

    // --- LOCALSTORAGE DATA FETCHING ---
    function loadMostSearchedFromLocal() {
        const dbString = localStorage.getItem('gematriaSentencesDB') || '{}';
        const records = Object.entries(JSON.parse(dbString)).map(([term, count]) => ({ term, count }));
        records.sort((a, b) => b.count - a.count);
        const topRecords = records.slice(0, DISPLAY_LIMIT);
        if (topRecords.length === 0) {
            mostSearchedBody.innerHTML = `<tr><td colspan="2">No search data in Local Storage.</td></tr>`;
        } else {
            mostSearchedBody.innerHTML = topRecords.map(r => `<tr><td>${r.term}</td><td>${r.count}</td></tr>`).join('');
        }
    }
    
    function loadRecentSearchesFromLocal() {
        const history = JSON.parse(localStorage.getItem('gematriaSearchHistory') || '[]');
        const recent = history.slice(0, DISPLAY_LIMIT);
        if (recent.length === 0) {
            recentSearchesBody.innerHTML = `<tr><td>No recent searches in Local Storage.</td></tr>`;
        } else {
            recentSearchesBody.innerHTML = recent.map(term => `<tr><td><a href="gematria_calculator.html?word=${encodeURIComponent(term)}">${term}</a></td></tr>`).join('');
        }
    }

    function loadRecentAdditionsFromLocal() {
        const db = JSON.parse(localStorage.getItem('gematriaWordDatabase') || '[]');
        const recent = db.slice().reverse().slice(0, DISPLAY_LIMIT);
        if (recent.length === 0) {
            recentAdditionsBody.innerHTML = `<tr><td colspan="4">No words added in Local Storage.</td></tr>`;
        } else {
            recentAdditionsBody.innerHTML = recent.map(e => `<tr><td><a href="gematria_calculator.html?word=${encodeURIComponent(e.word)}">${e.word}</a></td><td>${e.jewish}</td><td>${e.english}</td><td>${e.simple}</td></tr>`).join('');
        }
    }

    // --- MAIN LOGIC ---
    function refreshStatistics() {
        const useLocal = useLocalCheckbox.checked;

        if (useLocal) {
            loadMostSearchedFromLocal();
            loadRecentSearchesFromLocal();
            loadRecentAdditionsFromLocal();
        } else {
            loadMostSearchedFromFirebase();
            loadRecentSearchesFromFirebase();
            loadRecentAdditionsFromFirebase();
        }
    }

    // Event listener for the checkbox
    useLocalCheckbox.addEventListener('change', refreshStatistics);
    
    // Initial data load on page start
    refreshStatistics();
});

