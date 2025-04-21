import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Divider,
  Chip,
  useTheme,
  Paper,
  alpha,
  Fade,
  CircularProgress
} from '@mui/material';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AnalyticsPanel from './AnalyticsPanel';
import ActivityLogPanel from './ActivityLogPanel';
import LicenseImportExport from './LicenseImportExport';
import { getLicenses, getActivityLogs, getLicenseAnalytics } from '../firebase/licenseService';
import { License, ActivityLog, DashboardStats } from '../types';

interface EnhancedDashboardProps {
  refreshTrigger: number;
  onRefresh: () => void;
}

const EnhancedDashboard = ({ refreshTrigger, onRefresh }: EnhancedDashboardProps) => {
  const theme = useTheme();
  const [stats, setStats] = useState<DashboardStats>({
    totalLicenses: 0,
    activeLicenses: 0,
    expiredLicenses: 0,
    expiringLicenses: 0,
  });
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [refreshTrigger]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch licenses
      const licenses = await getLicenses();
      
      // Calculate stats
      const activeCount = licenses.filter(license => license.status === 'Active').length;
      const expiredCount = licenses.filter(license => license.status === 'Expired').length;
      
      // Calculate expiring soon
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);
      
      const expiringCount = licenses.filter(license => {
        if (license.status === 'Expired') return false;
        const expiryDate = new Date(license.expiryDate);
        return expiryDate <= thirtyDaysFromNow && expiryDate >= today;
      }).length;
      
      // Get recent activity
      const activity = await getActivityLogs(5);
      
      // Get analytics data
      const analyticsData = await getLicenseAnalytics();
      
      setStats({
        totalLicenses: licenses.length,
        activeLicenses: activeCount,
        expiredLicenses: expiredCount,
        expiringLicenses: expiringCount,
        recentActivity: activity,
        analyticsData
      });
      
      setRecentActivity(activity);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Fade in={true} timeout={800}>
      <Box>
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 3,
            backgroundColor: theme.palette.background.paper,
            backgroundImage: theme.palette.mode === 'dark'
              ? 'linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))'
              : 'linear-gradient(rgba(0, 0, 0, 0.02), rgba(0, 0, 0, 0.02))',
            mb: 4
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                License Management System
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Manage license IDs, track expiry dates, and maintain your software licensing
              </Typography>
            </Box>
            <LicenseImportExport onComplete={onRefresh} />
          </Box>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" sx={{ mb: 2 }}>
            License Overview
          </Typography>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.3s ease-in-out',
                    borderRadius: 2,
                    boxShadow: theme.shadows[3],
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: theme.shadows[6],
                    }
                  }}
                >
                  <CardContent>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      sx={{ mb: 2 }}
                    >
                      <VpnKeyIcon color="primary" fontSize="large" />
                      <Typography color="text.secondary" variant="subtitle2">
                        TOTAL LICENSES
                      </Typography>
                    </Stack>
                    <Typography variant="h4" component="div">
                      {stats.totalLicenses}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.3s ease-in-out',
                    borderRadius: 2,
                    boxShadow: theme.shadows[3],
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: theme.shadows[6],
                      bgcolor: alpha(theme.palette.success.main, 0.05)
                    }
                  }}
                >
                  <CardContent>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      sx={{ mb: 2 }}
                    >
                      <AssignmentTurnedInIcon color="success" fontSize="large" />
                      <Typography color="text.secondary" variant="subtitle2">
                        ACTIVE LICENSES
                      </Typography>
                    </Stack>
                    <Typography variant="h4" component="div" color="success.main">
                      {stats.activeLicenses}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {stats.totalLicenses > 0
                        ? `${Math.round((stats.activeLicenses / stats.totalLicenses) * 100)}% of total`
                        : '0% of total'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.3s ease-in-out',
                    borderRadius: 2,
                    boxShadow: theme.shadows[3],
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: theme.shadows[6],
                      bgcolor: alpha(theme.palette.warning.main, 0.05)
                    }
                  }}
                >
                  <CardContent>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      sx={{ mb: 2 }}
                    >
                      <WarningAmberIcon color="warning" fontSize="large" />
                      <Typography color="text.secondary" variant="subtitle2">
                        EXPIRING SOON
                      </Typography>
                    </Stack>
                    <Typography variant="h4" component="div" color="warning.main">
                      {stats.expiringLicenses}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Expires within 30 days
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.3s ease-in-out',
                    borderRadius: 2,
                    boxShadow: theme.shadows[3],
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: theme.shadows[6],
                      bgcolor: alpha(theme.palette.error.main, 0.05)
                    }
                  }}
                >
                  <CardContent>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      sx={{ mb: 2 }}
                    >
                      <ErrorOutlineIcon color="error" fontSize="large" />
                      <Typography color="text.secondary" variant="subtitle2">
                        EXPIRED LICENSES
                      </Typography>
                    </Stack>
                    <Typography variant="h4" component="div" color="error.main">
                      {stats.expiredLicenses}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {stats.totalLicenses > 0
                        ? `${Math.round((stats.expiredLicenses / stats.totalLicenses) * 100)}% of total`
                        : '0% of total'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </Paper>

        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <AnalyticsPanel />
          </Grid>
          <Grid item xs={12} md={4}>
            <ActivityLogPanel maxItems={8} />
          </Grid>
        </Grid>
      </Box>
    </Fade>
  );
};

export default EnhancedDashboard; 