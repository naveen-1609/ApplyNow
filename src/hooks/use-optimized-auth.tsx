'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useMemo,
  useCallback,
} from 'react';
import {
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  User,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Optimized auth provider with better performance and error handling
export function OptimizedAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  
  // Safely get router only in client-side
  const router = typeof window !== 'undefined' ? useRouter() : null;

  // Memoize auth functions to prevent unnecessary re-renders
  const signInWithGoogle = useCallback(async () => {
    if (!auth) {
      console.error("Firebase auth is not initialized.");
      throw new Error("Firebase auth is not initialized.");
    }
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // Don't set loading to false here - let the auth state change handle it
      // Navigation is handled in the auth state listener
    } catch (error) {
      console.error('Error signing in with Google', error);
      setLoading(false);
      throw error;
    }
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    if (!auth) throw new Error("Firebase auth is not initialized.");
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      // Don't set loading to false here - let the auth state change handle it
      // Navigation is handled in the auth state listener
    } catch (error) {
      console.error('Error signing up with email', error);
      setLoading(false);
      throw error;
    }
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    if (!auth) throw new Error("Firebase auth is not initialized.");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Don't set loading to false here - let the auth state change handle it
      // Navigation is handled in the auth state listener
    } catch (error) {
      console.error('Error signing in with email', error);
      setLoading(false);
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!auth) {
      console.error("Firebase auth is not initialized.");
      return;
    }
    try {
      await auth.signOut();
      if (router) {
        router.push('/');
      }
    } catch (error) {
      console.error('Error signing out', error);
    }
  }, [router]);

  // Optimized auth state listener with proper cleanup
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      setInitialized(true);
      return;
    }

    let mounted = true;
    let unsubscribe: (() => void) | undefined;
    let loadingTimeout: NodeJS.Timeout | undefined;

    // Fallback timeout to prevent infinite loading
    loadingTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('Auth loading timeout - forcing loading to false');
        setLoading(false);
        setInitialized(true);
      }
    }, 5000); // 5 second timeout

    try {
      unsubscribe = onAuthStateChanged(auth, (user) => {
        if (mounted) {
          console.log('Auth state changed:', user ? 'User logged in' : 'User logged out');
          setUser(user);
          setLoading(false);
          setInitialized(true);
          
          // Clear the timeout since auth state changed
          if (loadingTimeout) {
            clearTimeout(loadingTimeout);
          }
          
          // Small delay to ensure auth state is fully propagated
          if (user && router) {
            setTimeout(() => {
              if (mounted) {
                const currentPath = window.location.pathname;
                // Only navigate if we're on the login page or root
                if (currentPath === '/' || currentPath === '/login') {
                  console.log('Auth hook - Navigating to dashboard from:', currentPath);
                  router.push('/dashboard');
                } else {
                  console.log('Auth hook - Already on protected route:', currentPath);
                }
              }
            }, 100);
          }
        }
      });
    } catch (error) {
      console.error('Error setting up auth listener:', error);
      if (mounted) {
        setLoading(false);
        setInitialized(true);
        if (loadingTimeout) {
          clearTimeout(loadingTimeout);
        }
      }
    }

    return () => {
      mounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
    };
  }, [router, loading]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    user,
    loading: loading, // Remove the !initialized check to prevent extended loading
    signInWithGoogle,
    signUpWithEmail,
    signInWithEmail,
    signOut,
  }), [user, loading, signInWithGoogle, signUpWithEmail, signInWithEmail, signOut]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an OptimizedAuthProvider');
  }
  return context;
}