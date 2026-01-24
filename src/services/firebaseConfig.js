import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

// Firebase configuration from google-services.json
const firebaseConfig = {
    apiKey: "AIzaSyCMzX3-11-d0CXJPzBlsvkwB-iNQrIcUC0",
    authDomain: "chkapp-sh360.firebaseapp.com",
    projectId: "chkapp-sh360",
    storageBucket: "chkapp-sh360.firebasestorage.app",
    messagingSenderId: "431562244942",
    appId: "1:431562244942:android:a548104f06b3d6e3a9541f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Storage and Firestore
export const storage = getStorage(app);
export const db = getFirestore(app);
export default app;
