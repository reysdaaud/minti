// src/lib/userManagement.js
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from './firebase'; // Adjust path if needed

// Function to initialize user if not present in Firestore
export const initializeUserInFirestore = async (user) => { // Renamed to avoid conflict and match original
  if (!user) {
    console.error("User not provided for initialization.");
    return;
  }
  try {
    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      await setDoc(userRef, {
        uid: user.uid, // Storing UID as per original logic
        name: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        articleCount: 0, // Set initial article count to 0
        lastLogin: serverTimestamp(), // Use serverTimestamp for consistency
        createdAt: serverTimestamp(), // Added createdAt
        subscription: false, // Set initial subscription status to false
        coins: 0, // Initialize wallet balance (coins)
      });
      console.log("User initialized in Firestore:", user.uid);
    } else {
      // Optionally update last login time for existing users
      await updateDoc(userRef, { lastLogin: serverTimestamp() });
      console.log("User already exists, updated last login:", user.uid);
    }
  } catch (error) {
    console.error("Error initializing user:", error);
    // It's generally better to re-throw or handle errors specifically based on app needs
    // For now, logging and not throwing to avoid breaking flows if this is non-critical
  }
};

// Function to track article access and check wallet balance
// This function seems specific to an article-based app.
// For the current Crypto Exchange app, this might not be directly applicable.
// Keeping the structure but commenting out parts that don't fit the current context.
export const trackArticleAccessInFirestore = async (navigate, setShowPreview) => {
  try {
    const currentUser = auth.currentUser; // Changed variable name for clarity
    console.log("trackArticleAccess - Current user:", currentUser); // Debugging statement
    if (currentUser) {
      // This part assumes a 'topup' collection and specific logic (e.g., deducting coins for articles)
      // This needs to be adapted or removed if not relevant to the Crypto Exchange app's features.
      // For now, I will keep the structure but this logic might need to change.

      const userRef = doc(db, "users", currentUser.uid); // Reference to the user document
      const userDoc = await getDoc(userRef);
      console.log("trackArticleAccess - User document data:", userDoc.data()); // Debugging statement

      if (!userDoc.exists()) {
        console.warn("User document does not exist for balance check.");
        // Handle case where user document might not exist (e.g., after new sign-up before full init)
        if (window.confirm("Your account is not fully set up. Please try again or contact support.")) {
          // Optionally redirect or guide user
        }
        return;
      }

      let balance = userDoc.data().coins || 0; // Fetch balance from user document

      // The following logic is for an article-based system.
      // It will need to be adapted or removed for the coin purchase system.
      // For now, let's assume a hypothetical cost for an action.
      const costOfAction = 1; // Example cost

      if (balance < costOfAction) {
        // Redirect to top-up page if balance is less than cost
        if (window.confirm(`Your coin balance (${balance}) is too low for this action (cost: ${costOfAction}). Please top up your account.`)) {
          // For a real app, navigate to the top-up section.
          // For now, the top-up is handled via a dialog in UserActions.tsx
          // This navigation might not be the best approach here.
          // We can show a toast instead.
          console.log("Redirecting to top-up or showing top-up dialog would happen here.");
          // navigate('/top-up'); // Example, if there was a dedicated top-up page
        }
      } else {
        balance -= costOfAction; // Deduct cost from the wallet balance
        await updateDoc(userRef, {
          coins: balance, // Update the wallet balance
        });
        console.log("trackArticleAccess - Action performed. Updated balance:", balance); // Debugging statement

        if (balance < 10) { // Example threshold for low balance warning
          // Show content preview with buttons if balance is low but still positive
          // This `setShowPreview` is specific to an article context.
          if (setShowPreview) setShowPreview(true);
          console.log("User balance is low:", balance);
        }
      }
    } else {
      console.warn("trackArticleAccess - No authenticated user found.");
    }
  } catch (error) {
    console.error("Error tracking article/action access:", error);
    // Avoid throwing here unless the calling code is prepared to handle it
  }
};
