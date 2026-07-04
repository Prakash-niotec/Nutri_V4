import { db } from './firebaseConfig';
import { collection, addDoc, getDocs, doc, getDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';

/**
 * Save a new food nutrition scan result to Firestore
 */
export const saveScanResult = async (userId, scanData) => {
  try {
    const docRef = await addDoc(collection(db, 'scans'), {
      ...scanData,
      userId,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error saving scan result:', error);
    throw error;
  }
};

/**
 * Fetch all scans for a specific user, ordered by creation date (newest first)
 */
export const getUserScans = async (userId) => {
  try {
    const q = query(
      collection(db, 'scans'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching user scans:', error);
    throw error;
  }
};

/**
 * Get a single scan result by ID
 */
export const getScanById = async (scanId) => {
  try {
    const docRef = doc(db, 'scans', scanId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error fetching scan by ID:', error);
    throw error;
  }
};

/**
 * Delete a scan result
 */
export const deleteScanResult = async (scanId) => {
  try {
    await deleteDoc(doc(db, 'scans', scanId));
    return true;
  } catch (error) {
    console.error('Error deleting scan result:', error);
    throw error;
  }
};