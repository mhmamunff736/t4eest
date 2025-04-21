import { useState, useMemo, useEffect } from 'react';
import { 
  Container, 
  CssBaseline, 
  ThemeProvider, 
  createTheme,
  Box, 
  Typography,
  Stack,
  Chip,
  Divider,
  Tabs,
  Tab,
  useMediaQuery,
  Fade,
  CircularProgress,
  Backdrop
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import DashboardIcon from '@mui/icons-material/Dashboard';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import EqualizerIcon from '@mui/icons-material/Equalizer';
import Header from './components/Header';
import AddLicenseForm from './components/AddLicenseForm';
import LicenseTable from './components/LicenseTable';
import EnhancedDashboard from './components/EnhancedDashboard';
import AnalyticsPanel from './components/AnalyticsPanel';
import ActivityLogPanel from './components/ActivityLogPanel';
import { AuthProvider } from './contexts/AuthContext';
import { UserProfileProvider } from './contexts/UserProfileContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
      style={{ minHeight: '100%' }}
    >
      {value === index && (
        <Fade in={value === index} timeout={400}>
          <Box sx={{ py: 3 }}>{children}</Box>
        </Fade>
      )}
    </div>
  );
}

function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [currentTab, setCurrentTab] = useState(0);
  const [pageLoading, setPageLoading] = useState(true);
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  // Set initial dark mode based on system preference
  useEffect(() => {
    setDarkMode(prefersDarkMode);
  }, [prefersDarkMode]);

  // Simulate page loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Create theme based on dark mode preference
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: darkMode ? 'dark' : 'light',
          primary: {
            main: darkMode ? '#90caf9' : '#1976d2',
          },
          secondary: {
            main: darkMode ? '#f48fb1' : '#dc004e',
          },
          background: {
            default: darkMode ? '#121212' : '#f5f5f5',
            paper: darkMode ? '#1e1e1e' : '#ffffff',
          },
        },
        shape: {
          borderRadius: 10,
        },
        typography: {
          fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
          h4: {
            fontWeight: 600,
          },
          h6: {
            fontWeight: 500,
          },
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 8,
                textTransform: 'none',
                fontWeight: 500,
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 12,
                boxShadow: darkMode 
                  ? '0 4px 20px rgba(0,0,0,0.4)' 
                  : '0 2px 10px rgba(0,0,0,0.1)',
              },
            },
          },
          MuiTab: {
            styleOverrides: {
              root: {
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.9rem',
              },
            },
          },
        },
      }),
    [darkMode]
  );

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(prevMode => !prevMode);
  };

  // Refresh license list
  const refreshLicenses = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  return (
    <AuthProvider>
      <UserProfileProvider>
        <ThemeProvider theme={theme}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <CssBaseline />
            
            <Backdrop
              sx={{ 
                color: '#fff', 
                zIndex: (theme) => theme.zIndex.drawer + 1,
                flexDirection: 'column',
                gap: 2
              }}
              open={pageLoading}
            >
              <CircularProgress color="inherit" size={60} />
              <Typography variant="h6">Loading License Admin Panel</Typography>
            </Backdrop>
            
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              minHeight: '100vh',
              bgcolor: theme.palette.background.default
            }}>
              <Header toggleDarkMode={toggleDarkMode} />
              
              <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: theme.palette.background.paper }}>
                <Container maxWidth="lg">
                  <Tabs 
                    value={currentTab} 
                    onChange={handleTabChange} 
                    aria-label="admin panel tabs"
                    sx={{ 
                      minHeight: 56,
                      '& .MuiTab-root': {
                        py: 2,
                        px: 3
                      }
                    }}
                  >
                    <Tab 
                      icon={<DashboardIcon />} 
                      iconPosition="start" 
                      label="Dashboard" 
                      id="tab-0" 
                    />
                    <Tab 
                      icon={<VpnKeyIcon />} 
                      iconPosition="start" 
                      label="Manage Licenses" 
                      id="tab-1" 
                    />
                    <Tab 
                      icon={<EqualizerIcon />} 
                      iconPosition="start" 
                      label="Analytics" 
                      id="tab-2" 
                    />
                  </Tabs>
                </Container>
              </Box>
              
              <Container component="main" maxWidth="lg" sx={{ mt: 2, mb: 4, flexGrow: 1 }}>
                <TabPanel value={currentTab} index={0}>
                  <EnhancedDashboard 
                    refreshTrigger={refreshTrigger} 
                    onRefresh={refreshLicenses} 
                  />
                </TabPanel>
                
                <TabPanel value={currentTab} index={1}>
                  <AddLicenseForm onSuccess={refreshLicenses} />
                  <LicenseTable refreshTrigger={refreshTrigger} />
                </TabPanel>
                
                <TabPanel value={currentTab} index={2}>
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h5" gutterBottom>License Analytics</Typography>
                    <Typography variant="body1" color="text.secondary">
                      Detailed analytics and insights about your licenses
                    </Typography>
                    <Divider sx={{ my: 3 }} />
                  </Box>
                  
                  <Box sx={{ mb: 4 }}>
                    <AnalyticsPanel />
                  </Box>
                  
                  <Box>
                    <ActivityLogPanel maxItems={15} />
                  </Box>
                </TabPanel>
              </Container>
              
              <Box 
                component="footer" 
                sx={{ 
                  py: 3, 
                  mt: 4,
                  textAlign: 'center',
                  bgcolor: 'transparent',
                }}
              >
                <Divider sx={{ mb: 3 }} />
                <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 2 }}>
                  <Chip label="v1.0.1" size="small" />
                  <Chip label="Admin Panel" size="small" variant="outlined" />
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  License Admin Panel © {new Date().getFullYear()}
                </Typography>
              </Box>
            </Box>
          </LocalizationProvider>
        </ThemeProvider>
      </UserProfileProvider>
    </AuthProvider>
  );
}

export default App;
