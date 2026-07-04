import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from './firebaseConfig';
import { saveUserProfile } from './userService';

/**
 * Register a new user with email, password, and name
 */
export const registerUser = async (email, password, fullName) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update display name in Firebase Auth
    if (fullName) {
      await updateProfile(user, { displayName: fullName });
    }

    // Create initial user profile document in Firestore
    await saveUserProfile(user.uid, {
      email: user.email,
      fullName: fullName || '',
      createdAt: new Date().toISOString(),
      onboardingCompleted: false
    });

    return user;
  } catch (error) {
    console.error('Error in registerUser:', error);
    throw error;
  }
};

/**
 * Login existing user with email and password
 */
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Error in loginUser:', error);
    throw error;
  }
};

/**
 * Logout current user
 */
export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error in logoutUser:', error);
    throw error;
  }
};

/**
 * Send password reset email
 */
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Error in resetPassword:', error);
    throw error;
  }
};

/**
 * Subscribe to authentication state changes
 */
export const subscribeToAuthChanges = (callback) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * Get currently logged-in user
 */
export const getCurrentUser = () => {
  return auth.currentUser;
};