// --- FIREBASE CONFIGURATION & INITIALIZATION ---
// This file just defines the config object and initializes Firebase.
// It does NOT use 'export'.

const firebaseConfig = {
    apiKey: "AIzaSyDDfoBX9ZkIWOJBLgJ9v5vVvRVYC2JYV0w",
    authDomain: "gematria-3ef50.firebaseapp.com",
    databaseURL: "https://gematria-3ef50-default-rtdb.firebaseio.com",
    projectId: "gematria-3ef50",
    storageBucket: "gematria-3ef50.appspot.com",
    messagingSenderId: "1049020942994",
    appId: "1:1049020942994:web:1bbeb975777e75e44f744b",
    measurementId: "G-9JD1E3H0C2"
};

// Initialize Firebase
try {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
} catch(e) {
    console.error("Firebase initialization error:", e);
}

