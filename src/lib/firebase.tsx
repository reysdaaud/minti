// src/lib/firebase.tsx
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  type Auth,
  type User as FirebaseUser
} from "firebase/auth";
import { getFirestore, type Firestore, doc, getDoc } from "firebase/firestore"; // Added doc, getDoc
import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { initializeUserInFirestore } from './userManagement';
import { useRouter } from "next/navigation"; // For redirection

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
  loading: boolean;
  error: Error | null;
  firebaseAuth: Auth;
  signInWithGoogle: () => Promise<FirebaseUser | null>;
  signOutUser: () => Promise<void>;
  userProfile: UserProfile | null; // Added for profile data
  isUserProfileLoading: boolean; // Added for profile loading state
}

export interface UserProfile {
  uid: string;
  name?: string | null;
  email?: string | null;
  photoURL?: string | null;
  firstName?: string;
  lastName?: string;
  country?: string; // Added country field
  mobile?: string;
  profileComplete?: boolean;
  preferredCategories?: string[];
  isAdmin?: boolean;
  coins?: number;
  // Add other fields from your user document as needed
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};

const firebaseSignInWithGoogle = async (): Promise<FirebaseUser | null> => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(authInstance, provider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

const firebaseSignOutUser = async (): Promise<void> => {
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
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isUserProfileLoading, setIsUserProfileLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = authInstance.onAuthStateChanged(
      async (currentUser) => {
        setLoading(true);
        setIsUserProfileLoading(true);
        setUser(currentUser);
        if (currentUser) {
          try {
            await initializeUserInFirestore(currentUser); // Ensure user doc exists
            const userDocRef = doc(dbInstance, "users", currentUser.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
              const profileData = userDocSnap.data() as UserProfile;
              setUserProfile(profileData);
              // Check current path to avoid redirect loop if already on setup/preferences
              const currentPath = window.location.pathname; // Get current path
              if (!profileData.profileComplete) {
                if (currentPath !== '/profile/setup' && currentPath !== '/profile/preferences') {
                  router.push('/profile/setup');
                }
              } else if (!profileData.preferredCategories || profileData.preferredCategories.length === 0) {
                 if (currentPath !== '/profile/setup' && currentPath !== '/profile/preferences') {
                    router.push('/profile/preferences');
                 }
              }
            } else {
              setUserProfile(null);
              const currentPath = window.location.pathname;
              if (currentPath !== '/profile/setup' && currentPath !== '/profile/preferences') {
                router.push('/profile/setup');
              }
            }
          } catch (e) {
            console.error("Error during onAuthStateChanged user processing:", e);
            setUserProfile(null);
            setError(e as Error);
          } finally {
            setIsUserProfileLoading(false);
          }
        } else {
          setUserProfile(null);
          setIsUserProfileLoading(false);
        }
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
        setIsUserProfileLoading(false);
      }
    );
    return () => unsubscribe();
  }, [router]); // Added router to dependency array

  const contextValue: AuthContextType = {
    user,
    loading,
    error,
    firebaseAuth: authInstance,
    signInWithGoogle: firebaseSignInWithGoogle,
    signOutUser: firebaseSignOutUser,
    userProfile,
    isUserProfileLoading,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export {
  authInstance as auth,
  dbInstance as db,
  GoogleAuthProvider,
  firebaseSignInWithGoogle as signInWithGoogle,
  firebaseSignOutUser as signOutUser
};
export type { FirebaseUser }; // Export FirebaseUser type
