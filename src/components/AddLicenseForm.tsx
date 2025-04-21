import { useState } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Paper, 
  Alert, 
  Stack, 
  Divider, 
  Fade,
  Chip,
  IconButton,
  InputAdornment,
  useTheme
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import AddIcon from '@mui/icons-material/Add';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { addLicense } from '../firebase/licenseService';

interface AddLicenseFormProps {
  onSuccess: () => void;
}

const AddLicenseForm = ({ onSuccess }: AddLicenseFormProps) => {
  const theme = useTheme();
  const [licenseId, setLicenseId] = useState('');
  const [expiryDate, setExpiryDate] = useState<Dayjs | null>(dayjs().add(1, 'year'));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formExpanded, setFormExpanded] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!licenseId.trim()) {
      setError('License ID is required');
      return;
    }

    if (!expiryDate) {
      setError('Expiry date is required');
      return;
    }

    try {
      setIsSubmitting(true);
      await addLicense({
        licenseId: licenseId.trim(),
        expiryDate: expiryDate.format('YYYY-MM-DD'),
      });
      
      setSuccess(true);
      setLicenseId('');
      setExpiryDate(dayjs().add(1, 'year'));
      onSuccess();
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
        setFormExpanded(false);
      }, 3000);
    } catch (err) {
      setError('Failed to add license. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleFormExpanded = () => {
    setFormExpanded(prev => !prev);
    setError(null);
    setSuccess(false);
  };

  // Calculate days until expiry
  const daysUntilExpiry = expiryDate ? expiryDate.diff(dayjs(), 'day') : 0;
  const expiryStatus = daysUntilExpiry > 30 ? 'success' : daysUntilExpiry > 7 ? 'warning' : 'error';

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 3, 
        mb: 4,
        borderRadius: 2,
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 8px 16px rgba(0,0,0,0.4)' 
            : '0 8px 16px rgba(0,0,0,0.1)'
        }
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        cursor: 'pointer',
        mb: formExpanded ? 2 : 0
      }} onClick={toggleFormExpanded}>
        <Stack direction="row" spacing={1} alignItems="center">
          <AddIcon color="primary" />
          <Typography variant="h6" fontWeight={500}>
            {formExpanded ? 'Add New License' : 'Create License'}
          </Typography>
        </Stack>
        <Chip 
          label={formExpanded ? "Cancel" : "Add New"} 
          color={formExpanded ? "default" : "primary"} 
          size="small"
          variant={formExpanded ? "outlined" : "filled"}
        />
      </Box>
      
      {formExpanded && (
        <Fade in={formExpanded} timeout={500}>
          <Box>
            <Divider sx={{ my: 2 }} />
            
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} variant="filled">
                {error}
              </Alert>
            )}
            
            {success && (
              <Alert 
                severity="success" 
                sx={{ mb: 2 }} 
                variant="filled"
                icon={<CheckCircleOutlineIcon fontSize="inherit" />}
              >
                License added successfully!
              </Alert>
            )}
            
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <TextField
                margin="normal"
                required
                fullWidth
                id="licenseId"
                label="License ID"
                name="licenseId"
                autoFocus
                value={licenseId}
                onChange={(e) => setLicenseId(e.target.value)}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <VpnKeyIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
              
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Expiry Date"
                  value={expiryDate}
                  onChange={(newValue) => setExpiryDate(newValue)}
                  sx={{ width: '100%', mb: 2 }}
                  slotProps={{
                    textField: {
                      InputProps: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <CalendarMonthIcon color="action" />
                          </InputAdornment>
                        ),
                      }
                    }
                  }}
                />
              </LocalizationProvider>
              
              {expiryDate && (
                <Fade in={Boolean(expiryDate)} timeout={500}>
                  <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Time until expiry:
                    </Typography>
                    <Chip 
                      label={`${daysUntilExpiry} days`} 
                      color={expiryStatus} 
                      size="small" 
                      variant="outlined"
                    />
                  </Box>
                </Fade>
              )}
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={isSubmitting}
                sx={{ 
                  mt: 2,
                  py: 1.2,
                  fontWeight: 'bold',
                  transition: 'transform 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)'
                  }
                }}
                startIcon={<AddIcon />}
              >
                {isSubmitting ? 'Adding...' : 'Create License'}
              </Button>
            </Box>
          </Box>
        </Fade>
      )}
    </Paper>
  );
};

export default AddLicenseForm; 