import { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  useTheme,
  Fade,
  Zoom
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import { exportLicenses, importLicenses } from '../firebase/licenseService';

interface LicenseImportExportProps {
  onComplete: () => void;
}

const LicenseImportExport = ({ onComplete }: LicenseImportExportProps) => {
  const theme = useTheme();
  const [openExport, setOpenExport] = useState(false);
  const [openImport, setOpenImport] = useState(false);
  const [exportData, setExportData] = useState('');
  const [importData, setImportData] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [copied, setCopied] = useState(false);
  const [importedCount, setImportedCount] = useState(0);

  // Export steps
  const exportSteps = ['Generate Export Data', 'Copy Export Data'];

  // Import steps  
  const importSteps = ['Paste Import Data', 'Validate Data', 'Import Licenses'];

  const handleExport = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await exportLicenses();
      setExportData(data);
      setActiveStep(1);
      setSuccess('Data exported successfully. Copy the data below to save it.');
    } catch (err) {
      setError('Failed to export licenses. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(exportData).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      setError('Failed to copy to clipboard. Please select and copy manually.');
    });
  };

  const handleImport = async () => {
    if (activeStep === 0) {
      // Move to validation step
      try {
        JSON.parse(importData);
        setActiveStep(1);
        setSuccess('Data validation successful. Ready to import.');
        setError(null);
      } catch (err) {
        setError('Invalid JSON data. Please check the format and try again.');
      }
      return;
    }

    if (activeStep === 1) {
      // Perform the actual import
      setLoading(true);
      setError(null);
      try {
        const count = await importLicenses(importData);
        setImportedCount(count);
        setActiveStep(2);
        setSuccess(`Successfully imported ${count} licenses!`);
      } catch (err) {
        setError('Failed to import licenses. Please check the data format and try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCloseExport = () => {
    setOpenExport(false);
    setExportData('');
    setActiveStep(0);
    setError(null);
    setSuccess(null);
  };

  const handleCloseImport = () => {
    setOpenImport(false);
    setImportData('');
    setActiveStep(0);
    setError(null);
    setSuccess(null);
    
    if (importedCount > 0) {
      onComplete();
    }
  };

  const handleImportDataChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setImportData(event.target.value);
    setError(null);
  };

  const handleClearImportData = () => {
    setImportData('');
  };

  return (
    <>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<FileDownloadIcon />}
          onClick={() => setOpenExport(true)}
        >
          Export Licenses
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<UploadFileIcon />}
          onClick={() => setOpenImport(true)}
        >
          Import Licenses
        </Button>
      </Box>

      {/* Export Dialog */}
      <Dialog
        open={openExport}
        onClose={handleCloseExport}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: theme.shadows[10]
          }
        }}
      >
        <DialogTitle>
          <Typography variant="h6" component="div" fontWeight={600}>
            Export Licenses
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
            {exportSteps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {success}
            </Alert>
          )}

          {activeStep === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" gutterBottom>
                Click the button below to generate an export of all your licenses.
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                This data can be used for backup or to import licenses into another system.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={handleExport}
                disabled={loading}
                startIcon={loading && <CircularProgress size={16} color="inherit" />}
                sx={{ mt: 2 }}
              >
                {loading ? 'Generating...' : 'Generate Export Data'}
              </Button>
            </Box>
          ) : (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  License Data (JSON format)
                </Typography>
                <Tooltip title={copied ? 'Copied!' : 'Copy to clipboard'}>
                  <span>
                    <IconButton onClick={handleCopyToClipboard} color={copied ? 'success' : 'default'}>
                      {copied ? <CheckCircleIcon /> : <ContentCopyIcon />}
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
              <TextField
                multiline
                fullWidth
                rows={15}
                value={exportData}
                variant="outlined"
                InputProps={{
                  readOnly: true,
                  sx: {
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                  }
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseExport} color="inherit">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import Dialog */}
      <Dialog
        open={openImport}
        onClose={handleCloseImport}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: theme.shadows[10]
          }
        }}
      >
        <DialogTitle>
          <Typography variant="h6" component="div" fontWeight={600}>
            Import Licenses
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
            {importSteps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {success}
            </Alert>
          )}

          {activeStep === 0 && (
            <Box>
              <Typography variant="body1" gutterBottom>
                Paste the license data in JSON format below.
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                This should be data previously exported from the License Admin Panel.
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  License Data (JSON format)
                </Typography>
                <Tooltip title="Clear data">
                  <IconButton onClick={handleClearImportData} size="small">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              
              <TextField
                multiline
                fullWidth
                rows={12}
                value={importData}
                onChange={handleImportDataChange}
                variant="outlined"
                placeholder='[{"licenseId": "LICENSE-001", "expiryDate": "2023-12-31"}, ...]'
                InputProps={{
                  sx: {
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                  }
                }}
              />
            </Box>
          )}

          {activeStep === 1 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Zoom in={true}>
                <CheckCircleIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
              </Zoom>
              <Typography variant="h6" gutterBottom>
                Data Validation Successful
              </Typography>
              <Typography variant="body1" paragraph>
                Your license data is valid and ready to be imported.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Click "Import Licenses" to continue or "Back" to make changes.
              </Typography>
            </Box>
          )}

          {activeStep === 2 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Fade in={true}>
                <>
                  <CheckCircleIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Import Complete
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {importedCount} license{importedCount !== 1 ? 's' : ''} imported successfully.
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    You can now close this dialog to view the updated license list.
                  </Typography>
                </>
              </Fade>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          {activeStep > 0 && activeStep < 2 && (
            <Button onClick={() => setActiveStep(prevStep => prevStep - 1)} color="inherit">
              Back
            </Button>
          )}
          <Box sx={{ flexGrow: 1 }} />
          <Button onClick={handleCloseImport} color="inherit">
            {activeStep === 2 ? 'Close' : 'Cancel'}
          </Button>
          {activeStep < 2 && (
            <Button
              onClick={handleImport}
              variant="contained"
              color="primary"
              disabled={loading || (activeStep === 0 && !importData.trim())}
              startIcon={loading && <CircularProgress size={16} color="inherit" />}
            >
              {loading
                ? 'Processing...'
                : activeStep === 0
                ? 'Validate Data'
                : 'Import Licenses'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default LicenseImportExport; 