
// src/lib/contentAccess.ts
import { doc, updateDoc, getDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import type { UserProfile } from './firebase'; // Assuming UserProfile is exported from firebase.tsx

const FREE_CONTENT_LIMIT = 10;
const CONTENT_COST = 10; // Coins

interface ContentAccessResult {
  granted: boolean;
  message?: string;
  title?: string;
  coinsDeducted?: number;
  freeAccessGranted?: boolean;
}

export const checkAndGrantContentAccess = async (
  contentId: string,
  userId: string,
  userProfile: UserProfile | null
): Promise<ContentAccessResult> => {
  if (!userProfile) {
    return { granted: false, title: "Error", message: "User profile not found." };
  }

  const userRef = doc(db, 'users', userId);

  // 1. Check if content has already been consumed
  if (userProfile.consumedContentIds?.includes(contentId)) {
    return { granted: true, title: "Access Granted", message: "Previously accessed content." };
  }

  // 2. Check if user is still within free content limit
  const freeConsumedCount = userProfile.freeContentConsumedCount || 0;
  if (freeConsumedCount < FREE_CONTENT_LIMIT) {
    try {
      await updateDoc(userRef, {
        freeContentConsumedCount: freeConsumedCount + 1,
        consumedContentIds: arrayUnion(contentId),
        updatedAt: serverTimestamp(),
      });
      return {
        granted: true,
        title: "Free Access Granted",
        message: `Enjoy this free content! You have ${FREE_CONTENT_LIMIT - (freeConsumedCount + 1)} free items remaining.`,
        freeAccessGranted: true,
      };
    } catch (error) {
      console.error("Error updating free content access:", error);
      return { granted: false, title: "Error", message: "Could not update free access. Please try again." };
    }
  }

  // 3. Free tier exhausted, check wallet balance
  const currentCoins = userProfile.coins || 0;
  if (currentCoins >= CONTENT_COST) {
    try {
      await updateDoc(userRef, {
        coins: currentCoins - CONTENT_COST,
        consumedContentIds: arrayUnion(contentId),
        updatedAt: serverTimestamp(),
      });
      return {
        granted: true,
        title: "Content Unlocked",
        message: `${CONTENT_COST} coins deducted. Enjoy!`,
        coinsDeducted: CONTENT_COST,
      };
    } catch (error) {
      console.error("Error deducting coins for content access:", error);
      return { granted: false, title: "Error", message: "Could not process payment. Please try again." };
    }
  }

  // 4. Insufficient balance
  return {
    granted: false,
    title: "Insufficient Balance",
    message: `You need ${CONTENT_COST} coins to access this content. Your current balance is ${currentCoins} coins. Please top up.`,
  };
};
