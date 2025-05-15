
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
  where,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface ContentItem {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  dataAiHint: string;
  category?: string;
  contentType: 'audio' | 'article'; // Added content type
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

// Helper function to create a Firestore-safe data object by omitting undefined fields
const prepareDataForFirestore = <T extends Record<string, any>>(data: T): Partial<T> => {
  const firestoreData: Partial<T> = {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key) && data[key] !== undefined) {
      // Retain empty strings as they are valid, only omit undefined for non-string fields if desired
      // For this use case, empty strings for optional text fields are fine.
      if (data[key] === '' && (key === 'audioSrc' || key === 'excerpt' || key === 'fullBodyContent' || key === 'subtitle' || key === 'category')) {
        // Do not save empty strings for these specific optional fields, treat as not provided
        // This helps in querying for existence (e.g., field > '')
        continue;
      }
      firestoreData[key as keyof T] = data[key];
    }
  }
  return firestoreData;
};


// Fetch all content items (generic fetch, filtering should happen in components)
export const getContentItems = async (queryConstraints: QueryConstraint[] = []): Promise<ContentItem[]> => {
  try {
    const contentCollectionRef = collection(db, CONTENT_COLLECTION);
    // Add default ordering if not already present in constraints
    const hasOrderBy = queryConstraints.some(c => c.type === 'orderBy');
    const finalConstraints = hasOrderBy ? queryConstraints : [...queryConstraints, orderBy('createdAt', 'desc')];
    
    const q = query(contentCollectionRef, ...finalConstraints);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as ContentItem));
  } catch (error) {
    console.error('Error fetching content items:', error);
    throw error;
  }
};

// Add a new content item
export const addContentItem = async (itemData: ContentItemData): Promise<string> => {
  try {
    const preparedData = prepareDataForFirestore(itemData);
    const dataToSave = {
      ...preparedData,
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
    const preparedData = prepareDataForFirestore(itemData);
    const dataToUpdate: Record<string, any> = {
      ...preparedData,
      updatedAt: Timestamp.now(),
    };
    
    if ('createdAt' in dataToUpdate) {
        delete dataToUpdate.createdAt;
    }

    const itemDocRef = doc(db, CONTENT_COLLECTION, itemId);
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
