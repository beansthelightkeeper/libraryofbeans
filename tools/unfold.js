<script type="module">
        // Firebase Imports
        import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
        import { getAuth, signInAnonymously, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
        import { getFirestore, doc, getDoc, setDoc, setLogLevel } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

        // --- Firebase Globals ---
        let db, auth;
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

        // --- Firebase Initialization ---
        async function initializeFirebase() {
            try {
                const firebaseConfigStr = typeof __firebase_config !== 'undefined' ? __firebase_config : '{}';
                if (!firebaseConfigStr || firebaseConfigStr === '{}') {
                    throw new Error("Firebase config is not available.");
                }
                const firebaseConfig = JSON.parse(firebaseConfigStr);
                const app = initializeApp(firebaseConfig);
                db = getFirestore(app);
                auth = getAuth(app);
                setLogLevel('debug');

                const authToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
                if (authToken) {
                    await signInWithCustomToken(auth, authToken);
                } else {
                    await signInAnonymously(auth);
                }
                console.log("Firebase initialized and user signed in:", auth.currentUser?.uid);
                document.getElementById('firebaseStatus').textContent = 'Firebase Connected';
            } catch (error) {
                console.error("Firebase initialization failed:", error);
                const firebaseRadio = document.querySelector('input[value="firebase"]');
                if (firebaseRadio) {
                    firebaseRadio.disabled = true;
                    firebaseRadio.parentElement.style.opacity = '0.5';
                    firebaseRadio.parentElement.title = 'Firebase is not available';
                }
                 document.getElementById('firebaseStatus').textContent = 'Firebase Failed';
                 document.getElementById('firebaseStatus').classList.add('text-red-500');

            }
        }
        
        window.onload = initializeFirebase;


        // --- Configuration ---
        const LETTER_VALUES = {};
        for (let i = 0; i < 26; i++) {
            LETTER_VALUES[String.fromCharCode('A'.charCodeAt(0) + i)] = i + 1;
        }

        // --- Core Calculation Functions ---
        function cleanInput(text) {
            return text.replace(/[^a-zA-Z]/g, '').toUpperCase();
        }

        function calculateLinearDistances(word) {
            if (word.length < 2) return [];
            const values = Array.from(word).map(char => LETTER_VALUES[char]);
            const distances = [];
            for (let i = 1; i < values.length; i++) {
                distances.push(values[i] - values[i - 1]);
            }
            return distances;
        }

        function calculateTotalShift(distances) {
            if (!distances.length) return 0;
            return distances.reduce((sum, current) => sum + current, 0);
        }

        function getIntervalSignature(distances) {
            return distances;
        }

        function calculateCircularDistances(word) {
            if (word.length < 2) return [];
            const values = Array.from(word).map(char => LETTER_VALUES[char]);
            const distances = [];
            for (let i = 1; i < values.length; i++) {
                let diff = values[i] - values[i - 1];
                if (diff > 13) diff -= 26;
                else if (diff < -13) diff += 26;
                distances.push(diff);
            }
            return distances;
        }

        function calculateToneMapping(word) {
            if (!word) return [];
            return Array.from(word).map(char => ((LETTER_VALUES[char] - 1) % 7) + 1);
        }

        // --- Main Analysis and Display Function ---
        async function analyze() {
            const userInput = document.getElementById('wordInput').value;
            const resultsContainer = document.getElementById('results');
            const cleanedWord = cleanInput(userInput);

            if (!cleanedWord) {
                resultsContainer.textContent = "Input was empty after cleaning. Please provide letters.";
                return;
            }

            const storageType = document.querySelector('input[name="storageType"]:checked').value;
            resultsContainer.textContent = 'Analyzing...';
            let cachedResult = null;

            // 1. Check cache
            if (storageType === 'local') {
                cachedResult = localStorage.getItem(cleanedWord);
            } else if (storageType === 'firebase') {
                if (!db || !auth.currentUser) {
                    resultsContainer.textContent = "Firebase is not ready. Please wait.";
                    return;
                }
                try {
                    const docRef = doc(db, `artifacts/${appId}/public/data/words`, cleanedWord);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        cachedResult = docSnap.data().analysis;
                    }
                } catch (error) {
                    console.error("Error fetching from Firestore:", error);
                    resultsContainer.textContent = "Error fetching from Firebase. See console for details.";
                    return;
                }
            }

            // 2. Display cached result or perform new analysis
            if (cachedResult) {
                const cacheHeader = `--- (from ${storageType} cache) ---\n`;
                resultsContainer.textContent = cacheHeader + cachedResult;
            } else {
                const linearDist = calculateLinearDistances(cleanedWord);
                const totalShift = calculateTotalShift(linearDist);
                const intervalSig = getIntervalSignature(linearDist);
                const circularDist = calculateCircularDistances(cleanedWord);
                const circularShift = calculateTotalShift(circularDist);
                const toneMap = calculateToneMapping(cleanedWord);
                let base36Result = "N/A", toneMapAsIntStr = "N/A";

                if (toneMap.length > 0) {
                    toneMapAsIntStr = toneMap.join('');
                    try {
                        base36Result = BigInt(toneMapAsIntStr).toString(36).toUpperCase();
                    } catch (e) {
                        base36Result = "Error: Number too large.";
                    }
                }

                const timestamp = new Date().toLocaleString();
                const fullOutput = `
--- Analysis for: '${cleanedWord}' ---
  [A] Linear Distances   : [${linearDist.join(', ')}]
  [B] Total Linear Shift : ${totalShift}
  [C] Interval Signature : [${intervalSig.join(', ')}]
  [D] Circular Distances : [${circularDist.join(', ')}]
      Total Circular Shift: ${circularShift}
  [E] Tone Mapping (1-7) : [${toneMap.join(', ')}] -> (Number: ${toneMapAsIntStr})
  [F] Tone Map (Base36)  : ${base36Result}
--- Analyzed at: ${timestamp} ---`;
                
                resultsContainer.textContent = fullOutput.trim();

                // 3. Save the new result
                if (storageType === 'local') {
                    localStorage.setItem(cleanedWord, fullOutput.trim());
                } else if (storageType === 'firebase' && db && auth.currentUser) {
                    try {
                        const docRef = doc(db, `artifacts/${appId}/public/data/words`, cleanedWord);
                        await setDoc(docRef, { analysis: fullOutput.trim() });
                    } catch (error) {
                        console.error("Error saving to Firestore:", error);
                    }
                }
            }
        }
        
        function handleKeyPress(event) {
            if (event.key === 'Enter') analyze();
        }

        // Make functions available globally
        window.analyze = analyze;
        window.handleKeyPress = handleKeyPress;

    </script>