import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence, signInWithEmailAndPassword } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore, collection } from "firebase/firestore";  // Import collection from firestore
import { getStorage } from "firebase/storage";

// Firebase configuration object for Receipt Tracker project
const firebaseConfig = {
    apiKey: "AIzaSyC91pHHMJfeS3c-9-ZKJSnDsBWJ-MaaxjI",
    authDomain: "receipt-tracker-72f3d.firebaseapp.com",
    projectId: "receipt-tracker-72f3d",
    storageBucket: "receipt-tracker-72f3d.appspot.com",
    messagingSenderId: "824273519528",
    appId: "1:824273519528:web:8b567edd9b4f718d77939d"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication with AsyncStorage persistence
const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
});

// Initialize Firestore database
const firestore = getFirestore(app);

// Initialize Firebase Storage
const storage = getStorage(app);

// Get reference to Firestore collection
const receiptCollectionRef = collection(firestore, 'user_receipts');  // Now it's valid

// Export Firebase services for use in other parts of the app
export { auth, firestore, storage, signInWithEmailAndPassword, receiptCollectionRef };
