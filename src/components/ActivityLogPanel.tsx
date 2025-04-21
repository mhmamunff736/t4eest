import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  Divider, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon, 
  IconButton, 
  Tooltip, 
  Chip,
  CircularProgress,
  useTheme,
  alpha
} from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import HistoryIcon from '@mui/icons-material/History';
import RefreshIcon from '@mui/icons-material/Refresh';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import { getActivityLogs } from '../firebase/licenseService';
import { ActivityLog } from '../types';

interface ActivityLogPanelProps {
  maxItems?: number;
}

const ActivityLogPanel = ({ maxItems = 10 }: ActivityLogPanelProps) => {
  const theme = useTheme();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivityLogs();
  }, [maxItems]);

  const fetchActivityLogs = async () => {
    setLoading(true);
    try {
      const activityLogs = await getActivityLogs(maxItems);
      setLogs(activityLogs);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create':
        return <AddCircleIcon color="success" />;
      case 'update':
        return <EditIcon color="primary" />;
      case 'delete':
        return <DeleteIcon color="error" />;
      case 'import':
      case 'export':
        return <PlaylistAddCheckIcon color="info" />;
      default:
        return <HistoryIcon color="action" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create':
        return 'success';
      case 'update':
        return 'primary';
      case 'delete':
        return 'error';
      case 'import':
      case 'export':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <Card 
      sx={{ 
        height: '100%',
        display: 'flex', 
        flexDirection: 'column',
        border: '1px solid',
        borderColor: theme.palette.mode === 'dark' 
          ? alpha(theme.palette.divider, 0.3)
          : theme.palette.divider,
        borderRadius: 2,
        boxShadow: theme.shadows[3]
      }}
    >
      <Box
        sx={{
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HistoryIcon color="primary" />
          <Typography variant="h6">Activity Log</Typography>
        </Box>
        <Tooltip title="Refresh activity logs">
          <IconButton 
            size="small" 
            onClick={fetchActivityLogs}
            sx={{ 
              transition: 'transform 0.3s ease',
              '&:hover': { transform: 'rotate(180deg)' }
            }}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>
      
      <Divider />
      
      {loading ? (
        <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress size={30} />
        </Box>
      ) : logs.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">No recent activity</Typography>
        </Box>
      ) : (
        <List sx={{ flexGrow: 1, overflow: 'auto', p: 0 }}>
          {logs.map((log, index) => (
            <Box key={log.id || index}>
              <ListItem
                sx={{
                  py: 1.5,
                  px: 2,
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' 
                      ? alpha(theme.palette.primary.main, 0.1)
                      : alpha(theme.palette.primary.main, 0.05)
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {getActionIcon(log.action)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="body1" fontWeight={500}>
                        {log.licenseId}
                      </Typography>
                      <Chip 
                        label={log.action} 
                        size="small" 
                        color={getActionColor(log.action) as any}
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {log.details}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatTimestamp(log.timestamp)}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
              {index < logs.length - 1 && <Divider variant="inset" component="li" />}
            </Box>
          ))}
        </List>
      )}
    </Card>
  );
};

export default ActivityLogPanel; 