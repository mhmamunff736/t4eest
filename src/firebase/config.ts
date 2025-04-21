import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Replace these with your own Firebase config
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAFdyee2k9ZnGPKWnTY8RbkNyCtYY7MXQo",
  authDomain: "ux-generator-pro.firebaseapp.com",
  databaseURL: "https://ux-generator-pro-default-rtdb.firebaseio.com",
  projectId: "ux-generator-pro",
  storageBucket: "ux-generator-pro.firebasestorage.app",
  messagingSenderId: "464802778815",
  appId: "1:464802778815:web:32241a6729c0372452000a"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db }; 