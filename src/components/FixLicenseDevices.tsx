import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Card,
  CardContent,
  Grid,
  Divider,
} from '@mui/material';
import { createSampleDeviceData, fixDeviceEntries } from '../firebase/userService';

const FixLicenseDevices: React.FC = () => {
  const [licenseId, setLicenseId] = useState('');
  const [deviceCount, setDeviceCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [repairing, setRepairing] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!licenseId) {
      setError('Please enter a license ID');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const result = await createSampleDeviceData(licenseId, deviceCount);
      
      if (result) {
        setSuccess(`Successfully initialized ${deviceCount} device(s) for license ${licenseId}`);
      } else {
        setError('Failed to initialize device data. See console for details.');
      }
    } catch (err: any) {
      console.error('Error initializing device data:', err);
      setError(err.message || 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleFixDeviceEntries = async () => {
    if (!licenseId) {
      setError('Please enter a license ID');
      return;
    }
    
    setRepairing(true);
    setError(null);
    setSuccess(null);
    
    try {
      const result = await fixDeviceEntries(licenseId);
      
      if (result) {
        setSuccess(`Successfully fixed device entries for license ${licenseId}. You should now see the devices in the list.`);
      } else {
        setError('Failed to fix device entries. See console for details.');
      }
    } catch (err: any) {
      console.error('Error fixing device entries:', err);
      setError(err.message || 'An unknown error occurred');
    } finally {
      setRepairing(false);
    }
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        Fix License Device Issues
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Tools to fix common issues with device counts and device displays
      </Typography>
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box mb={2}>
            <TextField
              label="License ID"
              value={licenseId}
              onChange={(e) => setLicenseId(e.target.value)}
              required
              fullWidth
              placeholder="Enter your license ID"
              helperText="This is the ID of the license with device issues"
            />
          </Box>
          
          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">Choose a Fix Option</Typography>
          </Divider>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Option 1: Set Device Count
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Use this if your license shows 0 devices but you're using it.
                </Typography>
                
                <form onSubmit={handleSubmit}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControl fullWidth>
                      <InputLabel id="device-count-label">Number of Devices</InputLabel>
                      <Select
                        labelId="device-count-label"
                        value={deviceCount}
                        onChange={(e) => setDeviceCount(Number(e.target.value))}
                        label="Number of Devices"
                        disabled={loading}
                      >
                        {[1, 2, 3, 4, 5].map((num) => (
                          <MenuItem key={num} value={num}>
                            {num} device{num > 1 ? 's' : ''}
                          </MenuItem>
                        ))}
                      </Select>
                      <FormHelperText>
                        How many devices should be shown as using this license
                      </FormHelperText>
                    </FormControl>
                    
                    <Button
                      variant="contained"
                      color="primary"
                      type="submit"
                      disabled={loading || !licenseId}
                      startIcon={loading && <CircularProgress size={20} />}
                    >
                      {loading ? 'Processing...' : 'Set Device Count'}
                    </Button>
                  </Box>
                </form>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Option 2: Fix Missing Devices
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Use this if your license shows a device count but says "No devices found for this license".
                </Typography>
                
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={handleFixDeviceEntries}
                    disabled={repairing || !licenseId}
                    startIcon={repairing && <CircularProgress size={20} />}
                    fullWidth
                  >
                    {repairing ? 'Fixing Devices...' : 'Fix Missing Devices'}
                  </Button>
                  <FormHelperText>
                    This will create device entries that match your current device count
                  </FormHelperText>
                </Box>
              </Box>
            </Grid>
          </Grid>
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
      
      <Alert severity="info">
        <Typography variant="body2">
          <strong>How this works:</strong> Option 1 creates sample device records and updates the count.
          Option 2 ensures the device entries exist in the database and match your license count.
          After using either tool, your license should show the correct devices.
        </Typography>
      </Alert>
    </Box>
  );
};

export default FixLicenseDevices; 