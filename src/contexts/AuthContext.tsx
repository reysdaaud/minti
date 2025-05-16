// src/contexts/AuthContext.tsx
'use client';

export { AuthProvider, useAuthContext as useAuth } from '@/lib/firebase';
export type { FirebaseUser, UserProfile } from '@/lib/firebase'; // Export UserProfile type
