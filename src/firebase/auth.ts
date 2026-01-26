import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';
import { User, UserRole } from '@/types';
import { detectAuthIssue, getAuthErrorMessage } from '@/utils/authUtils';

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

export const signInWithGoogle = async () => {
  try {
    console.log('Starting Google sign-in process...');
    const provider = new GoogleAuthProvider();
    
    // Add scopes for better user data
    provider.addScope('email');
    provider.addScope('profile');
    
    console.log('Calling signInWithPopup...');
    const userCredential = await signInWithPopup(auth, provider);
    console.log('Google sign-in successful:', userCredential.user.email);
    
    // Check if user exists in Firestore
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    
    if (!userDoc.exists()) {
      // Create new user document
      const userData: Omit<User, 'id'> = {
        uid: userCredential.user.uid,
        email: userCredential.user.email!,
        displayName: userCredential.user.displayName || 'User',
        photoURL: userCredential.user.photoURL,
        role: 'ADMIN', // Google sign-up users get ADMIN role to set up their shop
        isActive: true,
        createdAt: new Date(),
        lastLoginAt: new Date(),
      };
      
      await setDoc(doc(db, 'users', userCredential.user.uid), userData);
      console.log('Created new user document for:', userCredential.user.email);
    } else {
      // Update last login
      await updateDoc(doc(db, 'users', userCredential.user.uid), {
        lastLoginAt: new Date(),
      });
      console.log('Updated last login for existing user:', userCredential.user.email);
    }
    
    return { success: true, user: userCredential.user };
  } catch (error: any) {
    console.error('Google sign-in error:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    // Use utility to detect the actual issue
    const issueType = detectAuthIssue(error);
    console.log('Detected issue type:', issueType);
    
    // Handle specific Firebase auth errors with better detection
    if (error.code === 'auth/popup-closed-by-user') {
      console.warn('User manually closed the popup');
      return { 
        success: false, 
        error: 'Sign-in was cancelled. Please try again.' 
      };
    } else if (error.code === 'auth/popup-blocked') {
      console.warn('Popup was blocked by browser');
      return { 
        success: false, 
        error: 'Pop-up was blocked by your browser. Please allow pop-ups for this site and try again.' 
      };
    } else if (error.code === 'auth/cancelled-popup-request') {
      console.warn('Popup request was cancelled');
      return { 
        success: false, 
        error: 'Sign-in was cancelled. Please try again.' 
      };
    } else if (error.code === 'auth/network-request-failed') {
      console.warn('Network error during Google sign-in');
      return { 
        success: false, 
        error: 'Network error. Please check your internet connection and try again.' 
      };
    } else if (error.code === 'auth/too-many-requests') {
      console.warn('Too many requests to Google auth');
      return { 
        success: false, 
        error: 'Too many sign-in attempts. Please wait a moment and try again.' 
      };
    } else {
      // Use the utility function for better error messages
      const errorMessage = getAuthErrorMessage(issueType, error);
      console.warn('Google sign-in error (type: ' + issueType + '):', error);
      return { 
        success: false, 
        error: errorMessage 
      };
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
