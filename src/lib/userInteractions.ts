
// src/lib/userInteractions.ts
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import type { UserProfile } from './firebase';

export const toggleLikeContent = async (userId: string, contentId: string): Promise<boolean> => {
  if (!userId || !contentId) {
    console.error("User ID or Content ID is missing for toggleLikeContent");
    throw new Error("User ID or Content ID is missing");
  }
  const userRef = doc(db, 'users', userId);
  try {
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      console.error("User document not found for toggleLikeContent:", userId);
      throw new Error("User document not found");
    }
    const userProfile = userDoc.data() as UserProfile;
    const currentlyLiked = userProfile.likedContentIds?.includes(contentId);

    if (currentlyLiked) {
      await updateDoc(userRef, {
        likedContentIds: arrayRemove(contentId),
        updatedAt: serverTimestamp(),
      });
      return false; // Now unliked
    } else {
      await updateDoc(userRef, {
        likedContentIds: arrayUnion(contentId),
        updatedAt: serverTimestamp(),
      });
      return true; // Now liked
    }
  } catch (error) {
    console.error("Error toggling like content:", error);
    throw error;
  }
};

export const toggleSaveContent = async (userId: string, contentId: string): Promise<boolean> => {
  if (!userId || !contentId) {
    console.error("User ID or Content ID is missing for toggleSaveContent");
    throw new Error("User ID or Content ID is missing");
  }
  const userRef = doc(db, 'users', userId);
  try {
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      console.error("User document not found for toggleSaveContent:", userId);
      throw new Error("User document not found");
    }
    const userProfile = userDoc.data() as UserProfile;
    const currentlySaved = userProfile.savedContentIds?.includes(contentId);

    if (currentlySaved) {
      await updateDoc(userRef, {
        savedContentIds: arrayRemove(contentId),
        updatedAt: serverTimestamp(),
      });
      return false; // Now unsaved
    } else {
      await updateDoc(userRef, {
        savedContentIds: arrayUnion(contentId),
        updatedAt: serverTimestamp(),
      });
      return true; // Now saved
    }
  } catch (error) {
    console.error("Error toggling save content:", error);
    throw error;
  }
};
