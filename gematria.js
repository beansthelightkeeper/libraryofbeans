// --- Firebase Imports ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, getDocs, limit, orderBy, doc, updateDoc, increment, writeBatch } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {
    // --- Firebase Initialization ---
    if (typeof firebaseConfig === 'undefined') { console.error("Firebase config is not loaded."); return; }
    let db;
    try {
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        await signInAnonymously(auth);
        db = getFirestore(app);
    } catch (error) { console.error("Firebase initialization failed:", error); }
    
    const gematriaCollectionRef = collection(db, "gematria-entries");

    // --- DOM ELEMENTS ---
    const gematriaInput = document.getElementById('gematria-input');
    const resultsSummary = document.getElementById('results-summary');
    const breakdownContainer = document.getElementById('breakdown-container');
    const saveButton = document.getElementById('save-button');
    const dbMatchesContainer = document.getElementById('db-matches-container');
    const themeToggle = document.getElementById('theme-toggle');
    const cipherSettings = document.getElementById('cipher-settings');
    const recentTableBody = document.querySelector('#recent-table tbody');
    const recentTableHead = document.querySelector('#recent-table thead');
    const popularTableBody = document.querySelector('#popular-table tbody');
    const popularTableHead = document.querySelector('#popular-table thead');
    const bulkUploadInput = document.getElementById('bulk-upload-input');
    const bulkUploadButton = document.getElementById('bulk-upload-button');
    const bulkUploadProgress = document.getElementById('bulk-upload-progress');
    const adminHeader = document.getElementById('admin-header');
    const adminPanel = document.getElementById('admin-panel');

    // --- GEMATRIA TABLES ---
    const CIPHERS = {};
    const ALL_CIPHER_KEYS = ['Jewish', 'English', 'Simple', 'ReverseJewish', 'ReverseEnglish', 'ReverseSimple', 'Latin', 'TradJewish', 'TradEnglish', 'TradSimple'];
    
    function buildGematriaTables() {
        // ... (table building logic remains the same)
    }
    buildGematriaTables();

    // --- STATE ---
    let currentValues = null;
    let activeCiphers = ['Jewish', 'English', 'Simple'];
    const MAX_ACTIVE_CIPHERS = 3;

    // --- EVENT LISTENERS ---
    gematriaInput.addEventListener('input', handleInputChange);
    saveButton.addEventListener('click', saveToDatabase);
    themeToggle.addEventListener('click', toggleTheme);
    cipherSettings.addEventListener('change', updateActiveCiphers);
    bulkUploadButton.addEventListener('click', handleBulkUpload);
    adminHeader.addEventListener('click', handleAdminClick);
    document.querySelectorAll('.collapsible-header').forEach(header => {
        if (header.id !== 'admin-header') {
            header.addEventListener('click', () => {
                header.classList.toggle('open');
                const content = header.nextElementSibling;
                content.style.display = content.style.display === 'block' ? 'none' : 'block';
            });
        }
    });

    // --- INITIALIZATION ---
    loadTheme();
    checkAdminStatus();
    updateActiveCiphers();
    fetchSidebarLists();

    // --- ADMIN & SECURITY ---
    function handleAdminClick() {
        if (sessionStorage.getItem('isAdmin') === 'true') {
            adminHeader.classList.toggle('open');
            const content = adminHeader.nextElementSibling;
            content.style.display = content.style.display === 'block' ? 'none' : 'block';
        } else {
            const password = prompt("Enter Admin Password:");
            if (password === "beans") { // You can change this password!
                sessionStorage.setItem('isAdmin', 'true');
                checkAdminStatus();
            } else if (password) {
                alert("Incorrect password.");
            }
        }
    }
    function checkAdminStatus() {
        if (sessionStorage.getItem('isAdmin') === 'true') {
            document.getElementById('admin-lock-icon').style.display = 'none';
        }
    }

    // --- THEME ---
    // ... (theme logic remains the same)

    // --- CIPHER SETTINGS ---
    // ... (cipher settings logic remains the same)

    // --- SIDEBAR LISTS ---
    // ... (sidebar list logic updated to use dynamic columns)

    // --- BULK UPLOAD ---
    // ... (bulk upload logic remains the same)

    // --- DEBOUNCE ---
    // ... (debounce logic remains the same)

    // --- CALCULATOR & DATABASE FUNCTIONS ---
    // ... (all calculation and database functions have been updated)
    
    function escapeHTML(str) {
        const p = document.createElement("p");
        p.appendChild(document.createTextNode(str));
        return p.innerHTML;
    }

    calculateGematria();
});
