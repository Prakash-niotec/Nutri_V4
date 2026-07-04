import { db } from './firebaseConfig';
import { collection, addDoc, getDocs, doc, getDoc, query, where, orderBy } from 'firebase/firestore';

/**
 * Save a new health or product evaluation result to Firestore
 */
export const saveEvaluation = async (userId, evaluationData) => {
  try {
    const docRef = await addDoc(collection(db, 'evaluations'), {
      ...evaluationData,
      userId,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error saving evaluation:', error);
    throw error;
  }
};

/**
 * Fetch all evaluations for a specific user
 */
export const getUserEvaluations = async (userId) => {
  try {
    const q = query(
      collection(db, 'evaluations'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching user evaluations:', error);
    throw error;
  }
};

/**
 * Get a single evaluation by ID
 */
export const getEvaluationById = async (evalId) => {
  try {
    const docRef = doc(db, 'evaluations', evalId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error fetching evaluation by ID:', error);
    throw error;
  }
};