// Import the functions you need from the SDKs you need
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAnalytics, type Analytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAl1iiyOrU49GOJdezPc-6zQPeonpJxl0I",
  authDomain: "wirenext-b4b65.firebaseapp.com",
  projectId: "wirenext-b4b65",
  storageBucket: "wirenext-b4b65.appspot.com", // Corrected storageBucket domain
  messagingSenderId: "486545175288",
  appId: "1:486545175288:web:6d53203232567ae786810d",
  measurementId: "G-9H1ZKBRWK0"
};

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let analytics: Analytics | null = null;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  if (typeof window !== "undefined") {
    analytics = getAnalytics(app);
  }
} else {
  app = getApps()[0];
}

auth = getAuth(app);

export { app, auth, GoogleAuthProvider, analytics };
