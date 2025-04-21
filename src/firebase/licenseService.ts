import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where,
  orderBy,
  DocumentData,
  Timestamp,
  getDoc,
  limit,
  startAfter,
  setDoc
} from 'firebase/firestore';
import { db } from './config';
import { License } from '../types';

const COLLECTION_NAME = 'licenses';
const licensesCollection = collection(db, COLLECTION_NAME);

// Add a new license
export const addLicense = async (license: License): Promise<string> => {
  try {
    const docRef = await addDoc(licensesCollection, {
      licenseId: license.licenseId,
      expiryDate: license.expiryDate,
      createdAt: Timestamp.now(),
      notes: license.notes || '',
      status: calculateStatus(license.expiryDate),
      lastUpdated: Timestamp.now()
    });
    
    // Add to activity log
    await addActivityLog({
      action: 'create',
      licenseId: license.licenseId,
      timestamp: new Date().toISOString(),
      details: `License created with expiry date: ${license.expiryDate}`
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding license:', error);
    throw error;
  }
};

// Get all licenses
export const getLicenses = async (): Promise<License[]> => {
  try {
    const q = query(licensesCollection, orderBy('licenseId'));
    const querySnapshot = await getDocs(q);
    const licenses: License[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const license: License = {
        id: doc.id,
        licenseId: data.licenseId,
        expiryDate: data.expiryDate,
        status: calculateStatus(data.expiryDate),
        notes: data.notes || '',
        createdAt: data.createdAt ? new Date(data.createdAt.toDate()).toISOString() : new Date().toISOString(),
        lastUpdated: data.lastUpdated ? new Date(data.lastUpdated.toDate()).toISOString() : new Date().toISOString()
      };
      licenses.push(license);
    });
    
    return licenses;
  } catch (error) {
    console.error('Error getting licenses:', error);
    throw error;
  }
};

// Get licenses with pagination
export const getPaginatedLicenses = async (lastVisible: any = null, pageSize: number = 10): Promise<{licenses: License[], lastVisible: any}> => {
  try {
    let q;
    
    if (lastVisible) {
      q = query(
        licensesCollection, 
        orderBy('licenseId'),
        startAfter(lastVisible),
        limit(pageSize)
      );
    } else {
      q = query(
        licensesCollection, 
        orderBy('licenseId'),
        limit(pageSize)
      );
    }
    
    const querySnapshot = await getDocs(q);
    const licenses: License[] = [];
    let newLastVisible = null;
    
    if (!querySnapshot.empty) {
      newLastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const license: License = {
          id: doc.id,
          licenseId: data.licenseId,
          expiryDate: data.expiryDate,
          status: calculateStatus(data.expiryDate),
          notes: data.notes || '',
          createdAt: data.createdAt ? new Date(data.createdAt.toDate()).toISOString() : new Date().toISOString(),
          lastUpdated: data.lastUpdated ? new Date(data.lastUpdated.toDate()).toISOString() : new Date().toISOString()
        };
        licenses.push(license);
      });
    }
    
    return { 
      licenses,
      lastVisible: newLastVisible
    };
  } catch (error) {
    console.error('Error getting paginated licenses:', error);
    throw error;
  }
};

// Update a license
export const updateLicense = async (id: string, license: License): Promise<void> => {
  try {
    const licenseRef = doc(db, COLLECTION_NAME, id);
    
    // Get current license data for activity log
    const currentDoc = await getDoc(licenseRef);
    const currentData = currentDoc.data();
    
    await updateDoc(licenseRef, {
      licenseId: license.licenseId,
      expiryDate: license.expiryDate,
      notes: license.notes || '',
      status: calculateStatus(license.expiryDate),
      lastUpdated: Timestamp.now()
    });
    
    // Add to activity log
    await addActivityLog({
      action: 'update',
      licenseId: license.licenseId,
      timestamp: new Date().toISOString(),
      details: `License updated: Expiry date changed from ${currentData?.expiryDate} to ${license.expiryDate}`
    });
  } catch (error) {
    console.error('Error updating license:', error);
    throw error;
  }
};

// Delete a license
export const deleteLicense = async (id: string): Promise<void> => {
  try {
    const licenseRef = doc(db, COLLECTION_NAME, id);
    
    // Get license data for activity log
    const docSnap = await getDoc(licenseRef);
    const licenseData = docSnap.data();
    
    await deleteDoc(licenseRef);
    
    // Add to activity log
    if (licenseData) {
      await addActivityLog({
        action: 'delete',
        licenseId: licenseData.licenseId,
        timestamp: new Date().toISOString(),
        details: `License deleted with expiry date: ${licenseData.expiryDate}`
      });
    }
  } catch (error) {
    console.error('Error deleting license:', error);
    throw error;
  }
};

