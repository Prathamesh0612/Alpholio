import React, { useState, useEffect, useCallback } from 'react';

import {
    Box,
    Paper,
    TextField,
    List,
    ListItem,
    ListItemText,
    IconButton,
    Typography,
    Divider,
    Dialog,
    CircularProgress,
    Button,
    DialogTitle,
    DialogContent,
    DialogActions,
    ButtonGroup,
    InputAdornment as MuiInputAdornment,
    Tooltip,
    Snackbar,
    Alert,
    Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import InputAdornment from '@mui/material/InputAdornment';
import StockChart from '../StockChart/StockChart.jsx';
import axios from 'axios';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { walletService } from '../../services/walletService';

// Configure axios defaults
axios.defaults.baseURL = 'http://localhost:5000';

// Extended list of Indian stocks
const defaultWatchlist = [
    { id: 1, symbol: 'RELIANCE.BSE', name: 'Reliance Industries Ltd.' },
    { id: 2, symbol: 'TCS.BSE', name: 'Tata Consultancy Services Ltd.' },
    { id: 3, symbol: 'HDFCBANK.BSE', name: 'HDFC Bank Ltd.' },
    { id: 4, symbol: 'INFY.BSE', name: 'Infosys Ltd.' },
    { id: 5, symbol: 'ICICIBANK.BSE', name: 'ICICI Bank Ltd.' },
    { id: 6, symbol: 'HINDUNILVR.BSE', name: 'Hindustan Unilever Ltd.' },
    { id: 7, symbol: 'SBIN.BSE', name: 'State Bank of India' },
    { id: 8, symbol: 'BHARTIARTL.BSE', name: 'Bharti Airtel Ltd.' },
    { id: 9, symbol: 'ITC.BSE', name: 'ITC Ltd.' },
    { id: 10, symbol: 'KOTAKBANK.BSE', name: 'Kotak Mahindra Bank Ltd.' },
    { id: 11, symbol: 'WIPRO.BSE', name: 'Wipro Ltd.' },
    { id: 12, symbol: 'AXISBANK.BSE', name: 'Axis Bank Ltd.' },
    { id: 13, symbol: 'MARUTI.BSE', name: 'Maruti Suzuki India Ltd.' },
    { id: 14, symbol: 'LT.BSE', name: 'Larsen & Toubro Ltd.' },
    { id: 15, symbol: 'ASIANPAINT.BSE', name: 'Asian Paints Ltd.' }
];

function Watchlist() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStock, setSelectedStock] = useState(null);
    const [isChartOpen, setIsChartOpen] = useState(false);
    const [watchlist] = useState(defaultWatchlist);
    const [stockData, setStockData] = useState({});
    const [loading, setLoading] = useState(false);
    const [isTradingOpen, setIsTradingOpen] = useState(false);
    const [selectedTradeStock, setSelectedTradeStock] = useState(null);
    const [tradeQuantity, setTradeQuantity] = useState(1);
    const [walletBalance, setWalletBalance] = useState(100000);
    const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);
    const [addFundsAmount, setAddFundsAmount] = useState(10000);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [portfolio, setPortfolio] = useState({ holdings: [], transactions: [] });
    const [tradeError, setTradeError] = useState('');

    const generateRandomStockData = useCallback(() => {
        const newStockData = {};
        
        watchlist.forEach(item => {
            const symbol = item.symbol.replace('.BSE', '');
            
            // Generate a random price between 500 and 5000
            const basePrice = newStockData[symbol]?.price || (Math.random() * 4500 + 500);
            
            // Fluctuate the price by -2% to +2% from the previous price
            const randomPrice = basePrice * (0.98 + Math.random() * 0.04);
            
            // Generate a random change percentage between -5% and +5%
            const randomChange = (Math.random() * 10 - 5).toFixed(2);
            
            newStockData[symbol] = {
                price: randomPrice,
                change: parseFloat(randomChange),
                volume: Math.floor(Math.random() * 1000000)
            };
        });
        
        setStockData(newStockData);
    }, [watchlist]);

    const handleSearch = (event) => {
        setSearchTerm(event.target.value);
    };

    const handleStockClick = (stock) => {
        setSelectedStock(stock);
        setIsChartOpen(true);
    };

    const handleCloseChart = () => {
        setIsChartOpen(false);
        setSelectedStock(null);
    };

    const handleTrade = (stock) => {
        setSelectedTradeStock(stock);
        setTradeQuantity(1);
        setIsTradingOpen(true);
    };

    const handleTradeSubmit = async () => {
        try {
            setTradeError('');
            const symbol = selectedTradeStock.symbol.replace('.BSE', '');
            const price = stockData[symbol]?.price || 0;
            const totalValue = price * tradeQuantity;

            if (totalValue > walletBalance) {
                setTradeError('Insufficient funds in wallet');
                return;
            }
            
            // Call buy API
            const response = await axios.post('/api/stocks/buy', {
                symbol,
                quantity: tradeQuantity,
                price,
                name: selectedTradeStock.name
            });

            if (response.data?.success) {
                setWalletBalance(response.data.data.newBalance);
                // Update portfolio with new data
                const portfolioResponse = await axios.get('/api/user/portfolio');
                if (portfolioResponse.data?.success) {
                    setPortfolio(portfolioResponse.data.data);
                }
                
                setSnackbar({
                    open: true,
                    message: `Successfully bought ${tradeQuantity} shares of ${symbol}`,
                    severity: 'success'
                });
                setIsTradingOpen(false);
            } else {
                setTradeError(response.data?.error || 'Failed to buy stock');
            }
        } catch (error) {
            console.error('Trade operation failed:', error);
            setTradeError(error.response?.data?.error || 'Trade operation failed');
        }
    };

    const handleAddFunds = async () => {
        try {
            const newBalance = await walletService.addFunds(addFundsAmount);
            setWalletBalance(newBalance);
            setSnackbar({
                open: true,
                message: `Successfully added ₹${addFundsAmount.toLocaleString('en-IN')}`,
                severity: 'success'
            });
            setIsAddFundsOpen(false);
        } catch (error) {
            console.error('Failed to add funds:', error);
            setSnackbar({
                open: true,
                message: error.response?.data?.error || error.message || 'Failed to add funds',
                severity: 'error'
            });
        }
    };

    const filteredWatchlist = watchlist.filter(item =>
        item.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2
        }).format(price);
    };

    // Initial data fetch and periodic updates
    useEffect(() => {
        const fetchAllData = async () => {
            try {
                setLoading(true);
                
                // Update auth token
                const token = localStorage.getItem('token');
                if (!token) {
                    console.error('No authentication token found');
                    setSnackbar({
                        open: true,
                        message: 'Authentication error. Please log in again.',
                        severity: 'error'
                    });
                    setLoading(false);
                    return;
                }
                
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                
                try {
                    // Fetch wallet balance using the wallet service
                    const walletBalance = await walletService.getBalance();
                    setWalletBalance(walletBalance);
                    
                    // Fetch portfolio data
                    const portfolioResponse = await axios.get('/api/user/portfolio');

                    if (portfolioResponse.data?.success) {
                        setPortfolio(portfolioResponse.data.data);
                    } else {
                        console.error('Portfolio response not successful:', portfolioResponse.data);
                    }
                    
                } catch (apiError) {
                    console.error('API Error:', apiError);
                    
                    if (apiError.response && apiError.response.status === 401) {
                        // Handle authentication error
                        localStorage.removeItem('token');
                        setSnackbar({
                            open: true,
                            message: 'Your session has expired. Please log in again.',
                            severity: 'error'
                        });
                    }
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                setSnackbar({
                    open: true,
                    message: 'Failed to fetch data. Please try again.',
                    severity: 'error'
                });
            } finally {
                setLoading(false);
            }
        };

        // Generate initial stock data
        generateRandomStockData();
        
        // Fetch initial data
        fetchAllData();
        
        // Update stock prices every 10 seconds
        const priceInterval = setInterval(() => {
            generateRandomStockData();
        }, 10000);
        
        // Refresh portfolio data every minute
        const dataInterval = setInterval(fetchAllData, 60000);
        
        return () => {
            clearInterval(priceInterval);
            clearInterval(dataInterval);
        };
    }, [generateRandomStockData]);

    return (
        <>
            <Paper 
                elevation={3} 
                sx={{ 
                    width: '280px',
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 0,
                    borderRight: '1px solid rgba(0, 0, 0, 0.12)',
                    background: 'linear-gradient(to bottom, #ffffff, #f8f9fa)',
                    boxShadow: '0 0 15px rgba(0,0,0,0.1)',
                    position: 'relative'
                }}
            >
                <Box sx={{ p: 1.5 }}>
                    <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        mb: 1.5,
                        background: 'linear-gradient(45deg, #1a237e, #0d47a1)',
                        borderRadius: '8px',
                        p: 1.5,
                        color: 'white'
                    }}>
                        <Typography variant="h6" sx={{ 
                            fontSize: '1rem', 
                            fontWeight: 600,
                            color: 'white',
                            textShadow: '1px 1px 2px rgba(0,0,0,0.2)'
                        }}>
                            Market Watch
                        </Typography>
                        <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1,
                            background: 'rgba(255,255,255,0.1)',
                            padding: '6px 10px',
                            borderRadius: '6px'
                        }}>
                            <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="caption" sx={{ 
                                    color: 'rgba(255,255,255,0.7)',
                                    fontSize: '0.7rem'
                                }}>
                                    Wallet Balance
                                </Typography>
                                <Typography variant="subtitle2" sx={{ 
                                    color: '#fff',
                                    fontWeight: 700,
                                    fontSize: '0.9rem'
                                }}>
                                    ₹{walletBalance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                </Typography>
                            </Box>
                            <Tooltip title="Add Funds">
                                <IconButton 
                                    size="small" 
                                    sx={{ 
                                        color: 'white',
                                        padding: '4px',
                                        '&:hover': {
                                            background: 'rgba(255,255,255,0.2)'
                                        }
                                    }}
                                    onClick={() => setIsAddFundsOpen(true)}
                                >
                                    <AccountBalanceWalletIcon sx={{ fontSize: '1.2rem' }} />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </Box>

                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Search stocks..."
                        value={searchTerm}
                        onChange={handleSearch}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ 
                            mb: 2,
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '10px',
                                '&:hover fieldset': {
                                    borderColor: 'primary.main',
                                },
                            }
                        }}
                    />

                    <Divider sx={{ mb: 1 }} />
                </Box>

                <Box sx={{ 
                    flexGrow: 1, 
                    overflowY: 'auto',
                    px: 1.5,
                    pb: 1.5,
                    '&::-webkit-scrollbar': {
                        width: '0.4em'
                    },
                    '&::-webkit-scrollbar-track': {
                        background: 'transparent'
                    },
                    '&::-webkit-scrollbar-thumb': {
                        background: 'rgba(0,0,0,0.1)',
                        borderRadius: '10px'
                    },
                    '&::-webkit-scrollbar-thumb:hover': {
                        background: 'rgba(0,0,0,0.2)'
                    },
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(0,0,0,0.1) transparent'
                }}>
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                            <CircularProgress size={24} />
                        </Box>
                    ) : (
                        <List sx={{ py: 0 }}>
                            {filteredWatchlist.map((item) => {
                                const symbol = item.symbol.replace('.BSE', '');
                                const data = stockData[symbol] || {};
                                const priceChange = parseFloat(data.change || 0);
                                const holding = portfolio.holdings.find(h => h.symbol === symbol);
                                const isOwned = holding?.quantity > 0;

                                // Add proper error handling and default values
                                const price = parseFloat(data?.price) || 0;

                                // Or with more detailed checking
                                const formattedPrice = price.toFixed(2);

                                return (
                                    <ListItem
                                        key={item.id}
                                        sx={{
                                            '&:hover': {
                                                backgroundColor: 'rgba(0,0,0,0.02)',
                                                transform: 'translateY(-1px)',
                                                transition: 'all 0.2s ease'
                                            },
                                            display: 'block',
                                            py: 1.5,
                                            px: 2,
                                            borderRadius: '12px',
                                            mb: 1,
                                            border: '1px solid rgba(0,0,0,0.08)',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <Box onClick={() => handleStockClick(item)} sx={{ cursor: 'pointer', flex: 1 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                                    <Typography variant="subtitle2" sx={{ 
                                                        fontWeight: 700,
                                                        fontSize: '1rem',
                                                        color: '#1a237e'
                                                    }}>
                                                        {symbol}
                                                    </Typography>
                                                    {isOwned && (
                                                        <Tooltip title={`Avg. Price: ${formatPrice(holding.avgPrice)}`}>
                                                            <Chip 
                                                                label={`${holding.quantity}`}
                                                                size="small"
                                                                sx={{ 
                                                                    ml: 1, 
                                                                    height: 20, 
                                                                    background: 'linear-gradient(45deg, #1a237e, #0d47a1)',
                                                                    color: 'white',
                                                                    '& .MuiChip-label': { 
                                                                        px: 1, 
                                                                        fontSize: '0.75rem',
                                                                        fontWeight: 600
                                                                    } 
                                                                }}
                                                            />
                                                        </Tooltip>
                                                    )}
                                                </Box>
                                                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                                                    {item.name}
                                                </Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography variant="body2" sx={{ 
                                                        fontWeight: 600,
                                                        fontSize: '0.9rem'
                                                    }}>
                                                        {formattedPrice}
                                                    </Typography>
                                                    <Typography 
                                                        variant="caption"
                                                        sx={{ 
                                                            color: priceChange >= 0 ? 'success.main' : 'error.main',
                                                            fontWeight: 600,
                                                            background: priceChange >= 0 ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                                                            padding: '2px 8px',
                                                            borderRadius: '4px',
                                                            fontSize: '0.75rem'
                                                        }}
                                                    >
                                                        {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, ml: 2 }}>
                                                <Button 
                                                    variant="contained"
                                                    size="small"
                                                    sx={{ 
                                                        background: 'linear-gradient(45deg, #2E7D32 30%, #4CAF50 90%)',
                                                        '&:hover': {
                                                            background: 'linear-gradient(45deg, #1B5E20 30%, #388E3C 90%)',
                                                            transform: 'translateY(-1px)',
                                                            boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)'
                                                        },
                                                        transition: 'all 0.2s ease',
                                                        px: 1,
                                                        fontWeight: 700,
                                                        fontSize: '0.75rem',
                                                        minWidth: '60px'
                                                    }}
                                                    onClick={() => handleTrade(item)}
                                                >
                                                    BUY
                                                </Button>
                                            </Box>
                                        </Box>
                                    </ListItem>
                                );
                            })}
                        </List>
                    )}
                </Box>

                <Box sx={{ 
                    p: 1.5, 
                    borderTop: '1px solid rgba(0,0,0,0.08)',
                    background: 'linear-gradient(to bottom, #f8f9fa, #ffffff)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <Typography variant="caption" color="text.secondary">
                        © 2024 Alpholio
                    </Typography>
                    <Typography variant="caption" color="primary">
                        Market data refreshes every minute
                    </Typography>
                </Box>
            </Paper>

            <Dialog
                open={isChartOpen}
                onClose={handleCloseChart}
                maxWidth="md"
                fullWidth
            >
                {selectedStock && (
                    <StockChart symbol={selectedStock.symbol} />
                )}
            </Dialog>

            {/* Trading Dialog */}
            <Dialog open={isTradingOpen} onClose={() => setIsTradingOpen(false)}>
                <DialogTitle>
                    Buy {selectedTradeStock?.symbol.replace('.BSE', '')}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        <TextField
                            fullWidth
                            type="number"
                            label="Quantity"
                            value={tradeQuantity}
                            onChange={(e) => setTradeQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                            InputProps={{
                                startAdornment: (
                                    <MuiInputAdornment position="start">
                                        <IconButton size="small" onClick={() => setTradeQuantity(q => Math.max(1, q - 1))}>
                                            <RemoveIcon />
                                        </IconButton>
                                    </MuiInputAdornment>
                                ),
                                endAdornment: (
                                    <MuiInputAdornment position="end">
                                        <IconButton size="small" onClick={() => setTradeQuantity(q => q + 1)}>
                                            <AddIcon />
                                        </IconButton>
                                    </MuiInputAdornment>
                                )
                            }}
                        />
                        {selectedTradeStock && (
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Market Price: {formatPrice(stockData[selectedTradeStock.symbol.replace('.BSE', '')]?.price || 0)}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Total Value: {formatPrice((stockData[selectedTradeStock.symbol.replace('.BSE', '')]?.price || 0) * tradeQuantity)}
                                </Typography>
                                {tradeError && (
                                    <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                                        {tradeError}
                                    </Typography>
                                )}
                            </Box>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsTradingOpen(false)}>Cancel</Button>
                    <Button 
                        variant="contained"
                        color="success"
                        onClick={handleTradeSubmit}
                    >
                        Buy
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Add Funds Dialog */}
            <Dialog open={isAddFundsOpen} onClose={() => setIsAddFundsOpen(false)}>
                <DialogTitle>Add Funds to Wallet</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        <TextField
                            fullWidth
                            type="number"
                            label="Amount (₹)"
                            value={addFundsAmount}
                            onChange={(e) => setAddFundsAmount(Math.max(0, parseInt(e.target.value) || 0))}
                            InputProps={{
                                startAdornment: (
                                    <MuiInputAdornment position="start">₹</MuiInputAdornment>
                                ),
                            }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsAddFundsOpen(false)}>Cancel</Button>
                    <Button 
                        variant="contained" 
                        color="primary"
                        onClick={handleAddFunds}
                    >
                        Add Funds
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert 
                    onClose={() => setSnackbar({ ...snackbar, open: false })} 
                    severity={snackbar.severity}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
}

export default Watchlist;
