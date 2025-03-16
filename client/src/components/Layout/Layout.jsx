import React from 'react';
import { Box } from '@mui/material';
import Navbar from '../Navbar/Navbar';
import Watchlist from '../Watchlist/Watchlist';
import Footer from '../Footer/Footer';

function Layout({ children }) {
    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <Watchlist />
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Navbar />
                <Box component="main" sx={{ flex: 1, p: 3 }}>
                    {children}
                </Box>
                <Footer />
            </Box>
        </Box>
    );
}

export default Layout; 