import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  Alert,
  Tooltip,
  CircularProgress,
  Snackbar,
  Grid,
  Slider,
  Card,
  CardContent,
  Divider,
  IconButton,
  Switch,
  FormControlLabel
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import DevicesIcon from '@mui/icons-material/Devices';
import InfinityIcon from '@mui/icons-material/AllInclusive';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { getLicenseDeviceCount, getLicenseDeviceLimit, setLicenseDeviceLimit, resetDeviceCount } from '../firebase/userService';

interface DeviceManagementProps {
  licenseId: string;
}

const DeviceManagement: React.FC<DeviceManagementProps> = ({ licenseId }) => {
  const [deviceCount, setDeviceCount] = useState<number>(0);
  const [deviceLimit, setDeviceLimit] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [updatingLimit, setUpdatingLimit] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [sliderValue, setSliderValue] = useState<number>(1);
  const [isUnlimited, setIsUnlimited] = useState(false);

  const fetchDeviceInfo = async () => {
    setLoading(true);
    try {
      const count = await getLicenseDeviceCount(licenseId);
      const limit = await getLicenseDeviceLimit(licenseId);
      
      setDeviceCount(count);
      
      // Check if it's an unlimited license (limit value of -1)
      if (limit === -1) {
        setDeviceLimit(-1);
        setIsUnlimited(true);
        setSliderValue(10); // Set slider to max for visual purposes when unlimited
      } else {
        setDeviceLimit(limit);
        setIsUnlimited(false);
        setSliderValue(limit);
      }
    } catch (err) {
      console.error('Error fetching device information:', err);
      setError('Failed to load device information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeviceInfo();
  }, [licenseId]);

  const handleUpdateDeviceLimit = async () => {
    if (sliderValue < 1 && !isUnlimited) {
      setError('Device limit must be at least 1');
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      setUpdatingLimit(true);
      
      // If unlimited is enabled, set limit to -1, otherwise use slider value
      const newLimit = isUnlimited ? -1 : sliderValue;
      
      await setLicenseDeviceLimit(licenseId, newLimit);
      setDeviceLimit(newLimit);
      setSuccess('Device limit updated successfully');
    } catch (err: any) {
      console.error('Error updating device limit:', err);
      setError(err.message || 'Failed to update device limit');
    } finally {
      setUpdatingLimit(false);
    }
  };

  const handleResetDeviceCount = async () => {
    try {
      setError(null);
      setSuccess(null);
      setResetting(true);
      
      await resetDeviceCount(licenseId);
      setDeviceCount(0);
      setSuccess('Device count reset successfully');
    } catch (err: any) {
      console.error('Error resetting device count:', err);
      setError(err.message || 'Failed to reset device count');
    } finally {
      setResetting(false);
    }
  };

  const getUsagePercentage = () => {
    if (deviceLimit === -1) return 0; // For unlimited licenses
    if (deviceLimit === 0) return 0;
    return (deviceCount / deviceLimit) * 100;
  };

  const handleToggleUnlimited = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsUnlimited(event.target.checked);
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          <DevicesIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Device Tracking
        </Typography>
        <Tooltip title="Refresh device information">
          <IconButton 
            onClick={fetchDeviceInfo}
            disabled={loading}
            size="small"
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Current Device Usage
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h3" color="primary" sx={{ mr: 2 }}>
                    {deviceCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {deviceLimit === -1 ? (
                      <span>devices are in use <InfinityIcon sx={{ verticalAlign: 'middle', fontSize: '1.2rem' }} /> unlimited allowed</span>
                    ) : (
                      <span>of {deviceLimit} allowed devices are in use</span>
                    )}
                  </Typography>
                </Box>
                <Box sx={{ mt: 2, mb: 1 }}>
                  {deviceLimit !== -1 && (
                    <div style={{ 
                      height: '10px', 
                      backgroundColor: '#e0e0e0', 
                      borderRadius: '5px', 
                      position: 'relative' 
                    }}>
                      <div style={{ 
                        height: '100%', 
                        width: `${Math.min(getUsagePercentage(), 100)}%`, 
                        backgroundColor: deviceCount >= deviceLimit ? '#f44336' : '#2196f3',
                        borderRadius: '5px',
                        transition: 'width 0.5s ease-in-out'
                      }} />
                    </div>
                  )}
                </Box>
                <Box sx={{ mt: 3 }}>
                  <Button 
                    variant="outlined" 
                    color="secondary"
                    onClick={handleResetDeviceCount}
                    disabled={resetting || deviceCount === 0}
                    startIcon={resetting && <CircularProgress size={16} />}
                  >
                    {resetting ? 'Resetting...' : 'Reset Device Count'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Device Limit Settings
                </Typography>
                
                <FormControlLabel
                  control={
                    <Switch 
                      checked={isUnlimited} 
                      onChange={handleToggleUnlimited}
                      color="primary"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography>Unlimited Devices</Typography>
                      <InfinityIcon sx={{ ml: 1, fontSize: '1.2rem' }} />
                    </Box>
                  }
                  sx={{ mb: 2 }}
                />
                
                {!isUnlimited && (
                  <Box sx={{ mt: 3, mb: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">Device Limit</Typography>
                      <Typography variant="body1" fontWeight="bold">{sliderValue}</Typography>
                    </Box>
                    <Slider
                      value={sliderValue}
                      onChange={(_, value) => setSliderValue(value as number)}
                      min={1}
                      max={50}
                      step={1}
                      marks={[
                        { value: 1, label: '1' },
                        { value: 10, label: '10' },
                        { value: 25, label: '25' },
                        { value: 50, label: '50' }
                      ]}
                      valueLabelDisplay="auto"
                    />
                  </Box>
                )}
                
                <Box sx={{ mt: 3 }}>
                  <Button 
                    variant="contained" 
                    color="primary"
                    onClick={handleUpdateDeviceLimit}
                    disabled={updatingLimit || (!isUnlimited && sliderValue === deviceLimit) || (isUnlimited && deviceLimit === -1)}
                    startIcon={updatingLimit && <CircularProgress size={16} />}
                    fullWidth
                  >
                    {updatingLimit ? 'Updating...' : 'Update Device Limit'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 3 }}>
          {error}
        </Alert>
      )}

      <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
        The system automatically tracks how many devices are using this license.
        When a new device attempts to use the license, the count will increase.
        {isUnlimited ? 
          " This license is set to unlimited mode, allowing any number of devices to use it." : 
          " The limit determines the maximum number of devices that can use this license simultaneously."}
      </Typography>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
        message={success}
      />
    </Box>
  );
};

export default DeviceManagement; 