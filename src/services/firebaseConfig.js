import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

// TODO: Replace the following with your app's Firebase project configuration
// You can find this in Firebase Console -> Project Settings -> General -> Your apps
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "androidchk-33858359.firebaseapp.com",
    projectId: "androidchk-33858359",
    storageBucket: "androidchk-33858359.firebasestorage.app",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Storage and get a reference to the service
export const storage = getStorage(app);
export default app;
