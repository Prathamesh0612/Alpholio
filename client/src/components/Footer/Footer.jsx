import React from 'react';
import {
    Box,
    Container,
    Grid,
    Typography,
    Link,
    Divider,
    IconButton,
    Stack
} from '@mui/material';
import {
    Facebook as FacebookIcon,
    Twitter as TwitterIcon,
    LinkedIn as LinkedInIcon,
    YouTube as YouTubeIcon,
    Phone as PhoneIcon,
    Email as EmailIcon,
    LocationOn as LocationIcon
} from '@mui/icons-material';

function Footer() {
    const quickLinks = [
        { name: 'About Us', href: '/about' },
        { name: 'Products', href: '/products' },
        { name: 'Pricing', href: '/pricing' },
        { name: 'Contact Us', href: '/contact' }
    ];

    const marketLinks = [
        { name: 'Stock Market', href: '/stocks' },
        { name: 'Mutual Funds', href: '/mutual-funds' },
        { name: 'IPO', href: '/ipo' },
        { name: 'Market News', href: '/news' }
    ];

    const legalLinks = [
        { name: 'Privacy Policy', href: '/privacy' },
        { name: 'Terms & Conditions', href: '/terms' },
        { name: 'Disclaimer', href: '/disclaimer' },
        { name: 'Compliance', href: '/compliance' }
    ];

    return (
        <Box
            component="footer"
            sx={{
                bgcolor: 'primary.main',
                color: 'white',
                py: 6,
                mt: 'auto'
            }}
        >
            <Container maxWidth="lg">
                <Grid container spacing={4}>
                    {/* Company Info */}
                    <Grid item xs={12} md={3}>
                        <Typography variant="h6" gutterBottom>
                            Alpholio
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 2 }}>
                            Your trusted partner in financial growth and investment solutions.
                        </Typography>
                        <Stack direction="row" spacing={1}>
                            <IconButton size="small" sx={{ color: 'white' }}>
                                <FacebookIcon />
                            </IconButton>
                            <IconButton size="small" sx={{ color: 'white' }}>
                                <TwitterIcon />
                            </IconButton>
                            <IconButton size="small" sx={{ color: 'white' }}>
                                <LinkedInIcon />
                            </IconButton>
                            <IconButton size="small" sx={{ color: 'white' }}>
                                <YouTubeIcon />
                            </IconButton>
                        </Stack>
                    </Grid>

                    {/* Quick Links */}
                    <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="h6" gutterBottom>
                            Quick Links
                        </Typography>
                        {quickLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                color="inherit"
                                display="block"
                                sx={{ mb: 1, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </Grid>

                    {/* Market Links */}
                    <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="h6" gutterBottom>
                            Markets
                        </Typography>
                        {marketLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                color="inherit"
                                display="block"
                                sx={{ mb: 1, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </Grid>

                    {/* Contact Info */}
                    <Grid item xs={12} md={3}>
                        <Typography variant="h6" gutterBottom>
                            Contact Us
                        </Typography>
                        <Stack spacing={2}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <PhoneIcon fontSize="small" />
                                <Typography variant="body2">+1 (555) 123-4567</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <EmailIcon fontSize="small" />
                                <Typography variant="body2">support@alpholio.com</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <LocationIcon fontSize="small" />
                                <Typography variant="body2">
                                    123 Trading Street, Financial District
                                </Typography>
                            </Box>
                        </Stack>
                    </Grid>
                </Grid>

                <Divider sx={{ my: 4, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

                {/* Bottom Section */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ mb: { xs: 2, md: 0 } }}>
                        © {new Date().getFullYear()} Alpholio. All rights reserved.
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 3 }}>
                        {legalLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                color="inherit"
                                variant="body2"
                                sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </Box>
                </Box>
            </Container>
        </Box>
    );
}

export default Footer; 