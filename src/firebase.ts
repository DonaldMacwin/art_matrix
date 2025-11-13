import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyAyw4ASh45xBM0gW8303NsMP4SOwfdkWL0",
  authDomain: "art-matrix.firebaseapp.com",
  projectId: "art-matrix",
  storageBucket: "art-matrix.firebasestorage.app",
  messagingSenderId: "899952652691",
  appId: "1:899952652691:web:813e9d0ae2e86f64f9f866",
  measurementId: "G-KT7MH9L51P"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app)