// Search licenses by licenseId or status
export const searchLicenses = async (field: string, value: string): Promise<License[]> => {
  try {
    let q;
    
    if (field === 'licenseId') {
      q = query(
        licensesCollection,
        where('licenseId', '>=', value),
        where('licenseId', '<=', value + '\uf8ff')
      );
    } else {
      // For status, we need to calculate it dynamically
      // So we fetch all and filter in-memory
      q = query(licensesCollection);
    }
    
    const querySnapshot = await getDocs(q);
    const licenses: License[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const status = calculateStatus(data.expiryDate);
      
      // If searching by status, filter out non-matching
      if (field === 'status' && status.toLowerCase() !== value.toLowerCase()) {
        return;
      }
      
      const license: License = {
        id: doc.id,
        licenseId: data.licenseId,
        expiryDate: data.expiryDate,
        status,
        notes: data.notes || '',
        createdAt: data.createdAt ? new Date(data.createdAt.toDate()).toISOString() : new Date().toISOString(),
        lastUpdated: data.lastUpdated ? new Date(data.lastUpdated.toDate()).toISOString() : new Date().toISOString()
      };
      licenses.push(license);
    });
    
    return licenses;
  } catch (error) {
    console.error('Error searching licenses:', error);
    throw error;
  }
};

// Activity log functions
export const addActivityLog = async (activity: { 
  action: string; 
  licenseId: string; 
  timestamp: string;
  details: string;
}): Promise<void> => {
  try {
    const activityCollection = collection(db, 'activity_logs');
    await addDoc(activityCollection, {
      ...activity,
      timestamp: Timestamp.fromDate(new Date(activity.timestamp))
    });
  } catch (error) {
    console.error('Error adding activity log:', error);
    // Don't throw here to prevent breaking the main operation
  }
};

export const getActivityLogs = async (limitCount: number = 100): Promise<any[]> => {
  try {
    const activityCollection = collection(db, 'activity_logs');
    const q = query(activityCollection, orderBy('timestamp', 'desc'), limit(limitCount));
    const querySnapshot = await getDocs(q);
    
    const logs: any[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      logs.push({
        id: doc.id,
        ...data,
        timestamp: data.timestamp ? new Date(data.timestamp.toDate()).toISOString() : new Date().toISOString()
      });
    });
    
    return logs;
  } catch (error) {
    console.error('Error getting activity logs:', error);
    return [];
  }
};

// Backup and restore functions
export const exportLicenses = async (): Promise<string> => {
  try {
    const licenses = await getLicenses();
    return JSON.stringify(licenses, null, 2);
  } catch (error) {
    console.error('Error exporting licenses:', error);
    throw error;
  }
};

export const importLicenses = async (licensesJson: string): Promise<number> => {
  try {
    const licenses = JSON.parse(licensesJson) as License[];
    let importedCount = 0;
    
    for (const license of licenses) {
      // Check if the license already exists
      const existingLicenses = await searchLicenses('licenseId', license.licenseId);
      
      if (existingLicenses.length === 0) {
        await addLicense(license);
        importedCount++;
      }
    }
    
    return importedCount;
  } catch (error) {
    console.error('Error importing licenses:', error);
    throw error;
  }
};

// Analytics functions
export const getLicenseAnalytics = async (): Promise<any> => {
  try {
    const licenses = await getLicenses();
    
    // Calculate expiration metrics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    
    const ninetyDaysFromNow = new Date(today);
    ninetyDaysFromNow.setDate(today.getDate() + 90);
    
    const totalCount = licenses.length;
    const activeCount = licenses.filter(license => license.status === 'Active').length;
    const expiredCount = licenses.filter(license => license.status === 'Expired').length;
    
    const expiringIn30Days = licenses.filter(license => {
      if (license.status === 'Expired') return false;
      const expiryDate = new Date(license.expiryDate);
      return expiryDate <= thirtyDaysFromNow && expiryDate >= today;
    }).length;
    
    const expiringIn90Days = licenses.filter(license => {
      if (license.status === 'Expired') return false;
      const expiryDate = new Date(license.expiryDate);
      return expiryDate <= ninetyDaysFromNow && expiryDate >= thirtyDaysFromNow;
    }).length;
    
    // Group by month of expiry for the next 12 months
    const expiryByMonth: Record<string, number> = {};
    const nextYear = new Date(today);
    nextYear.setFullYear(today.getFullYear() + 1);
    
    licenses.forEach(license => {
      const expiryDate = new Date(license.expiryDate);
      if (expiryDate >= today && expiryDate <= nextYear) {
        const monthKey = `${expiryDate.getFullYear()}-${(expiryDate.getMonth() + 1).toString().padStart(2, '0')}`;
        expiryByMonth[monthKey] = (expiryByMonth[monthKey] || 0) + 1;
      }
    });
    
    return {
      totalCount,
      activeCount,
      expiredCount,
      expiringIn30Days,
      expiringIn90Days,
      expiryByMonth,
      activePercentage: totalCount > 0 ? (activeCount / totalCount) * 100 : 0,
      expiredPercentage: totalCount > 0 ? (expiredCount / totalCount) * 100 : 0,
    };
  } catch (error) {
    console.error('Error getting license analytics:', error);
    throw error;
  }
};

// Helper function to calculate status
export const calculateStatus = (expiryDate: string): string => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  
  return expiry < today ? 'Expired' : 'Active';
}; 