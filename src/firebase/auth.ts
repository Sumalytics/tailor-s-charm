import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './config';
import { User, UserRole } from '@/types';

export const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Check if user document exists, create if not
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    if (!userDoc.exists()) {
      // Create user document for existing auth users
      const userData: Omit<User, 'id'> = {
        uid: userCredential.user.uid,
        email: userCredential.user.email!,
        displayName: userCredential.user.displayName || 'User',
        photoURL: userCredential.user.photoURL,
        role: 'STAFF', // Default role
        isActive: true,
        createdAt: new Date(),
        lastLoginAt: new Date(),
      };
      
      await setDoc(doc(db, 'users', userCredential.user.uid), userData);
    } else {
      // Update last login
      await updateDoc(doc(db, 'users', userCredential.user.uid), {
        lastLoginAt: new Date(),
      });
    }
    
    return { success: true, user: userCredential.user };
  } catch (error: any) {
    // Handle specific Firebase auth errors
    if (error.code === 'auth/user-not-found') {
      return { 
        success: false, 
        error: 'No account found with this email address.' 
      };
    } else if (error.code === 'auth/wrong-password') {
      return { 
        success: false, 
        error: 'Incorrect password. Please try again.' 
      };
    } else if (error.code === 'auth/invalid-email') {
      return { 
        success: false, 
        error: 'Invalid email address format.' 
      };
    } else if (error.code === 'auth/user-disabled') {
      return { 
        success: false, 
        error: 'This account has been disabled. Please contact support.' 
      };
    } else if (error.code === 'auth/too-many-requests') {
      return { 
        success: false, 
        error: 'Too many failed attempts. Please try again later.' 
      };
    } else {
      return { success: false, error: error.message || 'Failed to sign in.' };
    }
  }
};

export const signUp = async (email: string, password: string, displayName: string, role: UserRole = 'STAFF') => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update profile
    await updateProfile(userCredential.user, { displayName });
    
    // Create user document in Firestore
    const userData: Omit<User, 'id'> = {
      uid: userCredential.user.uid,
      email: userCredential.user.email!,
      displayName,
      photoURL: userCredential.user.photoURL,
      role,
      isActive: true,
      createdAt: new Date(),
      lastLoginAt: new Date(),
    };
    
    await setDoc(doc(db, 'users', userCredential.user.uid), userData);
    
    return { success: true, user: userCredential.user };
  } catch (error: any) {
    // Handle specific Firebase auth errors
    if (error.code === 'auth/email-already-in-use') {
      return { 
        success: false, 
        error: 'An account with this email already exists. Please sign in instead.' 
      };
    } else if (error.code === 'auth/invalid-email') {
      return { 
        success: false, 
        error: 'Invalid email address format.' 
      };
    } else if (error.code === 'auth/operation-not-allowed') {
      return { 
        success: false, 
        error: 'Email/password accounts are not enabled. Please contact support.' 
      };
    } else if (error.code === 'auth/weak-password') {
      return { 
        success: false, 
        error: 'Password is too weak. Please choose a stronger password.' 
      };
    } else if (error.code === 'auth/too-many-requests') {
      return { 
        success: false, 
        error: 'Too many attempts. Please try again later.' 
      };
    } else {
      return { success: false, error: error.message || 'Failed to create account.' };
    }
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error: any) {
    // Handle specific Firebase auth errors
    if (error.code === 'auth/user-not-found') {
      return { 
        success: false, 
        error: 'No account found with this email address.' 
      };
    } else if (error.code === 'auth/invalid-email') {
      return { 
        success: false, 
        error: 'Invalid email address format.' 
      };
    } else if (error.code === 'auth/too-many-requests') {
      return { 
        success: false, 
        error: 'Too many requests. Please try again later.' 
      };
    } else {
      return { success: false, error: error.message || 'Failed to send password reset email.' };
    }
  }
};

export const onAuthStateChangedListener = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export { auth };
