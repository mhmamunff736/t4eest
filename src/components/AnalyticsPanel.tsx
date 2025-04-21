import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  CircularProgress,
  Tabs,
  Tab,
  useTheme,
  Divider,
  Paper,
  alpha
} from '@mui/material';
import { getLicenseAnalytics } from '../firebase/licenseService';
import { LicenseAnalytics } from '../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const AnalyticsPanel = () => {
  const theme = useTheme();
  const [analytics, setAnalytics] = useState<LicenseAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const data = await getLicenseAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Function to calculate the width of the progress bar based on percentage
  const getProgressWidth = (percentage: number) => {
    return `${Math.min(percentage, 100)}%`;
  };

  // Get sorted months for expiry chart
  const getSortedMonths = () => {
    if (!analytics?.expiryByMonth) return [];
    
    return Object.entries(analytics.expiryByMonth)
      .sort(([monthA], [monthB]) => monthA.localeCompare(monthB))
      .map(([month, count]) => {
        // Format month from YYYY-MM to Month YYYY
        const [year, monthNum] = month.split('-');
        const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
        return {
          month: date.toLocaleDateString('default', { month: 'short', year: 'numeric' }),
          count,
          rawMonth: month
        };
      });
  };
  
  // Get max count for scaling the chart bars
  const getMaxMonthlyCount = () => {
    if (!analytics?.expiryByMonth) return 1;
    return Math.max(...Object.values(analytics.expiryByMonth), 1);
  };

  return (
    <Card
      sx={{
        borderRadius: 2,
        boxShadow: theme.shadows[3],
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box
        sx={{
          p: 2,
          borderBottom: `1px solid ${theme.palette.divider}`
        }}
      >
        <Typography variant="h6" fontWeight={600}>
          License Analytics
        </Typography>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              py: 1.5
            }
          }}
        >
          <Tab label="Overview" id="analytics-tab-0" />
          <Tab label="Expiration Forecast" id="analytics-tab-1" />
        </Tabs>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                    border: '1px solid',
                    borderColor: alpha(theme.palette.primary.main, 0.1)
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    License Status
                  </Typography>
                  <Box sx={{ mb: 3, mt: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" fontWeight={500}>
                        Active Licenses
                      </Typography>
                      <Typography variant="body2" color="success.main" fontWeight={600}>
                        {analytics?.activeCount || 0} ({Math.round(analytics?.activePercentage || 0)}%)
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: alpha(theme.palette.success.main, 0.2),
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          height: '100%',
                          bgcolor: theme.palette.success.main,
                          width: getProgressWidth(analytics?.activePercentage || 0),
                          borderRadius: 4,
                          transition: 'width 1s ease-in-out'
                        }}
                      />
                    </Box>
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" fontWeight={500}>
                        Expired Licenses
                      </Typography>
                      <Typography variant="body2" color="error.main" fontWeight={600}>
                        {analytics?.expiredCount || 0} ({Math.round(analytics?.expiredPercentage || 0)}%)
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: alpha(theme.palette.error.main, 0.2),
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          height: '100%',
                          bgcolor: theme.palette.error.main,
                          width: getProgressWidth(analytics?.expiredPercentage || 0),
                          borderRadius: 4,
                          transition: 'width 1s ease-in-out'
                        }}
                      />
                    </Box>
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.warning.main, 0.05),
                    border: '1px solid',
                    borderColor: alpha(theme.palette.warning.main, 0.1),
                    height: '100%'
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    Expiration Alerts
                  </Typography>
                  <Box sx={{ mt: 3 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center', p: 2 }}>
                          <Typography
                            variant="h4"
                            color="warning.main"
                            fontWeight={600}
                            gutterBottom
                          >
                            {analytics?.expiringIn30Days || 0}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Expiring in 30 days
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center', p: 2 }}>
                          <Typography
                            variant="h4"
                            color="info.main"
                            fontWeight={600}
                            gutterBottom
                          >
                            {analytics?.expiringIn90Days || 0}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Expiring in 90 days
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box>
              <Typography variant="h6" gutterBottom>
                License Expiration by Month
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Number of licenses set to expire in each of the next 12 months
              </Typography>

              <Box sx={{ mt: 4 }}>
                {getSortedMonths().length === 0 ? (
                  <Typography color="text.secondary" textAlign="center">
                    No expiration data available
                  </Typography>
                ) : (
                  <Box sx={{ height: 250, overflowX: 'auto', px: 2 }}>
                    <Box sx={{ display: 'flex', height: '100%', minWidth: Math.max(500, getSortedMonths().length * 80) }}>
                      {getSortedMonths().map((item) => {
                        const percentage = (item.count / getMaxMonthlyCount()) * 100;
                        const height = `${Math.max(percentage, 5)}%`;
                        const isCurrentMonth = new Date().toISOString().slice(0, 7) === item.rawMonth;
                        
                        return (
                          <Box
                            key={item.rawMonth}
                            sx={{
                              flex: 1,
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'flex-end',
                              p: 1
                            }}
                          >
                            <Box
                              sx={{
                                width: '70%',
                                height,
                                bgcolor: isCurrentMonth 
                                  ? theme.palette.warning.main 
                                  : theme.palette.primary.main,
                                borderRadius: '4px 4px 0 0',
                                transition: 'height 1s ease-in-out',
                                position: 'relative',
                                '&:hover': {
                                  opacity: 0.9,
                                }
                              }}
                            >
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: -25,
                                  left: '50%',
                                  transform: 'translateX(-50%)',
                                  bgcolor: isCurrentMonth 
                                    ? theme.palette.warning.dark 
                                    : theme.palette.primary.dark,
                                  color: '#fff',
                                  py: 0.5,
                                  px: 1,
                                  borderRadius: 1,
                                  fontSize: '0.75rem',
                                  fontWeight: 'bold',
                                  visibility: item.count > 0 ? 'visible' : 'hidden'
                                }}
                              >
                                {item.count}
                              </Box>
                            </Box>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ mt: 1, fontSize: '0.7rem', textAlign: 'center' }}
                            >
                              {item.month}
                            </Typography>
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          </TabPanel>
        </>
      )}
    </Card>
  );
};

export default AnalyticsPanel; 