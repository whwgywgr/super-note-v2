import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } 
from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js';
import { getFirestore, collection, doc, addDoc, updateDoc, deleteDoc, query, where, orderBy, onSnapshot, serverTimestamp } 
from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js';

// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBtVbxoz3y5SGF1L970XDMLFFrYcXmoXTE",
    authDomain: "supernoted-v2.firebaseapp.com",
    projectId: "supernoted-v2",
    storageBucket: "supernoted-v2.firebasestorage.app",
    messagingSenderId: "966370368481",
    appId: "1:966370368481:web:1baa0f00bf23c8ee9290a0"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// Export Firebase services
export {
    auth,
    db,
    provider,
    GoogleAuthProvider,
    signInWithPopup,
    onAuthStateChanged,
    signOut,
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp
}; 