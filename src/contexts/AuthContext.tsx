// src/contexts/AuthContext.tsx
'use client';

// Re-export AuthProvider and useAuthContext (as useAuth) from firebase.tsx.
// Components should get auth functions (signInWithGoogle, signInWithFacebook, etc.)
// from the useAuth() hook's return value.
export { AuthProvider, useAuthContext as useAuth } from '@/lib/firebase';
export type { User as FirebaseUser } from 'firebase/auth'; // Export User type if needed elsewhere
