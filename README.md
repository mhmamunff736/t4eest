# License Admin Panel

A complete license management system with Firebase integration. This admin panel allows you to create, manage, and verify licenses for your software applications.

## Features

- Create and manage software licenses
- Set expiration dates for licenses
- Automatic device tracking without device IDs
- Set custom device limits per license
- License verification API
- Dashboard with analytics
- User authentication and role-based access

## Setup

1. **Firebase Setup**

```bash
# Install Firebase tools
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase project
firebase init
```

2. **Install Dependencies**

```bash
# Install dependencies
npm install

# Install Firebase functions dependencies
cd functions
npm install
cd ..
```

3. **Configure Firebase**

Update the Firebase configuration in `src/firebase/config.ts` with your Firebase project details:

```typescript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
```

4. **Deploy Firebase Functions**

```bash
firebase deploy --only functions
```

5. **Start the Development Server**

```bash
npm run dev
```

## Device Tracking System

The license system now automatically tracks how many devices are using each license without requiring device IDs. This provides several benefits:

- No need to collect or store specific device identifiers
- Simpler to implement in client applications
- More flexible license usage across different devices
- Admin can set custom device limits per license
- Device count can be reset if needed

When a device requests a license activation, the system increments a counter. If the counter reaches the limit set for that license, further activations are denied until:
1. The admin increases the device limit for that license, or
2. The admin resets the device count for that license

## License Verification API

The License Verification API allows your application to verify licenses with automatic device tracking.

### API Endpoint

```
POST https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/verifyLicense
```

### Request Format

```json
{
  "licenseKey": "LICENSE_KEY_HERE"
}
```

### Response Format

**Success:**
```json
{
  "valid": true,
  "message": "License activated successfully",
  "expiryDate": "2023-12-31",
  "deviceCount": 1,
  "deviceLimit": 3
}
```

**Failure:**
```json
{
  "valid": false,
  "message": "License activation limit reached (3 devices)",
  "expiryDate": "2023-12-31",
  "deviceCount": 3,
  "deviceLimit": 3
}
```

## Python Client Implementation

In your Python application, you can add license verification like this:

```python
def verify_license(license_key):
    try:
        import requests
        
        # Make verification request
        response = requests.post(
            "https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/verifyLicense",
            json={"licenseKey": license_key}
        )
        
        data = response.json()
        if data.get("valid"):
            # License is valid
            device_count = data.get("deviceCount", 1)
            device_limit = data.get("deviceLimit", 1)
            print(f"License valid. Device {device_count} of {device_limit}.")
            return True, "License valid"
        else:
            # License is invalid or limit reached
            return False, data.get("message", "Invalid license")
            
    except Exception as e:
        return False, str(e)
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
