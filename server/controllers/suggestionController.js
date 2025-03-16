const Suggestion = require('../models/Suggestion');
const Stock = require('../models/Stock');
const User = require('../models/User');
const axios = require('axios');

const ALPHA_VANTAGE_API_KEY = 'YOUR_ALPHA_VANTAGE_API_KEY'; // Replace with your API key

// @desc    Get stock suggestions
// @route   GET /api/suggestions
// @access  Private
exports.getSuggestions = async (req, res) => {
    try {
        // Get current market data for NIFTY 50 stocks
        const stockSymbols = ['RELIANCE.BSE', 'TCS.BSE', 'HDFCBANK.BSE', 'INFY.BSE', 'ICICIBANK.BSE'];
        const suggestions = [];

        for (const symbol of stockSymbols) {
            try {
                const response = await axios.get('https://www.alphavantage.co/query', {
                    params: {
                        function: 'GLOBAL_QUOTE',
                        symbol: symbol,
                        apikey: ALPHA_VANTAGE_API_KEY
                    }
                });

                const data = response.data['Global Quote'];
                if (data) {
                    const priceChange = parseFloat(data['10. change percent'].replace('%', ''));
                    const volume = parseInt(data['06. volume']);
                    
                    suggestions.push({
                        symbol: symbol.replace('.BSE', ''),
                        price: parseFloat(data['05. price']),
                        change: priceChange,
                        volume: volume,
                        suggestion: priceChange > 0 ? 'buy' : 'sell',
                        reason: priceChange > 0 
                            ? `Positive momentum with ${priceChange.toFixed(2)}% gain`
                            : `Downward trend with ${Math.abs(priceChange).toFixed(2)}% loss`
                    });
                }
            } catch (error) {
                console.error(`Error fetching data for ${symbol}:`, error);
            }
        }

        // Sort suggestions by absolute price change
        suggestions.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

        res.json({
            success: true,
            data: suggestions
        });
    } catch (error) {
        console.error('Error in getSuggestions:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Generate new suggestions
// @route   POST /api/suggestions/generate
// @access  Private
exports.generateSuggestions = async (req, res) => {
    try {
        const stockSymbols = ['RELIANCE.BSE', 'TCS.BSE', 'HDFCBANK.BSE', 'INFY.BSE', 'ICICIBANK.BSE'];
        const suggestions = [];

        for (const symbol of stockSymbols) {
            try {
                // Get daily time series for more detailed analysis
                const response = await axios.get('https://www.alphavantage.co/query', {
                    params: {
                        function: 'TIME_SERIES_DAILY',
                        symbol: symbol,
                        apikey: ALPHA_VANTAGE_API_KEY
                    }
                });

                const timeSeriesData = response.data['Time Series (Daily)'];
                if (timeSeriesData) {
                    const dates = Object.keys(timeSeriesData).slice(0, 5); // Last 5 days
                    const prices = dates.map(date => parseFloat(timeSeriesData[date]['4. close']));
                    
                    // Calculate 5-day trend
                    const priceChange = ((prices[0] - prices[prices.length - 1]) / prices[prices.length - 1]) * 100;
                    const avgVolume = dates
                        .map(date => parseInt(timeSeriesData[date]['5. volume']))
                        .reduce((a, b) => a + b, 0) / dates.length;

                    suggestions.push({
                        symbol: symbol.replace('.BSE', ''),
                        price: prices[0],
                        change: priceChange,
                        volume: avgVolume,
                        suggestion: priceChange > 0 ? 'buy' : 'sell',
                        reason: `${Math.abs(priceChange).toFixed(2)}% ${priceChange > 0 ? 'gain' : 'loss'} over 5 days with avg volume of ${Math.round(avgVolume).toLocaleString()} shares`
                    });
                } else {
                    console.error(`No time series data found for ${symbol}`);
                }
            } catch (error) {
                console.error(`Error fetching data for ${symbol}:`, error.message);
            }
        }

        res.json({
            success: true,
            data: suggestions
        });
    } catch (error) {
        console.error('Error in generateSuggestions:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to generate suggestions. Please try again.'
        });
    }
};

// @desc    Update suggestion status
// @route   PUT /api/suggestions/:id
// @access  Private
exports.updateSuggestion = async (req, res) => {
    try {
        const { status } = req.body;
        
        if (!['accepted', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid status'
            });
        }

        const suggestion = await Suggestion.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            { status },
            { new: true, runValidators: true }
        );

        if (!suggestion) {
            return res.status(404).json({
                success: false,
                error: 'Suggestion not found'
            });
        }

        res.json({
            success: true,
            data: suggestion
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// Helper functions for suggestion generation
const calculateRiskLevel = (stock) => {
    // Simple risk calculation based on price and volume
    const risk = (stock.price * stock.volume) / stock.marketCap;
    if (risk > 0.7) return 'high';
    if (risk > 0.3) return 'medium';
    return 'low';
};

const calculatePotentialReturn = (stock) => {
    // Simple potential return calculation (to be enhanced)
    return (stock.price * 0.1); // Assumes 10% potential return
};

const calculateAllocation = (stock) => {
    // Simple allocation calculation (to be enhanced)
    return Math.min(20, Math.max(5, (stock.marketCap / 1e12) * 100)); // 5-20% based on market cap
};