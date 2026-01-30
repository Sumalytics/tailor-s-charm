import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChangedListener } from '@/firebase/auth';
import { getDocument } from '@/firebase/firestore';
import { User } from '@/types';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface AuthContextType {
  currentUser: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  userRole: 'SUPER_ADMIN' | 'ADMIN' | 'STAFF' | null;
  shopId: string | null;
  refreshUser: () => Promise<void>;
  isOnline: boolean;
  isOffline: boolean;
  authError: Error | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'SUPER_ADMIN' | 'ADMIN' | 'STAFF' | null>(null);
  const [shopId, setShopId] = useState<string | null>(null);
  const [authError, setAuthError] = useState<Error | null>(null);
  const { isOnline, isOffline } = useNetworkStatus();

  const fetchUserWithRetry = useCallback(async (uid: string, maxRetries = 3): Promise<User | null> => {
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const userData = await getDocument<User>('users', uid);
        return userData;
      } catch (error) {
        lastError = error as Error;
        const isNetworkError = lastError.message?.toLowerCase().includes('network') ||
          lastError.message?.toLowerCase().includes('connection') ||
          lastError.message?.toLowerCase().includes('offline') ||
          lastError.message?.toLowerCase().includes('unavailable');
        if (attempt < maxRetries && isNetworkError) {
          const delay = attempt * 1500;
          console.warn(`AuthContext: Retry ${attempt}/${maxRetries} in ${delay}ms after network error`);
          await new Promise((r) => setTimeout(r, delay));
        } else {
          throw lastError;
        }
      }
    }
    throw lastError ?? new Error('Failed to fetch user');
  }, []);

  const refreshUser = async () => {
    if (firebaseUser) {
      try {
        const userData = await fetchUserWithRetry(firebaseUser.uid);
        setCurrentUser(userData);
        setUserRole(userData?.role || null);
        setShopId(userData?.shopId || null);
        setAuthError(null);
      } catch (error) {
        console.error('Error refreshing user data:', error);
        const err = error as Error;
        setAuthError(err);
        
        // Don't clear user data on network errors, just log the error
        if (err.message?.toLowerCase().includes('network') || 
            err.message?.toLowerCase().includes('connection') ||
            isOffline) {
          console.warn('Network error detected, keeping current user session');
          return;
        }
        
        // Clear user data on other types of errors
        setCurrentUser(null);
        setUserRole(null);
        setShopId(null);
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChangedListener(async (user) => {
      console.log('AuthContext - Auth state changed:', user);
      setFirebaseUser(user);
      
      if (user) {
        try {
          console.log('AuthContext - Fetching user data for:', user.uid);
          const userData = await fetchUserWithRetry(user.uid);
          console.log('AuthContext - User data fetched:', userData);
          setCurrentUser(userData);
          setUserRole(userData?.role ?? null);
          setShopId(userData?.shopId ?? null);
          setAuthError(null);
        } catch (error) {
          console.error('Error fetching user data:', error);
          const err = error as Error;
          setAuthError(err);
          if (err.message?.toLowerCase().includes('network') || err.message?.toLowerCase().includes('connection') || isOffline) {
            // Network error after retries: keep firebaseUser, allow manual retry via refreshUser
            setCurrentUser(null);
            setUserRole(null);
            setShopId(null);
            return;
          }
          setCurrentUser(null);
          setUserRole(null);
          setShopId(null);
        }
      } else {
        console.log('AuthContext - User logged out');
        setCurrentUser(null);
        setUserRole(null);
        setShopId(null);
        setAuthError(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, [isOffline, fetchUserWithRetry]);

  const value: AuthContextType = {
    currentUser,
    firebaseUser,
    loading,
    userRole,
    shopId,
    refreshUser,
    isOnline,
    isOffline,
    authError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
