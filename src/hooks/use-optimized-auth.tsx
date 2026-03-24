'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useMemo,
  useCallback,
  useRef,
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
import { checkEmailAccess, bootstrapAuthenticatedUser, bootstrapAuthenticatedUserWithToken } from '@/lib/services/permissions-client';
import { logger } from '@/lib/utils/logger';
import { clearAtsSession } from '@/lib/state/ats-session-store';

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
  const router = useRouter();
  const hasNavigatedRef = useRef(false);

  const ensureAuthorizedAccess = useCallback(async (email: string | null | undefined) => {
    if (!email) {
      throw new Error('Email address is required.');
    }

    const response = await checkEmailAccess(email);
    if (!response.access || !response.access.access_enabled) {
      throw new Error('This email has not been approved by the admin yet.');
    }

    return response.access;
  }, []);

  const bootstrapSession = useCallback(async (authUser?: User | null) => {
    const token = authUser ? await authUser.getIdToken(true) : null;
    const response = token
      ? await bootstrapAuthenticatedUserWithToken(token)
      : await bootstrapAuthenticatedUser();
    if (!response.access?.access_enabled) {
      throw new Error('This account is not enabled.');
    }
    return response.access;
  }, []);

  // Memoize auth functions to prevent unnecessary re-renders
  const signInWithGoogle = useCallback(async () => {
    if (!auth) {
      logger.error('Firebase auth is not initialized.');
      throw new Error("Firebase auth is not initialized.");
    }
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await ensureAuthorizedAccess(result.user.email);
      await bootstrapSession(result.user);
    } catch (error) {
      logger.error('Error signing in with Google', error);
      await auth.signOut().catch(() => undefined);
      setLoading(false);
      throw error;
    }
  }, [bootstrapSession, ensureAuthorizedAccess]);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    if (!auth) throw new Error("Firebase auth is not initialized.");
    setLoading(true);
    try {
      await ensureAuthorizedAccess(email);
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await bootstrapSession(credential.user);
    } catch (error) {
      logger.error('Error signing up with email', error);
      await auth.signOut().catch(() => undefined);
      setLoading(false);
      throw error;
    }
  }, [bootstrapSession, ensureAuthorizedAccess]);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    if (!auth) throw new Error("Firebase auth is not initialized.");
    setLoading(true);
    try {
      await ensureAuthorizedAccess(email);
      const credential = await signInWithEmailAndPassword(auth, email, password);
      await bootstrapSession(credential.user);
    } catch (error) {
      logger.error('Error signing in with email', error);
      await auth.signOut().catch(() => undefined);
      setLoading(false);
      throw error;
    }
  }, [bootstrapSession, ensureAuthorizedAccess]);

  const signOut = useCallback(async () => {
    if (!auth) {
      logger.error('Firebase auth is not initialized.');
      return;
    }
    try {
      clearAtsSession();
      await auth.signOut();
      hasNavigatedRef.current = false;
      router.push('/');
    } catch (error) {
      logger.error('Error signing out', error);
    }
  }, [router]);

  // Optimized auth state listener with proper cleanup
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    let mounted = true;
    let unsubscribe: (() => void) | undefined;
    let loadingTimeout: NodeJS.Timeout | undefined;

    // Fallback timeout to prevent infinite loading
    loadingTimeout = setTimeout(() => {
      if (mounted) {
        logger.warn('Auth loading timeout - forcing loading to false');
        setLoading(false);
      }
    }, 5000); // 5 second timeout

    try {
      unsubscribe = onAuthStateChanged(auth, (user) => {
        void (async () => {
          if (!mounted) return;

          try {
            if (user) {
              await bootstrapSession(user);
            }

            logger.info(`Auth state changed: ${user ? 'User logged in' : 'User logged out'}`);
            if (!user) {
              clearAtsSession();
            }
            setUser(user);
            setLoading(false);
            hasNavigatedRef.current = false;

            if (loadingTimeout) {
              clearTimeout(loadingTimeout);
            }

            if (user) {
              setTimeout(() => {
                if (mounted && !hasNavigatedRef.current) {
                  const currentPath = window.location.pathname;
                  if (currentPath === '/' || currentPath === '/login' || currentPath === '/signup') {
                    logger.info(`Auth hook navigating to dashboard from: ${currentPath}`);
                    hasNavigatedRef.current = true;
                    router.push('/dashboard');
                  }
                }
              }, 100);
            }
          } catch (error) {
            logger.error('Error validating authenticated session', error);
            await auth?.signOut().catch(() => undefined);
            setUser(null);
            setLoading(false);
          }
        })();
      });
    } catch (error) {
      logger.error('Error setting up auth listener', error);
      if (mounted) {
        setLoading(false);
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
  }, [bootstrapSession, router]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    user,
    loading,
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
