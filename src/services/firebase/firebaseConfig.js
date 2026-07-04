import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAoYOWiNnK6kKTL1YrJpv8dg9oWTfTCuP4",
  authDomain: "nutrilens-5f25c.firebaseapp.com",
  projectId: "nutrilens-5f25c",
  storageBucket: "nutrilens-5f25c.firebasestorage.app",
  messagingSenderId: "221311039654",
  appId: "1:221311039654:web:7c40dedeb499c0107a5c67",
  measurementId: "G-5702M2Q741"
};

// Initialize Firebase App (prevent re-initializing on hot reload in Expo)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth with AsyncStorage persistence for React Native
let auth;
if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  } catch (error) {
    // If auth was already initialized during hot reload, get the existing instance
    auth = getAuth(app);
  }
}

// Initialize Firestore Database
const db = getFirestore(app);

export { app, auth, db };