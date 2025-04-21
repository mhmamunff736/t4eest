import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where,
  getDoc,
  setDoc,
  Timestamp,
  increment
} from 'firebase/firestore';
import { db } from './config';
import { UserProfile } from '../types';

const COLLECTION_NAME = 'user_profiles';

// Get user profile
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        username: data.username,
        email: data.email,
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        role: data.role,
        avatarUrl: data.avatarUrl || '',
        createdAt: data.createdAt ? new Date(data.createdAt.toDate()).toISOString() : new Date().toISOString(),
        lastLogin: data.lastLogin ? new Date(data.lastLogin.toDate()).toISOString() : new Date().toISOString(),
        preferences: data.preferences || {}
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

// Create or update user profile
export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      // Update existing profile
      await updateDoc(docRef, {
        ...updates,
        lastUpdated: Timestamp.now()
      });
    } else {
      // Create new profile
      await setDoc(docRef, {
        username: updates.username || '',
        email: updates.email || '',
        firstName: updates.firstName || '',
        lastName: updates.lastName || '',
        role: updates.role || 'user',
        avatarUrl: updates.avatarUrl || '',
        createdAt: Timestamp.now(),
        lastLogin: Timestamp.now(),
        preferences: updates.preferences || {},
        lastUpdated: Timestamp.now()
      });
    }
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Get license device count
export const getLicenseDeviceCount = async (licenseId: string): Promise<number> => {
  try {
    const licenseRef = doc(db, 'license_devices_count', licenseId);
    const docSnap = await getDoc(licenseRef);
    
    if (docSnap.exists()) {
      return docSnap.data().count || 0;
    }
    
    return 0;
  } catch (error) {
    console.error('Error getting license device count:', error);
    throw error;
  }
};

// Set license device limit
export const setLicenseDeviceLimit = async (licenseId: string, limit: number): Promise<void> => {
  try {
    const licenseRef = doc(db, 'license_devices_count', licenseId);
    await setDoc(licenseRef, { 
      licenseId,
      limit,
      count: 0,
      lastUpdated: Timestamp.now()
    }, { merge: true });
  } catch (error) {
    console.error('Error setting license device limit:', error);
    throw error;
  }
};

// Get license device limit
export const getLicenseDeviceLimit = async (licenseId: string): Promise<number> => {
  try {
    const licenseRef = doc(db, 'license_devices_count', licenseId);
    const docSnap = await getDoc(licenseRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      const limit = data.limit;
      // Check if it's an unlimited license (limit = -1)
      return limit !== undefined ? limit : 1; // Default to 1 if not set
    }
    
    // If no document exists, create it with default limit of 1
    await setDoc(licenseRef, { 
      licenseId,
      limit: 1,
      count: 0,
      lastUpdated: Timestamp.now()
    });
    
    return 1;
  } catch (error) {
    console.error('Error getting license device limit:', error);
    throw error;
  }
};

// Increment device count
export const incrementDeviceCount = async (licenseId: string): Promise<boolean> => {
  try {
    const licenseRef = doc(db, 'license_devices_count', licenseId);
    const docSnap = await getDoc(licenseRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      const currentCount = data.count || 0;
      const limit = data.limit || 1;
      
      // If limit is -1, it's unlimited
      const isUnlimited = limit === -1;
      
      // Check if adding another device would exceed the limit (only if not unlimited)
      if (!isUnlimited && currentCount >= limit) {
        return false; // Limit reached
      }
      
      // Increment count
      await updateDoc(licenseRef, {
        count: increment(1),
        lastUpdated: Timestamp.now()
      });
      
      return true; // Successfully incremented
    } else {
      // Create new document with count 1 and default limit 1
      await setDoc(licenseRef, {
        licenseId,
        count: 1,
        limit: 1,
        lastUpdated: Timestamp.now()
      });
      
      return true;
    }
  } catch (error) {
    console.error('Error incrementing device count:', error);
    throw error;
  }
};

// Decrement device count
export const decrementDeviceCount = async (licenseId: string): Promise<void> => {
  try {
    const licenseRef = doc(db, 'license_devices_count', licenseId);
    const docSnap = await getDoc(licenseRef);
    
    if (docSnap.exists()) {
      const currentCount = docSnap.data().count || 0;
      
      if (currentCount > 0) {
        await updateDoc(licenseRef, {
          count: increment(-1),
          lastUpdated: Timestamp.now()
        });
      }
    }
  } catch (error) {
    console.error('Error decrementing device count:', error);
    throw error;
  }
};

// Reset device count
export const resetDeviceCount = async (licenseId: string): Promise<void> => {
  try {
    const licenseRef = doc(db, 'license_devices_count', licenseId);
    const docSnap = await getDoc(licenseRef);
    
    if (docSnap.exists()) {
      await updateDoc(licenseRef, {
        count: 0,
        lastUpdated: Timestamp.now()
      });
    } else {
      await setDoc(licenseRef, {
        licenseId,
        count: 0,
        limit: 1,
        lastUpdated: Timestamp.now()
      });
    }
  } catch (error) {
    console.error('Error resetting device count:', error);
    throw error;
  }
}; 