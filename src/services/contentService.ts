
// src/services/contentService.ts
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface ContentItem {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  dataAiHint: string;
  category?: string; // Kept for general filtering
  createdAt?: Timestamp;
  updatedAt?: Timestamp;

  // Optional fields for different content types
  audioSrc?: string;
  excerpt?: string;
  fullBodyContent?: string;
}

// For creating new items, id, createdAt, and updatedAt are handled by Firestore/service
export interface ContentItemData extends Omit<ContentItem, 'id' | 'createdAt' | 'updatedAt'> {
}


const CONTENT_COLLECTION = 'content';

// Fetch all content items
export const getContentItems = async (): Promise<ContentItem[]> => {
  try {
    const contentCollectionRef = collection(db, CONTENT_COLLECTION);
    const q = query(contentCollectionRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as ContentItem));
  } catch (error) {
    console.error('Error fetching content items:', error);
    throw error; // Re-throw to be handled by the caller
  }
};

// Add a new content item
export const addContentItem = async (itemData: ContentItemData): Promise<string> => {
  try {
    // Ensure optional fields that are empty strings are stored as null or undefined if preferred,
    // or ensure Firestore rules/queries handle empty strings appropriately.
    // For simplicity, we'll pass them as they are; Firestore stores empty strings.
    const dataToSave = {
      ...itemData,
      audioSrc: itemData.audioSrc || undefined,
      excerpt: itemData.excerpt || undefined,
      fullBodyContent: itemData.fullBodyContent || undefined,
      subtitle: itemData.subtitle || undefined,
      category: itemData.category || undefined,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, CONTENT_COLLECTION), dataToSave);
    return docRef.id;
  } catch (error) {
    console.error('Error adding content item:', error);
    throw error;
  }
};

// Update an existing content item
export const updateContentItem = async (itemId: string, itemData: Partial<ContentItemData>): Promise<void> => {
  try {
    const itemDocRef = doc(db, CONTENT_COLLECTION, itemId);
    // Ensure optional fields that are empty strings are handled (e.g., converted to null or field removed)
    // For update, partial data is fine. If an empty string means "remove field", handle that here.
    // Otherwise, Firestore will update with empty strings.
    const dataToUpdate = {
        ...itemData,
        audioSrc: itemData.audioSrc || undefined,
        excerpt: itemData.excerpt || undefined,
        fullBodyContent: itemData.fullBodyContent || undefined,
        subtitle: itemData.subtitle || undefined,
        category: itemData.category || undefined,
        updatedAt: Timestamp.now(),
    };
    await updateDoc(itemDocRef, dataToUpdate);
  } catch (error) {
    console.error('Error updating content item:', error);
    throw error;
  }
};

// Delete a content item
export const deleteContentItem = async (itemId: string): Promise<void> => {
  try {
    const itemDocRef = doc(db, CONTENT_COLLECTION, itemId);
    await deleteDoc(itemDocRef);
  } catch (error) {
    console.error('Error deleting content item:', error);
    throw error;
  }
};
