import { AppBar, Box, IconButton, Toolbar, Typography, useTheme, Button, Avatar, Tooltip, Badge } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import DashboardIcon from '@mui/icons-material/Dashboard';

interface HeaderProps {
  toggleDarkMode: () => void;
}

const Header = ({ toggleDarkMode }: HeaderProps) => {
  const theme = useTheme();
  
  return (
    <AppBar 
      position="sticky" 
      color="primary" 
      elevation={4}
      sx={{
        backdropFilter: 'blur(8px)',
        backgroundColor: theme.palette.mode === 'dark' 
          ? 'rgba(18, 18, 18, 0.9)' 
          : 'rgba(255, 255, 255, 0.9)',
      }}
    >
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <AdminPanelSettingsIcon sx={{ mr: 1.5, fontSize: 28 }} />
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            License Admin
          </Typography>
        </Box>
        
        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
          <Button 
            startIcon={<DashboardIcon />} 
            sx={{ mx: 1, color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.9)' : 'inherit' }}
          >
            Dashboard
          </Button>
          <Button 
            sx={{ mx: 1, color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.9)' : 'inherit' }}
          >
            Licenses
          </Button>
          <Button 
            sx={{ mx: 1, color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.9)' : 'inherit' }}
          >
            Analytics
          </Button>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title="Notifications">
            <IconButton color="inherit" sx={{ ml: 1 }}>
              <Badge badgeContent={3} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Settings">
            <IconButton color="inherit" sx={{ ml: 1 }}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title={theme.palette.mode === 'dark' ? 'Light Mode' : 'Dark Mode'}>
            <IconButton onClick={toggleDarkMode} color="inherit" sx={{ ml: 1 }}>
              {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Admin Profile">
            <Avatar 
              sx={{ 
                ml: 2, 
                width: 38, 
                height: 38, 
                bgcolor: theme.palette.primary.main,
                cursor: 'pointer',
                transition: 'transform 0.2s ease-in-out',
                '&:hover': {
                  transform: 'scale(1.1)',
                  boxShadow: '0 0 10px rgba(0,0,0,0.2)'
                }
              }}
            >
              A
            </Avatar>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header; 