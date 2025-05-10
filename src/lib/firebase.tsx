// src/lib/firebase.tsx
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, type Auth, type User as FirebaseUser } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { initializeUserInFirestore } from './userManagement'; // Corrected import name to match userManagement.js


// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAl1iiyOrU49GOJdezPc-6zQPeonpJxl0I",
  authDomain: "wirenext-b4b65.firebaseapp.com",
  projectId: "wirenext-b4b65",
  storageBucket: "wirenext-b4b65.appspot.com", 
  messagingSenderId: "486545175288",
  appId: "1:486545175288:web:6d53203232567ae786810d",
  measurementId: "G-9H1ZKBRWK0"
};


let app: FirebaseApp;
let authInstance: Auth; 
let dbInstance: Firestore; 

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}
authInstance = getAuth(app);
dbInstance = getFirestore(app);


interface AuthContextType {
  user: FirebaseUser | null;
  signInWithGoogle: () => Promise<FirebaseUser | null>;
  signOutUser: () => Promise<void>;
  loading: boolean; 
  error: Error | null; 
  firebaseAuth: Auth; 
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuthContext = () => { 
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};

export const signInWithGoogle = async (): Promise<FirebaseUser | null> => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(authInstance, provider);
    const user = result.user;
    // initializeUserInFirestore is now called within onAuthStateChanged in AuthProvider
    return user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(authInstance);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState<Error | null>(null); 


  useEffect(() => {
    const unsubscribe = authInstance.onAuthStateChanged(
      async (currentUser) => {
        try {
          if (currentUser) {
            // Pass dbInstance to initializeUserInFirestore if it requires it
            await initializeUserInFirestore(currentUser); 
          }
          setUser(currentUser);
        } catch (e) {
          console.error("Error during onAuthStateChanged user processing:", e);
          // Handle error appropriately, e.g., set an error state or sign out
          setUser(null); 
          setError(e as Error);
        } finally {
          setLoading(false); 
        }
      },
      (err) => { 
        setError(err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, signInWithGoogle, signOutUser, loading, error, firebaseAuth: authInstance }}>
      {children}
    </AuthContext.Provider>
  );
};

// Export auth and db instances
export { authInstance as auth, dbInstance as db, GoogleAuthProvider };
