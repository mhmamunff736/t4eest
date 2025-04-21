const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Verify license endpoint
exports.verifyLicense = functions.https.onRequest(async (req, res) => {
  try {
    // Enable CORS
    res.set('Access-Control-Allow-Origin', '*');
    
    if (req.method === 'OPTIONS') {
      // Handle preflight request
      res.set('Access-Control-Allow-Methods', 'POST');
      res.set('Access-Control-Allow-Headers', 'Content-Type');
      res.status(204).send('');
      return;
    }
    
    // Check if it's a POST request
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    // Extract license key from the request
    const { licenseKey } = req.body;
    
    if (!licenseKey) {
      return res.status(400).json({ 
        valid: false, 
        message: 'Missing license key' 
      });
    }
    
    // Query Firestore to find the license
    const db = admin.firestore();
    const licensesRef = db.collection('licenses');
    const snapshot = await licensesRef.where('licenseId', '==', licenseKey).get();
    
    if (snapshot.empty) {
      return res.status(200).json({ 
        valid: false, 
        message: 'Invalid license key' 
      });
    }
    
    // Get the license document
    const licenseDoc = snapshot.docs[0];
    const licenseData = licenseDoc.data();
    
    // Check if license is expired
    const expiryDate = new Date(licenseData.expiryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (expiryDate < today) {
      return res.status(200).json({ 
        valid: false, 
        message: 'License expired',
        expiryDate: licenseData.expiryDate
      });
    }
    
    // Check device count against limit
    const deviceCountRef = db.collection('license_devices_count').doc(licenseKey);
    const deviceCountDoc = await deviceCountRef.get();
    
    let currentCount = 0;
    let deviceLimit = 1; // Default limit
    
    if (deviceCountDoc.exists) {
      const deviceData = deviceCountDoc.data();
      currentCount = deviceData.count || 0;
      deviceLimit = deviceData.limit || 1;
    } else {
      // Create the count document if it doesn't exist
      await deviceCountRef.set({
        licenseId: licenseKey,
        count: 0,
        limit: 1,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    // Check if this is an unlimited license (limit = -1)
    const isUnlimited = deviceLimit === -1;
    
    // Only check limit if not unlimited
    if (!isUnlimited && currentCount >= deviceLimit) {
      return res.status(200).json({
        valid: false,
        message: `License activation limit reached (${deviceLimit} devices)`,
        expiryDate: licenseData.expiryDate,
        deviceCount: currentCount,
        deviceLimit: deviceLimit,
        unlimited: false
      });
    }
    
    // Increment the count (even for unlimited licenses to track usage)
    await deviceCountRef.update({
      count: admin.firestore.FieldValue.increment(1),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Return success response
    return res.status(200).json({
      valid: true,
      message: isUnlimited ? 'License activated successfully (unlimited devices)' : 'License activated successfully',
      expiryDate: licenseData.expiryDate,
      deviceCount: currentCount + 1,
      deviceLimit: deviceLimit,
      unlimited: isUnlimited
    });
  } catch (error) {
    console.error('License verification error:', error);
    return res.status(500).json({ 
      valid: false, 
      message: 'Server error during verification' 
    });
  }
}); 