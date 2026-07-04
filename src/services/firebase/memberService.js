import { db } from './firebaseConfig';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';

/**
 * Add a family member for a user
 */
export const addFamilyMember = async (userId, memberData) => {
  try {
    const docRef = await addDoc(collection(db, 'members'), {
      ...memberData,
      userId,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding family member:', error);
    throw error;
  }
};

/**
 * Get all family members belonging to a user
 */
export const getFamilyMembers = async (userId) => {
  try {
    const q = query(collection(db, 'members'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching family members:', error);
    throw error;
  }
};

/**
 * Update a family member profile
 */
export const updateFamilyMember = async (memberId, updates) => {
  try {
    const docRef = doc(db, 'members', memberId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error('Error updating family member:', error);
    throw error;
  }
};

/**
 * Delete a family member
 */
export const deleteFamilyMember = async (memberId) => {
  try {
    await deleteDoc(doc(db, 'members', memberId));
    return true;
  } catch (error) {
    console.error('Error deleting family member:', error);
    throw error;
  }
};