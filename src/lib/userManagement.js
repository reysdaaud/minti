// src/lib/userManagement.js
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from './firebase'; // db is exported from firebase.tsx now

export const initializeUserInFirestore = async (user) => {
  if (!user) {
    console.error("User not provided for initialization.");
    return;
  }
  try {
    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        name: user.displayName || 'New User',
        email: user.email,
        photoURL: user.photoURL,
        firstName: '',
        lastName: '',
        country: '', // Initialize country
        mobile: '',
        profileComplete: false,
        preferredCategories: [],
        isAdmin: false,
        coins: 0,
        lastLogin: serverTimestamp(),
        createdAt: serverTimestamp(),
        subscription: false,
        paymentHistory: [],
      });
      console.log("User initialized in Firestore:", user.uid);
    } else {
      const existingData = userDoc.data();
      const updates = { lastLogin: serverTimestamp() };
      if (typeof existingData.profileComplete === 'undefined') {
        updates.profileComplete = false;
      }
      if (typeof existingData.firstName === 'undefined') {
        updates.firstName = '';
      }
      if (typeof existingData.lastName === 'undefined') {
        updates.lastName = '';
      }
      if (typeof existingData.country === 'undefined') { // Add country check
        updates.country = '';
      }
      if (typeof existingData.mobile === 'undefined') {
        updates.mobile = '';
      }
      if (typeof existingData.preferredCategories === 'undefined') {
        updates.preferredCategories = [];
      }
      if (typeof existingData.isAdmin === 'undefined') {
        updates.isAdmin = false;
      }
      await updateDoc(userRef, updates);
      console.log("User already exists, updated last login and ensured new fields:", user.uid);
    }
  } catch (error) {
    console.error("Error initializing/updating user in Firestore:", error);
    throw error; 
  }
};

export const trackArticleAccessInFirestore = async (/* navigate, setShowPreview */) => {
  console.warn("trackArticleAccessInFirestore needs review for current app logic.");
};
