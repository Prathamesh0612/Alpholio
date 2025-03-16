import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Button,
    Chip,
    Rating,
    Divider,
    CircularProgress,
    Alert
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SecurityIcon from '@mui/icons-material/Security';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import { suggestionService } from '../../services/suggestionService';

function Suggestions() {
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchSuggestions = async () => {
        try {
            setLoading(true);
            const response = await suggestionService.getSuggestions();
            setSuggestions(response.data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const generateNewSuggestions = async () => {
        try {
            setLoading(true);
            await suggestionService.generateSuggestions();
            await fetchSuggestions();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const updateSuggestionStatus = async (id, status) => {
        try {
            await suggestionService.updateSuggestionStatus(id, status);
            setSuggestions(suggestions.map(suggestion => 
                suggestion._id === id ? { ...suggestion, status } : suggestion
            ));
        } catch (err) {
            setError(err.message);
        }
    };

    useEffect(() => {
        fetchSuggestions();
    }, []);

    const getIcon = (type) => {
        switch (type) {
            case 'stock':
                return <TrendingUpIcon />;
            case 'bond':
                return <AccountBalanceIcon />;
            case 'insurance':
                return <SecurityIcon />;
            default:
                return null;
        }
    };

    const getRiskColor = (level) => {
        switch (level.toLowerCase()) {
            case 'low':
                return 'success';
            case 'medium':
                return 'warning';
            case 'high':
                return 'error';
            default:
                return 'default';
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">
                    Investment Suggestions
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<RefreshIcon />}
                    onClick={generateNewSuggestions}
                >
                    Generate New Suggestions
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            <Box sx={{ mb: 3 }}>
                <Typography variant="body1" color="text.secondary">
                    Personalized investment recommendations based on your profile and market analysis.
                </Typography>
            </Box>

            <Grid container spacing={3}>
                {suggestions.map((item) => (
                    <Grid item xs={12} md={4} key={item._id}>
                        <Card 
                            sx={{ 
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                '&:hover': {
                                    boxShadow: 6
                                }
                            }}
                        >
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    {getIcon(item.type)}
                                    <Typography 
                                        variant="h6" 
                                        component="div" 
                                        sx={{ ml: 1 }}
                                    >
                                        {item.symbol}
                                    </Typography>
                                </Box>

                                <Box sx={{ mb: 2 }}>
                                    <Chip 
                                        label={`Risk: ${item.riskLevel}`}
                                        color={getRiskColor(item.riskLevel)}
                                        size="small"
                                        sx={{ mr: 1 }}
                                    />
                                    <Chip 
                                        label={`Return: ${item.potentialReturn}%`}
                                        color="primary"
                                        size="small"
                                    />
                                </Box>

                                <Typography variant="body2" sx={{ mb: 2 }}>
                                    {item.reason}
                                </Typography>

                                <Typography variant="body2" color="text.secondary">
                                    Suggested Allocation: {item.suggestedAllocation}%
                                </Typography>

                                <Divider sx={{ my: 2 }} />

                                {item.status === 'pending' ? (
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Button
                                            variant="contained"
                                            color="success"
                                            startIcon={<CheckIcon />}
                                            onClick={() => updateSuggestionStatus(item._id, 'accepted')}
                                            fullWidth
                                        >
                                            Accept
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            color="error"
                                            startIcon={<CloseIcon />}
                                            onClick={() => updateSuggestionStatus(item._id, 'rejected')}
                                            fullWidth
                                        >
                                            Reject
                                        </Button>
                                    </Box>
                                ) : (
                                    <Chip 
                                        label={item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                        color={item.status === 'accepted' ? 'success' : 'error'}
                                        sx={{ width: '100%' }}
                                    />
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}

export default Suggestions; 