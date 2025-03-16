import React, { useState, useEffect } from 'react';
import { 
    AppBar, 
    Toolbar, 
    Typography, 
    Button, 
    Avatar, 
    Box, 
    Menu, 
    MenuItem, 
    ListItemIcon, 
    Divider,
    IconButton
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import RecommendIcon from '@mui/icons-material/Recommend';
import HistoryIcon from '@mui/icons-material/History';
import LogoutIcon from '@mui/icons-material/Logout';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

function Navbar() {
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState(null);
    const [userName, setUserName] = useState('User');
    const open = Boolean(anchorEl);

    useEffect(() => {
        // Get user data from localStorage or API
        const user = JSON.parse(localStorage.getItem('user')) || {};
        if (user.name) {
            setUserName(user.name);
        }
    }, []);

    const handleProfileClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleOrderHistory = () => {
        handleClose();
        navigate('/order-history');
    };

    const handleLogout = async () => {
        handleClose();
        await authService.logout();
        navigate('/login');
    };

    return (
        <AppBar position="static">
            <Toolbar>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                    Alpholio
                </Typography>
                <Button 
                    color="inherit" 
                    onClick={() => navigate('/dashboard')}
                    sx={{ mr: 1 }}
                >
                    Dashboard
                </Button>
                <Button 
                    color="inherit" 
                    onClick={() => navigate('/portfolio')}
                    sx={{ mr: 1 }}
                >
                    Portfolio
                </Button>
                <Button 
                    color="inherit" 
                    onClick={() => navigate('/suggestions')}
                    sx={{ mr: 1 }}
                    startIcon={<RecommendIcon />}
                >
                    Suggestions
                </Button>
                
                {/* User Profile Button */}
                <Box 
                    sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        cursor: 'pointer',
                        ml: 2,
                        border: '1px solid rgba(255,255,255,0.3)',
                        borderRadius: '24px',
                        padding: '4px 12px',
                        '&:hover': {
                            backgroundColor: 'rgba(255,255,255,0.1)'
                        }
                    }}
                    onClick={handleProfileClick}
                >
                    <Avatar 
                        sx={{ 
                            width: 32, 
                            height: 32, 
                            bgcolor: 'primary.dark',
                            mr: 1
                        }}
                    >
                        {userName.charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography variant="body2" sx={{ mr: 0.5 }}>
                        {userName}
                    </Typography>
                    <KeyboardArrowDownIcon fontSize="small" />
                </Box>
                
                {/* Profile Dropdown Menu */}
                <Menu
                    anchorEl={anchorEl}
                    open={open}
                    onClose={handleClose}
                    onClick={handleClose}
                    PaperProps={{
                        elevation: 3,
                        sx: {
                            overflow: 'visible',
                            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.15))',
                            mt: 1.5,
                            width: 200,
                            '& .MuiAvatar-root': {
                                width: 32,
                                height: 32,
                                ml: -0.5,
                                mr: 1,
                            }
                        },
                    }}
                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                    <MenuItem onClick={handleOrderHistory}>
                        <ListItemIcon>
                            <HistoryIcon fontSize="small" />
                        </ListItemIcon>
                        Order History
                    </MenuItem>
                    <Divider />
                    <MenuItem onClick={handleLogout}>
                        <ListItemIcon>
                            <LogoutIcon fontSize="small" color="error" />
                        </ListItemIcon>
                        <Typography color="error">Logout</Typography>
                    </MenuItem>
                </Menu>
            </Toolbar>
        </AppBar>
    );
}

export default Navbar; 