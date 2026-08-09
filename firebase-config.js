/* ==========================================================================
   STONE • PAPER • SCISSORS - FIREBASE CLIENT CONFIGURATION & INITIALIZATION
   ========================================================================== */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc, 
    updateDoc, 
    addDoc, 
    collection, 
    query, 
    where, 
    orderBy, 
    limit, 
    getDocs, 
    serverTimestamp,
    runTransaction,
    onSnapshot
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import {
    getDatabase,
    ref as rtdbRef,
    set as rtdbSet,
    push as rtdbPush,
    onValue as rtdbOnValue,
    onDisconnect as rtdbOnDisconnect,
    serverTimestamp as rtdbServerTimestamp,
    remove as rtdbRemove,
    get as rtdbGet
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js';

// Default / Fallback Firebase Client Configuration
let firebaseConfig = {
    apiKey: "AIzaSyD2mBByngfAGI6bB7kU7j9Dsw2feEeqpik",
    authDomain: "fir-p-s-game.firebaseapp.com",
    projectId: "fir-p-s-game",
    storageBucket: "fir-p-s-game.firebasestorage.app",
    messagingSenderId: "14864680419",
    appId: "1:14864680419:web:abce90dac0a78bf72a0cd6",
    databaseURL: "https://fir-p-s-game-default-rtdb.firebaseio.com"
};

// Fetch environment config dynamically from Express server if available
try {
    const res = await fetch('/api/config');
    if (res.ok) {
        const envConfig = await res.json();
        if (envConfig.apiKey) {
            firebaseConfig = { ...firebaseConfig, ...envConfig };
        }
    }
} catch (e) {
    console.warn('Using local fallback Firebase config:', e);
}

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const rtdb = getDatabase(app);

export {
    app,
    auth,
    db,
    rtdb,
    // Auth Exports
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    // Firestore Exports
    doc,
    setDoc,
    getDoc,
    updateDoc,
    addDoc,
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    serverTimestamp,
    runTransaction,
    onSnapshot,
    // Realtime Database Exports
    rtdbRef,
    rtdbSet,
    rtdbPush,
    rtdbOnValue,
    rtdbOnDisconnect,
    rtdbServerTimestamp,
    rtdbRemove,
    rtdbGet
};
