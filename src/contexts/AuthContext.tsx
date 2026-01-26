import React, { createContext, useContext, useEffect, useState } from 'react';
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

  const refreshUser = async () => {
    if (firebaseUser) {
      try {
        const userData = await getDocument<User>('users', firebaseUser.uid);
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
          const userData = await getDocument<User>('users', user.uid);
          console.log('AuthContext - User data fetched:', userData);
          setCurrentUser(userData);
          setUserRole(userData?.role || null);
          setShopId(userData?.shopId || null);
          console.log('AuthContext - Set userRole:', userData?.role);
          console.log('AuthContext - Set shopId:', userData?.shopId);
          setAuthError(null);
        } catch (error) {
          console.error('Error fetching user data:', error);
          const err = error as Error;
          setAuthError(err);
          
          // Handle network errors gracefully
          if (err.message?.toLowerCase().includes('network') || 
              err.message?.toLowerCase().includes('connection') ||
              isOffline) {
            console.warn('Network error during user data fetch, user may be offline');
            // Don't clear auth state on network errors
            setCurrentUser(null);
            setUserRole(null);
            setShopId(null);
          } else {
            // Clear auth state on other errors
            setCurrentUser(null);
            setUserRole(null);
            setShopId(null);
          }
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
  }, [isOffline]);

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
