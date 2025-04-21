import { db } from './firebase/config';
import { collection, getDocs, query, where } from 'firebase/firestore';

// Function to test if the license_device_mapping collection exists and has data
const testDeviceData = async () => {
  try {
    console.log("Checking license_device_mapping collection...");
    
    // Get a reference to the collection
    const collectionRef = collection(db, 'license_device_mapping');
    
    // Get all documents without filtering
    const querySnapshot = await getDocs(collectionRef);
    
    console.log(`Found ${querySnapshot.size} documents in license_device_mapping collection`);
    
    if (querySnapshot.size > 0) {
      console.log("First document data sample:");
      const firstDoc = querySnapshot.docs[0];
      console.log({
        id: firstDoc.id,
        ...firstDoc.data()
      });
    }
  } catch (error) {
    console.error("Error checking device data:", error);
  }
};

// Call the test function
testDeviceData();

export { testDeviceData }; 