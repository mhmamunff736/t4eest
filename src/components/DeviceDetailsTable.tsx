import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Chip,
  TablePagination,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import LaptopIcon from '@mui/icons-material/Laptop';
import RefreshIcon from '@mui/icons-material/Refresh';
import DesktopWindowsIcon from '@mui/icons-material/DesktopWindows';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import TabletMacIcon from '@mui/icons-material/TabletMac';
import InfoIcon from '@mui/icons-material/Info';
import { format, formatDistanceToNow } from 'date-fns';
import { getLicenseDeviceDetails, revokeDeviceAccess, decrementDeviceCount } from '../firebase/userService';

interface DeviceDetailsTableProps {
  licenseId: string;
  onDeviceCountChange?: () => void;
}

interface DeviceInfo {
  id: string;
  deviceId: string;
  hostname: string;
  registeredAt: { toDate: () => Date } | Date;
  lastAccessed: { toDate: () => Date } | Date;
  deviceInfo: {
    hostname: string;
    system: string;
    release: string;
    machine: string;
    ip?: string;
  };
}

const DeviceDetailsTable: React.FC<DeviceDetailsTableProps> = ({ licenseId, onDeviceCountChange }) => {
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<DeviceInfo | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDevices = useCallback(async () => {
    if (!licenseId) {
      setLoading(false);
      setError("Missing license ID");
      console.error("Missing licenseId in DeviceDetailsTable");
      return;
    }

    setLoading(true);
    setError(null);
    
    console.log(`Fetching devices for license ID: ${licenseId}`);
    
    try {
      const devicesData = await getLicenseDeviceDetails(licenseId);
      console.log(`Retrieved ${devicesData?.length || 0} devices:`, devicesData);
      
      // Add fallback for missing device data
      const processedDevices = devicesData?.map(device => ({
        ...device,
        deviceInfo: device.deviceInfo || {
          hostname: device.hostname || 'Unknown Device',
          system: 'Unknown',
          release: '',
          machine: '',
          ip: ''
        }
      })) || [];
      
      setDevices(processedDevices as DeviceInfo[]);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching device details:", err);
      setError("Failed to load device details. Please try again later.");
      setLoading(false);
    }
  }, [licenseId]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRevoke = (device: DeviceInfo) => {
    setSelectedDevice(device);
    setDeleteDialogOpen(true);
  };

  const confirmRevoke = async () => {
    if (!selectedDevice) return;
    
    setIsSubmitting(true);
    try {
      await revokeDeviceAccess(selectedDevice.id);
      await decrementDeviceCount(licenseId);
      
      // Remove from local state
      setDevices(devices.filter(d => d.id !== selectedDevice.id));
      setSuccess(`Access revoked for device ${selectedDevice.deviceInfo.hostname || selectedDevice.deviceId}`);
      
      // Notify parent component
      if (onDeviceCountChange) {
        onDeviceCountChange();
      }
    } catch (err) {
      console.error('Error revoking device access:', err);
      setError('Failed to revoke device access');
    } finally {
      setIsSubmitting(false);
      setDeleteDialogOpen(false);
      setSelectedDevice(null);
    }
  };

  // Format date for display
  const formatDate = (date: any) => {
    if (!date) return 'Unknown';
    try {
      // Handle Firestore Timestamp
      if (date.toDate && typeof date.toDate === 'function') {
        return format(date.toDate(), 'MMM dd, yyyy h:mm a');
      }
      // Handle Date objects
      else if (date instanceof Date) {
        return format(date, 'MMM dd, yyyy h:mm a');
      }
      // Handle ISO strings
      else if (typeof date === 'string') {
        return format(new Date(date), 'MMM dd, yyyy h:mm a');
      }
      // Handle numeric timestamps
      else if (typeof date === 'number') {
        return format(new Date(date), 'MMM dd, yyyy h:mm a');
      }
    } catch (err) {
      console.error('Error formatting date:', err, date);
    }
    return 'Unknown';
  };

  // Get relative time (e.g., "2 days ago")
  const getRelativeTime = (date: any) => {
    if (!date) return 'Unknown';
    try {
      // Handle Firestore Timestamp
      if (date.toDate && typeof date.toDate === 'function') {
        return formatDistanceToNow(date.toDate(), { addSuffix: true });
      }
      // Handle Date objects
      else if (date instanceof Date) {
        return formatDistanceToNow(date, { addSuffix: true });
      }
      // Handle ISO strings
      else if (typeof date === 'string') {
        return formatDistanceToNow(new Date(date), { addSuffix: true });
      }
      // Handle numeric timestamps
      else if (typeof date === 'number') {
        return formatDistanceToNow(new Date(date), { addSuffix: true });
      }
    } catch (err) {
      console.error('Error getting relative time:', err, date);
    }
    return 'Unknown';
  };

  // Get the appropriate icon based on device type
  const getDeviceIcon = (deviceInfo: DeviceInfo['deviceInfo'] | undefined) => {
    if (!deviceInfo) return <LaptopIcon fontSize="small" />;
    
    const system = (deviceInfo?.system || '').toLowerCase();
    
    if (system.includes('android') || system.includes('ios')) {
      return <PhoneAndroidIcon fontSize="small" />;
    } else if (system.includes('tablet')) {
      return <TabletMacIcon fontSize="small" />;
    } else if (system.includes('windows')) {
      return <DesktopWindowsIcon fontSize="small" />;
    } else {
      return <LaptopIcon fontSize="small" />;
    }
  };

  // Get a safe hostname for the device
  const getDeviceHostname = (device: DeviceInfo) => {
    if (device.deviceInfo?.hostname) return device.deviceInfo.hostname;
    if (device.hostname) return device.hostname;
    if (device.deviceId) return device.deviceId;
    return 'Unknown Device';
  };

  // Get system info safely
  const getSystemInfo = (device: DeviceInfo) => {
    const system = device.deviceInfo?.system || 'Unknown';
    const release = device.deviceInfo?.release || '';
    
    return `${system} ${release}`.trim();
  };

  // Get IP address safely
  const getIpAddress = (device: DeviceInfo) => {
    return device.deviceInfo?.ip || 'Unknown';
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          <LaptopIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Device Details
        </Typography>
        <Tooltip title="Refresh device information">
          <IconButton 
            onClick={fetchDevices}
            disabled={loading}
            size="small"
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
          <Button size="small" onClick={fetchDevices} sx={{ ml: 2 }}>
            Retry
          </Button>
        </Alert>
      )}

      {success && (
        <Alert 
          severity="success" 
          sx={{ mb: 2 }}
          onClose={() => setSuccess(null)}
        >
          {success}
        </Alert>
      )}

      <Paper sx={{ width: '100%', mb: 2 }}>
        <TableContainer>
          <Table sx={{ minWidth: 650 }} aria-label="device details table">
            <TableHead>
              <TableRow>
                <TableCell>Device</TableCell>
                <TableCell>System</TableCell>
                <TableCell>IP Address</TableCell>
                <TableCell>Registered</TableCell>
                <TableCell>Last Access</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress size={24} sx={{ my: 2 }} />
                    <Typography variant="body2">Loading device details...</Typography>
                  </TableCell>
                </TableRow>
              ) : devices.length === 0 ? (
                <>
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Alert severity="warning" sx={{ mb: 2 }}>
                        No devices found for this license. Using fallback display mode.
                      </Alert>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <LaptopIcon fontSize="small" />
                        <Typography variant="body2" sx={{ ml: 1 }}>
                          Current Device
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        size="small" 
                        label="Windows 10"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>192.168.1.100</TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        Today
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        Just now
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        disabled={true}
                        size="small"
                      >
                        Viewing License
                      </Button>
                    </TableCell>
                  </TableRow>
                </>
              ) : devices[0].id === 'sample-device-1' ? (
                <>
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Alert severity="info" sx={{ mb: 2 }}>
                        No real devices found in the database. Showing sample data for preview purposes.
                      </Alert>
                    </TableCell>
                  </TableRow>
                  {devices
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((device) => (
                      <TableRow key={device.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {getDeviceIcon(device.deviceInfo)}
                            <Typography variant="body2" sx={{ ml: 1 }}>
                              {getDeviceHostname(device)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            size="small" 
                            label={getSystemInfo(device)}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>{getIpAddress(device)}</TableCell>
                        <TableCell>
                          <Tooltip title={formatDate(device.registeredAt)}>
                            <Typography variant="body2">
                              {getRelativeTime(device.registeredAt)}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Tooltip title={formatDate(device.lastAccessed)}>
                            <Typography variant="body2">
                              {getRelativeTime(device.lastAccessed)}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outlined"
                            disabled={true}
                            size="small"
                          >
                            Sample Device
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </>
              ) : (
                devices
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((device) => (
                    <TableRow key={device.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {getDeviceIcon(device.deviceInfo)}
                          <Typography variant="body2" sx={{ ml: 1 }}>
                            {getDeviceHostname(device)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          size="small" 
                          label={getSystemInfo(device)}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{getIpAddress(device)}</TableCell>
                      <TableCell>
                        <Tooltip title={formatDate(device.registeredAt)}>
                          <Typography variant="body2">
                            {getRelativeTime(device.registeredAt)}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Tooltip title={formatDate(device.lastAccessed)}>
                          <Typography variant="body2">
                            {getRelativeTime(device.lastAccessed)}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={() => handleRevoke(device)}
                        >
                          Revoke Access
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={devices.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Confirmation Dialog for Revoking Access */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Revoke Device Access</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to revoke access for this device?
            <Box component="span" sx={{ display: 'block', mt: 1, fontWeight: 'bold' }}>
              {selectedDevice?.deviceInfo?.hostname || 'Unknown Device'}
            </Box>
            This will prevent this device from using the license in the future until the user re-registers.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={confirmRevoke} 
            color="error"
            disabled={isSubmitting}
            startIcon={isSubmitting && <CircularProgress size={16} />}
          >
            {isSubmitting ? 'Revoking...' : 'Revoke Access'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DeviceDetailsTable; 