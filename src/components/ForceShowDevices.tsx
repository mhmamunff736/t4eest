import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Card,
  CardContent,
} from '@mui/material';
import { collection, query, where, getDocs, doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

const ForceShowDevices: React.FC = () => {
  const [licenseId, setLicenseId] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleForceCreateDevices = async () => {
    if (!licenseId) {
      setError('Please enter a license ID');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Create a device entry directly in Firestore
      const deviceId = `device-${licenseId}-${Date.now()}`;
      const deviceRef = doc(db, 'license_device_mapping', deviceId);
      
      // Add device data
      await setDoc(deviceRef, {
        deviceId: `DEV-${Math.floor(Math.random() * 10000)}`,
        licenseKey: licenseId,
        hostname: 'My Computer',
        registeredAt: Timestamp.now(),
        lastAccessed: Timestamp.now(),
        deviceInfo: {
          hostname: 'My Computer',
          system: 'Windows',
          release: '10',
          machine: 'x64',
          ip: '192.168.1.100'
        }
      });
      
      // Update device count to at least 1
      const counterRef = doc(db, 'license_devices_count', licenseId);
      await setDoc(counterRef, {
        count: 1,
        limit: 1,
        lastUpdated: Timestamp.now()
      }, { merge: true });
      
      setSuccess(`Successfully created device entry for license ${licenseId}. Your devices should now be visible.`);
    } catch (err: any) {
      console.error('Error creating device entry:', err);
      setError(`Failed to create device entry: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" gutterBottom color="error">
        Emergency Device Fix
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        If none of the other fixes work, this will force-create a device entry for your license.
      </Typography>
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="License ID"
              value={licenseId}
              onChange={(e) => setLicenseId(e.target.value)}
              required
              fullWidth
              disabled={loading}
              placeholder="Enter your license ID"
              helperText="Enter the license ID that's not showing devices"
            />
            
            <Button
              variant="contained"
              color="error"
              onClick={handleForceCreateDevices}
              disabled={loading || !licenseId}
              startIcon={loading && <CircularProgress size={20} />}
            >
              {loading ? 'Creating...' : 'Force Create Device Entry'}
            </Button>
          </Box>
        </CardContent>
      </Card>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}
      
      <Alert severity="warning">
        <Typography variant="body2">
          <strong>Note:</strong> This is a last-resort fix that directly creates a device entry in the database.
          After using this tool, please refresh the page to see the changes.
        </Typography>
      </Alert>
    </Box>
  );
};

export default ForceShowDevices; 