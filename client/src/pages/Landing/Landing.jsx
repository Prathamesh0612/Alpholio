import React from 'react';
import { 
    Box, 
    Container, 
    Typography, 
    Button, 
    Grid, 
    Card, 
    CardContent
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SecurityIcon from '@mui/icons-material/Security';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';

function Landing() {
    const navigate = useNavigate();

    const features = [
        {
            title: 'Stock Trading',
            description: 'Trade stocks with real-time market data and advanced analytics',
            icon: <TrendingUpIcon sx={{ fontSize: 40 }} />
        },
        {
            title: 'Bond Investments',
            description: 'Invest in government and corporate bonds for stable returns',
            icon: <AccountBalanceIcon sx={{ fontSize: 40 }} />
        },
        {
            title: 'Insurance Plans',
            description: 'Secure your future with comprehensive insurance options',
            icon: <SecurityIcon sx={{ fontSize: 40 }} />
        }
    ];

    return (
        <Box>
            {/* Hero Section */}
            <Box 
                sx={{ 
                    bgcolor: 'primary.main',
                    color: 'white',
                    py: 8
                }}
            >
                <Container maxWidth="lg">
                    <Grid container spacing={4} alignItems="center">
                        <Grid item xs={12} md={6}>
                            <Typography variant="h2" component="h1" gutterBottom>
                                Welcome to Alpholio
                            </Typography>
                            <Typography variant="h5" paragraph>
                                Your All-in-One Investment Platform
                            </Typography>
                            <Typography variant="body1" paragraph>
                                Manage your investments in stocks, bonds, and insurance all in one place.
                                Get personalized recommendations and track your portfolio growth.
                            </Typography>
                            <Box sx={{ mt: 4 }}>
                                <Button 
                                    variant="contained" 
                                    color="secondary" 
                                    size="large"
                                    onClick={() => navigate('/register')}
                                    sx={{ mr: 2 }}
                                >
                                    Get Started
                                </Button>
                                <Button 
                                    variant="outlined" 
                                    color="inherit"
                                    size="large"
                                    onClick={() => navigate('/login')}
                                >
                                    Sign In
                                </Button>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            {/* You can add an illustration or image here */}
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* Features Section */}
            <Container maxWidth="lg" sx={{ py: 8 }}>
                <Typography variant="h3" component="h2" align="center" gutterBottom>
                    Our Features
                </Typography>
                <Grid container spacing={4} sx={{ mt: 4 }}>
                    {features.map((feature, index) => (
                        <Grid item xs={12} md={4} key={index}>
                            <Card 
                                sx={{ 
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    textAlign: 'center',
                                    p: 2
                                }}
                            >
                                <Box sx={{ color: 'primary.main', mb: 2 }}>
                                    {feature.icon}
                                </Box>
                                <CardContent>
                                    <Typography variant="h5" component="h3" gutterBottom>
                                        {feature.title}
                                    </Typography>
                                    <Typography variant="body1" color="text.secondary">
                                        {feature.description}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Container>

            {/* Call to Action Section */}
            <Box sx={{ bgcolor: 'grey.100', py: 8 }}>
                <Container maxWidth="md">
                    <Typography variant="h4" align="center" gutterBottom>
                        Ready to Start Investing?
                    </Typography>
                    <Typography variant="body1" align="center" paragraph>
                        Join thousands of investors who trust Alpholio for their investment needs.
                    </Typography>
                    <Box sx={{ textAlign: 'center', mt: 4 }}>
                        <Button 
                            variant="contained" 
                            color="primary" 
                            size="large"
                            onClick={() => navigate('/register')}
                        >
                            Create Your Account
                        </Button>
                    </Box>
                </Container>
            </Box>
        </Box>
    );
}

export default Landing; 