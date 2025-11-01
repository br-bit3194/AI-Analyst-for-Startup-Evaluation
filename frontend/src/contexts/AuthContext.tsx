'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  GoogleAuthProvider 
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    // Prevent multiple concurrent sign-in attempts
    if ((window as any).googleSignInInProgress) {
      return;
    }
    
    try {
      (window as any).googleSignInInProgress = true;
      
      // Clear any existing auth state to prevent conflicts
      await firebaseSignOut(auth);
      
      // Add a small delay to ensure clean state
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Perform the sign in
      const result = await signInWithPopup(auth, googleProvider);
      
      // Ensure the user is set in the state before redirecting
      setUser(result.user);
      
      // Redirect to dashboard after successful sign-in
      window.location.href = '/dashboard/deal-analysis';
      
    } catch (error: any) {
      // Ignore "cancelled-popup-request" errors as they're usually not critical
      if (error.code !== 'auth/cancelled-popup-request') {
        console.error('Error signing in with Google:', error);
        // Re-throw other errors for the UI to handle
        throw error;
      }
    } finally {
      (window as any).googleSignInInProgress = false;
    }
  };
  
  // Function to handle redirection after sign-in
  const redirectAfterSignIn = (user: User | null) => {
    if (user) {
      // Use window.location.href for a full page reload to ensure auth state is properly set
      window.location.href = '/dashboard/deal-analysis';
    }
  };
  
  // Update the auth state change handler to handle redirects
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      
      // If user just signed in and we're on the home page, redirect to dashboard
      if (user && window.location.pathname === '/') {
        redirectAfterSignIn(user);
      }
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      // Smooth client-side navigation to landing page
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signInWithGoogle,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
