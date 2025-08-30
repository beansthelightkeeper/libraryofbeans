import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, query, orderBy, limit, getDocs, where, increment } from "firebase/firestore";
import { firebaseConfig } from './firebase-config.js';

const app = initializeApp(firebaseConfig);
const fsdb = getFirestore(app);
const COLLECTION = 'searches';

export async function recordSearch(term, jewish = null, english = null, simple = null) {
  const cleanedTerm = term.trim().toLowerCase();
  if (!cleanedTerm) return;

  const docRef = doc(fsdb, COLLECTION, cleanedTerm);
  const docSnap = await getDoc(docRef);
  const timestamp = Date.now();

  if (docSnap.exists()) {
    await updateDoc(docRef, {
      count: increment(1),
      lastSearched: timestamp
    });
  } else {
    await setDoc(docRef, {
      term: cleanedTerm,
      jewish,
      english,
      simple,
      count: 1,
      lastSearched: timestamp
    });
  }
}

export async function getTopSearches(lim = 10) {
  const q = query(collection(fsdb, COLLECTION), orderBy('count', 'desc'), limit(lim));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => d.data());
}

export async function getRecentSearches(lim = 10) {
  const q = query(collection(fsdb, COLLECTION), orderBy('lastSearched', 'desc'), limit(lim));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => d.data());
}

export async function getMatchesByJewish(value, lim = 50) {
  const q = query(collection(fsdb, COLLECTION), where('jewish', '==', value), orderBy('count', 'desc'), limit(lim));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => d.data());
}