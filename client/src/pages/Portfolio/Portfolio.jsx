import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Typography, 
    Paper, 
    List, 
    ListItem, 
    ListItemText, 
    Divider,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    CircularProgress,
    Alert,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    InputAdornment as MuiInputAdornment,
    IconButton,
    Snackbar
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid'; // Import UUID for generating unique transaction IDs

// Database service for portfolio management
const portfolioDbService = {
  // Get user portfolio from database
  getUserPortfolio: async (userId) => {
    try {
      // In a real app, this would be an API call to your database
      const response = await axios.get(`/api/portfolio/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching portfolio from database:', error);
      return null;
    }
  },
  
  // Update user portfolio in database
  updateUserPortfolio: async (userId, portfolioData) => {
    try {
      // In a real app, this would be an API call to your database
      const response = await axios.put(`/api/portfolio/${userId}`, portfolioData);
      return response.data;
    } catch (error) {
      console.error('Error updating portfolio in database:', error);
      return null;
    }
  },
  
  // Record a transaction in the database
  recordTransaction: async (userId, transactionData) => {
    try {
      // If transactionId is already provided, use it, otherwise generate a new one
      const transactionId = transactionData.transactionId || uuidv4();
      
      // Add transaction ID and timestamp to transaction data
      const enrichedTransaction = {
        ...transactionData,
        transactionId,
        timestamp: new Date().toISOString(),
        userId
      };
      
      // In a real app, this would be an API call to your database
      // For now, simulate a successful response since we don't have a real backend
      // const response = await axios.post(`/api/transactions`, enrichedTransaction);
      
      // Simulate successful response
      const simulatedResponse = {
        data: {
          success: true,
          transaction: enrichedTransaction
        }
      };
      
      return simulatedResponse.data;
    } catch (error) {
      console.error('Error recording transaction in database:', error);
      return null;
    }
  }
};

// Configure axios defaults
axios.defaults.baseURL = 'http://localhost:5000';

function Portfolio() {
    const [portfolio, setPortfolio] = useState({ holdings: [], transactions: [] });
    const [stockData, setStockData] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [debugInfo, setDebugInfo] = useState(null);
    const [userName, setUserName] = useState('');
    const [userId, setUserId] = useState(''); // User ID state
    const [transactionInProgress, setTransactionInProgress] = useState(false);
    
    // Trade state
    const [isTradingOpen, setIsTradingOpen] = useState(false);
    const [selectedStock, setSelectedStock] = useState(null);
    const [tradeQuantity, setTradeQuantity] = useState(1);
    const [tradeError, setTradeError] = useState('');
    const [tradeType, setTradeType] = useState('sell'); // Add trade type state
    
    // Snackbar state
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    // Update auth token
    const updateAuthToken = () => {
        const token = localStorage.getItem('token');
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            return true;
        }
        return false;
    };

    // Get current user info
    const getCurrentUser = () => {
        const userStr = localStorage.getItem('user');
        if (!userStr) return null;
        try {
            return JSON.parse(userStr);
        } catch (e) {
            console.error('Error parsing user data:', e);
            return null;
        }
    };

    // Generate random stock data
    const generateRandomStockData = () => {
        const newStockData = {};
        
        if (portfolio.holdings && portfolio.holdings.length > 0) {
            portfolio.holdings.forEach(holding => {
                // Generate a random price between 80% and 120% of the average price
                const basePrice = holding.avgPrice || 1000;
                const randomPrice = basePrice * (0.8 + Math.random() * 0.4);
                
                // Generate a random change percentage between -5% and +5%
                const randomChange = (Math.random() * 10 - 5).toFixed(2);
                
                newStockData[holding.symbol] = {
                    symbol: holding.symbol,
                    price: randomPrice,
                    change: parseFloat(randomChange)
                };
            });
            
            setStockData(newStockData);
        }
    };

    // Fetch all data at once
    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            setDebugInfo(null);
            
            const hasToken = updateAuthToken();
            if (!hasToken) {
                setError('Authentication token not found. Please log in again.');
                setDebugInfo('No token in localStorage');
                setLoading(false);
                return;
            }
            
            const currentUser = getCurrentUser();
            if (!currentUser) {
                setError('User information not found. Please log in again.');
                setDebugInfo('No user data in localStorage');
                setLoading(false);
                return;
            }
            
            // Set user name from current user
            setUserName(currentUser.name || 'User');
            
            // Set user ID from current user or generate a new one
            const currentUserId = currentUser._id || currentUser.email || uuidv4();
            setUserId(currentUserId);
            
            // Check if this is a new user (first login)
            const isNewUser = currentUser.isNewUser || false;
            
            // If this is a new user, update their status
            if (isNewUser) {
                try {
                    await axios.put('/api/users/update-status');
                    
                    // Update the user in localStorage
                    const updatedUser = { ...currentUser, isNewUser: false };
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                } catch (error) {
                    console.error('Failed to update new user status:', error);
                }
            }
            
            // Fetch the logged-in user's portfolio
            try {
                // Try to get portfolio from database first
                const dbPortfolio = await portfolioDbService.getUserPortfolio(currentUserId);
                
                if (dbPortfolio) {
                    // Use portfolio from database if available
                    setPortfolio(dbPortfolio);
                    generateRandomStockData();
                } else if (isNewUser) {
                    // For new users, initialize with empty portfolio
                    const emptyPortfolio = {
                        holdings: [],
                        transactions: [],
                        userId: currentUserId,
                        userName: currentUser.name,
                        lastUpdated: new Date().toISOString()
                    };
                    
                    setPortfolio(emptyPortfolio);
                    
                    // Save the empty portfolio to the database
                    await portfolioDbService.updateUserPortfolio(currentUserId, emptyPortfolio);
                } else {
                    // Generate user-specific portfolio data based on user ID or email
                    const userId = currentUser._id || currentUser.email;
                    
                    // Create a hash from the user ID to generate consistent but unique portfolio data
                    const hashCode = (str) => {
                        let hash = 0;
                        for (let i = 0; i < str.length; i++) {
                            const char = str.charCodeAt(i);
                            hash = ((hash << 5) - hash) + char;
                            hash = hash & hash; // Convert to 32bit integer
                        }
                        return Math.abs(hash);
                    };
                    
                    const userHash = hashCode(userId);
                    
                    // Use the hash to generate user-specific portfolio data
                    const userSpecificStocks = [
                        { 
                            symbol: 'RELIANCE', 
                            name: 'Reliance Industries Ltd.', 
                            quantity: 5 + (userHash % 10), 
                            avgPrice: 2400 + (userHash % 200),
                            currentPrice: 2500 + (userHash % 300)
                        },
                        { 
                            symbol: 'TCS', 
                            name: 'Tata Consultancy Services Ltd.', 
                            quantity: 3 + (userHash % 5), 
                            avgPrice: 3100 + (userHash % 300),
                            currentPrice: 3200 + (userHash % 250)
                        },
                        { 
                            symbol: 'HDFCBANK', 
                            name: 'HDFC Bank Ltd.', 
                            quantity: 8 + (userHash % 15), 
                            avgPrice: 1500 + (userHash % 200),
                            currentPrice: 1600 + (userHash % 150)
                        },
                        { 
                            symbol: 'INFY', 
                            name: 'Infosys Ltd.', 
                            quantity: 4 + (userHash % 8), 
                            avgPrice: 1350 + (userHash % 150),
                            currentPrice: 1400 + (userHash % 100)
                        }
                    ];
                    
                    // Create user-specific portfolio
                    const userPortfolio = {
                        holdings: userSpecificStocks,
                        transactions: [],
                        userId: currentUserId,
                        userName: currentUser.name,
                        lastUpdated: new Date().toISOString()
                    };
                    
                    setPortfolio(userPortfolio);
                    
                    // Save the generated portfolio to the database
                    await portfolioDbService.updateUserPortfolio(currentUserId, userPortfolio);
                    
                    generateRandomStockData();
                }
                
                // Uncomment this when the API endpoint is fixed
                /*
                const portfolioResponse = await axios.get('/api/user/portfolio');
                
                if (portfolioResponse.data?.success) {
                    setPortfolio(portfolioResponse.data.data);
                    // Generate random stock data based on the user's actual portfolio
                    generateRandomStockData();
                } else {
                    setError('Failed to fetch portfolio data. Please try again.');
                    setDebugInfo(portfolioResponse.data?.error || 'Unknown error');
                }
                */
            } catch (apiError) {
                console.error('API Error:', apiError);
                setError('Failed to fetch portfolio data. Please try again.');
                
                if (apiError.response) {
                    if (apiError.response.status === 401) {
                        // Unauthorized - token expired or invalid
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        setError('Your session has expired. Please log in again.');
                    }
                    setDebugInfo(`Status: ${apiError.response.status}, Data: ${JSON.stringify(apiError.response.data)}`);
                } else if (apiError.request) {
                    setDebugInfo('No response received from server. Server might be down.');
                } else {
                    setDebugInfo(apiError.message);
                }
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
            setError(`Failed to fetch portfolio data: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const retryFetch = () => {
        fetchData();
    };

    useEffect(() => {
        fetchData();
        
        // Update stock prices every 10 seconds
        const priceInterval = setInterval(() => {
            generateRandomStockData();
        }, 10000);
        
        // Refresh portfolio data every minute
        const dataInterval = setInterval(fetchData, 60000);
        
        return () => {
            clearInterval(priceInterval);
            clearInterval(dataInterval);
        };
    }, []);

    const calculateTotalValue = () => {
        return portfolio.holdings.reduce((total, holding) => {
            const currentPrice = stockData[holding.symbol]?.price || holding.currentPrice || 0;
            return total + (currentPrice * holding.quantity);
        }, 0);
    };

    const calculateTotalProfitLoss = () => {
        return portfolio.holdings.reduce((total, holding) => {
            const currentPrice = stockData[holding.symbol]?.price || holding.currentPrice || 0;
            const profitLoss = (currentPrice - holding.avgPrice) * holding.quantity;
            return total + profitLoss;
        }, 0);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2
        }).format(amount);
    };
    
    // Handle selling stock
    const handleSell = (stock) => {
        setSelectedStock(stock);
        setTradeQuantity(1);
        setTradeError('');
        setTradeType('sell');
        setIsTradingOpen(true);
    };
    
    // Handle buying stock
    const handleBuy = (stock) => {
        setSelectedStock(stock);
        setTradeQuantity(1);
        setTradeError('');
        setTradeType('buy');
        setIsTradingOpen(true);
    };
    
    // Handle trade submission
    const handleTradeSubmit = async () => {
        try {
            setTradeError(''); // Clear any previous errors
            setTransactionInProgress(true);
            
            const symbol = selectedStock.symbol;
            const price = stockData[symbol]?.price || selectedStock.currentPrice || 0;
            
            // Generate a unique transaction ID for this trade
            const transactionId = uuidv4();
            
            if (tradeType === 'sell') {
                if (tradeQuantity > selectedStock.quantity) {
                    setTradeError('Not enough shares to sell');
                    setTransactionInProgress(false);
                    return;
                }

                // Calculate the total value of the sell transaction
                const totalSellValue = price * tradeQuantity;
                
                // Create transaction data
                const transactionData = {
                    transactionId,
                    userId,
                    symbol,
                    quantity: tradeQuantity,
                    price,
                    type: 'sell',
                    date: new Date(),
                    totalValue: totalSellValue
                };
                
                try {
                    // Record the transaction in the database
                    const dbResponse = await portfolioDbService.recordTransaction(userId, transactionData);
                    
                    if (dbResponse && dbResponse.success) {
                        // Update portfolio data in real-time
                        const updatedHoldings = [...portfolio.holdings];
                        const holdingIndex = updatedHoldings.findIndex(h => h.symbol === symbol);
                        
                        if (holdingIndex !== -1) {
                            const holding = updatedHoldings[holdingIndex];
                            
                            // Update the quantity
                            holding.quantity -= tradeQuantity;
                            
                            // If quantity is zero, remove the holding
                            if (holding.quantity <= 0) {
                                updatedHoldings.splice(holdingIndex, 1);
                            } else {
                                // Otherwise update the holding
                                updatedHoldings[holdingIndex] = holding;
                            }
                            
                            // Create updated portfolio object
                            const updatedPortfolio = {
                                ...portfolio,
                                holdings: updatedHoldings,
                                transactions: [
                                    {
                                        transactionId,
                                        symbol,
                                        quantity: tradeQuantity,
                                        price,
                                        type: 'sell',
                                        date: new Date()
                                    },
                                    ...portfolio.transactions || []
                                ],
                                lastUpdated: new Date().toISOString()
                            };
                            
                            // Update portfolio state
                            setPortfolio(updatedPortfolio);
                            
                            // Update portfolio in database
                            await portfolioDbService.updateUserPortfolio(userId, updatedPortfolio);
                            
                            // Update stock data
                            generateRandomStockData();
                        }
                        
                        // Show success message
                        setSnackbar({
                            open: true,
                            message: `Successfully sold ${tradeQuantity} shares of ${symbol}`,
                            severity: 'success'
                        });
                        
                        // Close the dialog
                        setIsTradingOpen(false);
                    } else {
                        setTradeError('Failed to record transaction in database');
                    }
                } catch (transactionError) {
                    console.error('Transaction error:', transactionError);
                    setTradeError('Failed to record transaction in database');
                }
            } else if (tradeType === 'buy') {
                // Handle buy operation
                const totalBuyValue = price * tradeQuantity;
                
                // Create transaction data
                const transactionData = {
                    transactionId,
                    userId,
                    symbol,
                    quantity: tradeQuantity,
                    price,
                    type: 'buy',
                    date: new Date(),
                    totalValue: totalBuyValue
                };
                
                try {
                    // Record the transaction in the database
                    const dbResponse = await portfolioDbService.recordTransaction(userId, transactionData);
                    
                    if (dbResponse && dbResponse.success) {
                        // Update portfolio data in real-time
                        const updatedHoldings = [...portfolio.holdings];
                        const holdingIndex = updatedHoldings.findIndex(h => h.symbol === symbol);
                        
                        if (holdingIndex !== -1) {
                            // Update existing holding
                            const holding = updatedHoldings[holdingIndex];
                            const newQuantity = holding.quantity + tradeQuantity;
                            const newAvgPrice = ((holding.avgPrice * holding.quantity) + (price * tradeQuantity)) / newQuantity;
                            
                            updatedHoldings[holdingIndex] = {
                                ...holding,
                                quantity: newQuantity,
                                avgPrice: newAvgPrice
                            };
                        } else {
                            // Add new holding
                            updatedHoldings.push({
                                symbol,
                                name: selectedStock.name || symbol,
                                quantity: tradeQuantity,
                                avgPrice: price,
                                currentPrice: price
                            });
                        }
                        
                        // Create updated portfolio object
                        const updatedPortfolio = {
                            ...portfolio,
                            holdings: updatedHoldings,
                            transactions: [
                                {
                                    transactionId,
                                    symbol,
                                    quantity: tradeQuantity,
                                    price,
                                    type: 'buy',
                                    date: new Date()
                                },
                                ...portfolio.transactions || []
                            ],
                            lastUpdated: new Date().toISOString()
                        };
                        
                        // Update portfolio state
                        setPortfolio(updatedPortfolio);
                        
                        // Update portfolio in database
                        await portfolioDbService.updateUserPortfolio(userId, updatedPortfolio);
                        
                        // Update stock data
                        generateRandomStockData();
                        
                        // Show success message
                        setSnackbar({
                            open: true,
                            message: `Successfully bought ${tradeQuantity} shares of ${symbol}`,
                            severity: 'success'
                        });
                        
                        // Close the dialog
                        setIsTradingOpen(false);
                    } else {
                        setTradeError('Failed to record transaction in database');
                    }
                } catch (transactionError) {
                    console.error('Transaction error:', transactionError);
                    setTradeError('Failed to record transaction in database');
                }
            }
        } catch (error) {
            console.error('Trade operation failed:', error);
            setTradeError(error.response?.data?.error || 'Trade operation failed');
        } finally {
            setTransactionInProgress(false);
        }
    };
    
    // Handle snackbar close
    const handleSnackbarClose = () => {
        setSnackbar({
            ...snackbar,
            open: false
        });
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                {debugInfo && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        <Typography variant="subtitle2">Debug Information:</Typography>
                        <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                            {debugInfo}
                        </Typography>
                    </Alert>
                )}
                {error.includes('log in again') ? (
                    <Button 
                        variant="contained" 
                        onClick={() => window.location.href = '/login'}
                        sx={{ mr: 1 }}
                    >
                        Go to Login
                    </Button>
                ) : (
                    <Button variant="contained" onClick={retryFetch}>Retry</Button>
                )}
            </Box>
        );
    }

    if (!portfolio.holdings || portfolio.holdings.length === 0) {
        return (
            <Box sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4" gutterBottom>
                        {userName ? `${userName}'s Portfolio` : 'Portfolio'}
                    </Typography>
                    {userName && (
                        <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="subtitle1" color="primary" sx={{ fontWeight: 500 }}>
                                Welcome back, {userName}!
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </Typography>
                        </Box>
                    )}
                </Box>
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" color="primary" gutterBottom>
                        Hello {userName}! Your portfolio is empty.
                    </Typography>
                    <Typography variant="body1" paragraph>
                        You don't have any stocks in your portfolio yet. Start trading to build your wealth!
                    </Typography>
                    <Button 
                        variant="contained" 
                        color="primary"
                        onClick={() => window.location.href = '/dashboard'}
                    >
                        Go to Dashboard
                    </Button>
                </Paper>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" gutterBottom>
                    {userName ? `${userName}'s Portfolio` : 'Portfolio'}
                </Typography>
                {userName && (
                    <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="subtitle1" color="primary" sx={{ fontWeight: 500 }}>
                            Welcome back, {userName}!
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </Typography>
                    </Box>
                )}
            </Box>
            
            <Box sx={{ mb: 4 }}>
                <Paper sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Box>
                            <Typography variant="subtitle2" color="text.secondary">
                                Total Portfolio Value
                            </Typography>
                            <Typography variant="h4">
                                {formatCurrency(calculateTotalValue())}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                                {portfolio.holdings.length} stocks in your portfolio
                            </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="subtitle2" color="text.secondary">
                                Total P&L
                            </Typography>
                            <Typography 
                                variant="h4" 
                                color={calculateTotalProfitLoss() >= 0 ? 'success.main' : 'error.main'}
                                sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}
                            >
                                {calculateTotalProfitLoss() >= 0 ? (
                                    <TrendingUpIcon sx={{ mr: 1 }} />
                                ) : (
                                    <TrendingDownIcon sx={{ mr: 1 }} />
                                )}
                                {formatCurrency(Math.abs(calculateTotalProfitLoss()))}
                            </Typography>
                            <Typography 
                                variant="caption" 
                                color={calculateTotalProfitLoss() >= 0 ? 'success.main' : 'error.main'}
                                sx={{ display: 'block', mt: 1, fontWeight: 500 }}
                            >
                                {calculateTotalProfitLoss() >= 0 ? '+' : ''}
                                {((calculateTotalProfitLoss() / (calculateTotalValue() - calculateTotalProfitLoss())) * 100).toFixed(2)}%
                            </Typography>
                        </Box>
                    </Box>
                </Paper>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Stock</TableCell>
                            <TableCell align="right">Quantity</TableCell>
                            <TableCell align="right">Avg. Price</TableCell>
                            <TableCell align="right">Current Price</TableCell>
                            <TableCell align="right">Current Value</TableCell>
                            <TableCell align="right">P&L</TableCell>
                            <TableCell align="right">Change</TableCell>
                            <TableCell align="right">Action</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {portfolio.holdings.map((holding) => {
                            const currentPrice = stockData[holding.symbol]?.price || holding.currentPrice || 0;
                            const currentValue = currentPrice * holding.quantity;
                            const profitLoss = (currentPrice - holding.avgPrice) * holding.quantity;
                            const priceChange = stockData[holding.symbol]?.change || 0;

                            return (
                                <TableRow key={holding.symbol}>
                                    <TableCell>
                                        <Box>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                {holding.symbol}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {holding.name}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right">{holding.quantity}</TableCell>
                                    <TableCell align="right">{formatCurrency(holding.avgPrice)}</TableCell>
                                    <TableCell align="right">{formatCurrency(currentPrice)}</TableCell>
                                    <TableCell align="right">{formatCurrency(currentValue)}</TableCell>
                                    <TableCell align="right">
                                        <Typography 
                                            color={profitLoss >= 0 ? 'success.main' : 'error.main'}
                                            sx={{ fontWeight: 500 }}
                                        >
                                            {formatCurrency(profitLoss)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Chip
                                            label={`${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)}%`}
                                            color={priceChange >= 0 ? 'success' : 'error'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Button 
                                            variant="contained"
                                            size="small"
                                            color="error"
                                            sx={{ 
                                                background: 'linear-gradient(45deg, #D32F2F 30%, #F44336 90%)',
                                                '&:hover': {
                                                    background: 'linear-gradient(45deg, #B71C1C 30%, #D32F2F 90%)',
                                                    transform: 'translateY(-1px)',
                                                    boxShadow: '0 4px 12px rgba(244, 67, 54, 0.3)'
                                                },
                                                transition: 'all 0.2s ease',
                                                fontWeight: 700,
                                                fontSize: '0.75rem',
                                                minWidth: '60px',
                                                mr: 1
                                            }}
                                            onClick={() => handleSell(holding)}
                                        >
                                            SELL
                                        </Button>
                                        <Button 
                                            variant="contained"
                                            size="small"
                                            color="success"
                                            sx={{ 
                                                background: 'linear-gradient(45deg, #2E7D32 30%, #4CAF50 90%)',
                                                '&:hover': {
                                                    background: 'linear-gradient(45deg, #1B5E20 30%, #2E7D32 90%)',
                                                    transform: 'translateY(-1px)',
                                                    boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)'
                                                },
                                                transition: 'all 0.2s ease',
                                                fontWeight: 700,
                                                fontSize: '0.75rem',
                                                minWidth: '60px'
                                            }}
                                            onClick={() => handleBuy(holding)}
                                        >
                                            BUY
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
            
            {/* Transaction History Section */}
            {portfolio.transactions && portfolio.transactions.length > 0 && (
                <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" gutterBottom>
                        Recent Transactions
                    </Typography>
                    <TableContainer component={Paper}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Date</TableCell>
                                    <TableCell>Stock</TableCell>
                                    <TableCell align="right">Type</TableCell>
                                    <TableCell align="right">Quantity</TableCell>
                                    <TableCell align="right">Price</TableCell>
                                    <TableCell align="right">Total</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {portfolio.transactions.slice(0, 5).map((transaction, index) => (
                                    <TableRow key={index}>
                                        <TableCell>
                                            {transaction.date instanceof Date 
                                                ? transaction.date.toLocaleDateString() 
                                                : new Date(transaction.date).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>{transaction.symbol}</TableCell>
                                        <TableCell align="right">
                                            <Chip
                                                label={transaction.type.toUpperCase()}
                                                color={transaction.type === 'buy' ? 'success' : 'error'}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell align="right">{transaction.quantity}</TableCell>
                                        <TableCell align="right">{formatCurrency(transaction.price)}</TableCell>
                                        <TableCell align="right">{formatCurrency(transaction.price * transaction.quantity)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}
            
            {/* Trading Dialog */}
            <Dialog open={isTradingOpen} onClose={() => !transactionInProgress && setIsTradingOpen(false)}>
                <DialogTitle>
                    {tradeType === 'buy' ? 'Buy' : 'Sell'} {selectedStock?.symbol}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        <TextField
                            fullWidth
                            type="number"
                            label="Quantity"
                            value={tradeQuantity}
                            onChange={(e) => setTradeQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                            disabled={transactionInProgress}
                            InputProps={{
                                startAdornment: (
                                    <MuiInputAdornment position="start">
                                        <IconButton 
                                            size="small" 
                                            onClick={() => setTradeQuantity(q => Math.max(1, q - 1))}
                                            disabled={transactionInProgress}
                                        >
                                            <RemoveIcon />
                                        </IconButton>
                                    </MuiInputAdornment>
                                ),
                                endAdornment: (
                                    <MuiInputAdornment position="end">
                                        <IconButton 
                                            size="small" 
                                            onClick={() => setTradeQuantity(q => q + 1)}
                                            disabled={transactionInProgress}
                                        >
                                            <AddIcon />
                                        </IconButton>
                                    </MuiInputAdornment>
                                )
                            }}
                        />
                        {selectedStock && (
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Market Price: {formatCurrency(stockData[selectedStock.symbol]?.price || selectedStock.currentPrice || 0)}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Total Value: {formatCurrency((stockData[selectedStock.symbol]?.price || selectedStock.currentPrice || 0) * tradeQuantity)}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    User ID: {userId}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Transaction ID: {transactionInProgress ? 'Generating...' : 'Will be generated on submission'}
                                </Typography>
                                {transactionInProgress && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                                        <CircularProgress size={24} sx={{ mr: 1 }} />
                                        <Typography>Processing transaction...</Typography>
                                    </Box>
                                )}
                                {tradeError && (
                                    <Alert severity="error" sx={{ mt: 2 }}>
                                        {tradeError}
                                    </Alert>
                                )}
                            </Box>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button 
                        onClick={() => setIsTradingOpen(false)}
                        disabled={transactionInProgress}
                    >
                        Cancel
                    </Button>
                    <Button 
                        variant="contained"
                        color={tradeType === 'buy' ? 'success' : 'error'}
                        onClick={handleTradeSubmit}
                        disabled={transactionInProgress}
                    >
                        {tradeType === 'buy' ? 'Buy' : 'Sell'}
                    </Button>
                </DialogActions>
            </Dialog>
            
            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleSnackbarClose}
                message={snackbar.message}
            />
        </Box>
    );
}

export default Portfolio;