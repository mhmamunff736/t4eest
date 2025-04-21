import { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  IconButton, 
  Chip,
  Box,
  Typography,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  useTheme,
  Stack,
  InputAdornment,
  Tooltip,
  Card,
  Divider,
  TablePagination,
  Zoom,
  alpha,
  Collapse
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SortIcon from '@mui/icons-material/Sort';
import DevicesIcon from '@mui/icons-material/Devices';
import InfinityIcon from '@mui/icons-material/AllInclusive';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import dayjs from 'dayjs';
import { License } from '../types';
import { getLicenses, updateLicense, deleteLicense, searchLicenses } from '../firebase/licenseService';
import { getLicenseDeviceCount, getLicenseDeviceLimit } from '../firebase/userService';
import DeviceManagement from './DeviceManagement';

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' }
];

interface LicenseTableProps {
  refreshTrigger: number;
}

const LicenseTable = ({ refreshTrigger }: LicenseTableProps) => {
  const theme = useTheme();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [filteredLicenses, setFilteredLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [editLicenseId, setEditLicenseId] = useState('');
  const [editExpiryDate, setEditExpiryDate] = useState<dayjs.Dayjs | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [deviceLimits, setDeviceLimits] = useState<{ [key: string]: number }>({});
  const [deviceCounts, setDeviceCounts] = useState<{ [key: string]: number }>({});
  const [loadingDeviceInfo, setLoadingDeviceInfo] = useState(false);

  // Fetch all licenses
  useEffect(() => {
    const fetchLicenses = async () => {
      setLoading(true);
      try {
        const data = await getLicenses();
        setLicenses(data);
        setFilteredLicenses(data);
      } catch (error) {
        console.error('Error fetching licenses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLicenses();
  }, [refreshTrigger]);

  // Handle search and filter
  useEffect(() => {
    const applyFilters = async () => {
      if (!searchText && !statusFilter) {
        setFilteredLicenses(licenses);
        return;
      }

      try {
        let result: License[] = [];

        if (searchText) {
          // Search by licenseId
          result = await searchLicenses('licenseId', searchText);
        } else {
          // Use all licenses if no search text
          result = [...licenses];
        }

        // Apply status filter if needed
        if (statusFilter) {
          result = result.filter(license => 
            license.status?.toLowerCase() === statusFilter.toLowerCase()
          );
        }

        setFilteredLicenses(result);
        setPage(0); // Reset to first page on filter change
      } catch (error) {
        console.error('Error filtering licenses:', error);
      }
    };

    applyFilters();
  }, [searchText, statusFilter, licenses]);

  // Fetch device limits for all licenses
  useEffect(() => {
    const fetchDeviceLimits = async () => {
      if (!licenses.length) return;
      
      setLoadingDeviceInfo(true);
      const limits: { [key: string]: number } = {};
      const counts: { [key: string]: number } = {};
      
      try {
        for (const license of licenses) {
          const limit = await getLicenseDeviceLimit(license.licenseId);
          const count = await getLicenseDeviceCount(license.licenseId);
          limits[license.licenseId] = limit;
          counts[license.licenseId] = count;
        }
        
        setDeviceLimits(limits);
        setDeviceCounts(counts);
      } catch (error) {
        console.error('Error fetching device limits:', error);
      } finally {
        setLoadingDeviceInfo(false);
      }
    };
    
    fetchDeviceLimits();
  }, [licenses]);

  // Open edit dialog
  const handleEditClick = (license: License) => {
    setSelectedLicense(license);
    setEditLicenseId(license.licenseId);
    setEditExpiryDate(dayjs(license.expiryDate));
    setEditDialogOpen(true);
  };

  // Open delete dialog
  const handleDeleteClick = (license: License) => {
    setSelectedLicense(license);
    setDeleteDialogOpen(true);
  };

  // Handle license update
  const handleUpdateLicense = async () => {
    if (!selectedLicense?.id || !editLicenseId.trim() || !editExpiryDate) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      await updateLicense(selectedLicense.id, {
        licenseId: editLicenseId.trim(),
        expiryDate: editExpiryDate.format('YYYY-MM-DD')
      });
      
      // Update the license in the local state
      const updatedLicenses = licenses.map(license => {
        if (license.id === selectedLicense.id) {
          return {
            ...license,
            licenseId: editLicenseId.trim(),
            expiryDate: editExpiryDate.format('YYYY-MM-DD')
          };
        }
        return license;
      });
      
      setLicenses(updatedLicenses);
      setEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating license:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle license deletion
  const handleDeleteLicense = async () => {
    if (!selectedLicense?.id) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      await deleteLicense(selectedLicense.id);
      
      // Remove the license from the local state
      const updatedLicenses = licenses.filter(license => license.id !== selectedLicense.id);
      setLicenses(updatedLicenses);
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting license:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle pagination
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Calculate time until expiry
  const getExpiryInfo = (expiryDate: string) => {
    const today = dayjs();
    const expiry = dayjs(expiryDate);
    const daysLeft = expiry.diff(today, 'day');
    
    if (daysLeft < 0) {
      return {
        label: `Expired ${Math.abs(daysLeft)} days ago`,
        color: 'error'
      };
    } else if (daysLeft < 7) {
      return {
        label: `${daysLeft} days left`,
        color: 'error'
      };
    } else if (daysLeft < 30) {
      return {
        label: `${daysLeft} days left`,
        color: 'warning'
      };
    } else {
      return {
        label: `${daysLeft} days left`,
        color: 'success'
      };
    }
  };

  // Get current page data
  const currentPageLicenses = filteredLicenses.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Toggle expanded row for device management
  const handleToggleRow = (licenseId: string) => {
    setExpandedRow(expandedRow === licenseId ? null : licenseId);
  };

  // Helper function to display device limit info
  const formatDeviceLimit = (licenseId: string) => {
    const limit = deviceLimits[licenseId];
    const count = deviceCounts[licenseId] || 0;
    
    if (limit === -1) {
      return (
        <Stack direction="row" alignItems="center" spacing={1}>
          <InfinityIcon fontSize="small" color="primary" />
          <Typography variant="body2">Unlimited</Typography>
          <Chip 
            label={`${count} in use`} 
            size="small" 
            color="info" 
            variant="outlined"
          />
        </Stack>
      );
    }
    
    return (
      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography variant="body2">{limit}</Typography>
        <Chip 
          label={`${count} in use`} 
          size="small" 
          color={count >= limit ? "error" : "info"} 
          variant="outlined"
        />
      </Stack>
    );
  };

  return (
    <Card sx={{ 
      borderRadius: 2, 
      overflow: 'hidden',
      transition: 'all 0.3s ease',
      boxShadow: theme.palette.mode === 'dark' 
        ? '0 4px 20px rgba(0,0,0,0.4)' 
        : '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      <Box sx={{ p: 2, pb: 1 }}>
        <Typography variant="h6" fontWeight={500} gutterBottom>
          Manage Licenses
        </Typography>
        
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={2} 
          sx={{ mb: 2 }}
        >
          <TextField
            placeholder="Search license ID..."
            variant="outlined"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            fullWidth
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          />
          
          <TextField
            select
            label="Filter by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            variant="outlined"
            size="small"
            sx={{ 
              minWidth: { xs: '100%', sm: 200 },
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FilterListIcon color="action" fontSize="small" />
                </InputAdornment>
              ),
            }}
          >
            {statusOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Box>
      
      <Divider />

      {/* Table Content */}
      <TableContainer component={Paper} sx={{ borderRadius: 0 }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow sx={{ 
              backgroundColor: theme.palette.mode === 'dark' 
                ? alpha(theme.palette.primary.main, 0.1) 
                : alpha(theme.palette.primary.main, 0.05)
            }}>
              <TableCell>License ID</TableCell>
              <TableCell>Expiry Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Time Remaining</TableCell>
              <TableCell>Device Limit</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                  <CircularProgress size={40} />
                  <Typography variant="body2" sx={{ mt: 2 }}>
                    Loading licenses...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : currentPageLicenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                  <Typography variant="body1">
                    No licenses found matching your criteria
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              currentPageLicenses.map((license) => {
                const expiryInfo = getExpiryInfo(license.expiryDate);
                const isExpanded = expandedRow === license.licenseId;
                
                return (
                  <>
                    <TableRow 
                      key={license.id}
                      sx={{ 
                        '&:hover': { 
                          backgroundColor: theme.palette.mode === 'dark' 
                            ? alpha(theme.palette.primary.main, 0.1) 
                            : alpha(theme.palette.primary.main, 0.05)
                        },
                        cursor: 'pointer',
                      }}
                      onMouseEnter={() => setHoveredRow(license.id!)}
                      onMouseLeave={() => setHoveredRow(null)}
                    >
                      <TableCell>{license.licenseId}</TableCell>
                      <TableCell>{dayjs(license.expiryDate).format('MMM DD, YYYY')}</TableCell>
                      <TableCell>
                        <Chip 
                          label={license.status} 
                          color={license.status === 'Active' ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={expiryInfo.label}
                          color={expiryInfo.color as "success" | "error" | "warning"}
                          size="small"
                          icon={<AccessTimeIcon />}
                        />
                      </TableCell>
                      <TableCell>
                        {loadingDeviceInfo ? (
                          <CircularProgress size={16} />
                        ) : (
                          formatDeviceLimit(license.licenseId)
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title="Manage Devices">
                            <IconButton
                              size="small"
                              onClick={() => handleToggleRow(license.licenseId)}
                              color={isExpanded ? "primary" : "default"}
                            >
                              <DevicesIcon fontSize="small" />
                              {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit License">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditClick(license);
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete License">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(license);
                              }}
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                          <Box sx={{ p: 3, backgroundColor: alpha(theme.palette.background.paper, 0.5) }}>
                            <DeviceManagement licenseId={license.licenseId} />
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredLicenses.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />

      {/* Edit License Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 8px 32px rgba(0,0,0,0.5)' 
              : '0 8px 32px rgba(0,0,0,0.1)'
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" fontWeight={600}>Edit License</Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              autoFocus
              margin="dense"
              label="License ID"
              fullWidth
              value={editLicenseId}
              onChange={(e) => setEditLicenseId(e.target.value)}
              sx={{ mb: 2, mt: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Expiry Date"
                value={editExpiryDate}
                onChange={(newValue) => setEditExpiryDate(newValue)}
                sx={{ width: '100%' }}
                slotProps={{
                  textField: {
                    InputProps: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <AccessTimeIcon color="action" />
                        </InputAdornment>
                      ),
                    }
                  }
                }}
              />
            </LocalizationProvider>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={() => setEditDialogOpen(false)}
            variant="outlined"
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdateLicense}
            variant="contained"
            disabled={isSubmitting}
            startIcon={isSubmitting && <CircularProgress size={16} color="inherit" />}
          >
            {isSubmitting ? 'Updating...' : 'Update License'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete License Dialog */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 2,
          }
        }}
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight={600}>Delete License</Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete the license:
          </Typography>
          <Typography variant="subtitle1" fontWeight={600} mt={1} color="error">
            {selectedLicense?.licenseId}
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={2}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            variant="outlined"
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteLicense}
            color="error"
            variant="contained"
            disabled={isSubmitting}
            startIcon={isSubmitting && <CircularProgress size={16} color="inherit" />}
          >
            {isSubmitting ? 'Deleting...' : 'Delete License'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default LicenseTable; 