const Stock = require('../models/Stock.js');
const User = require('../models/User.js');
const Portfolio = require('../models/Portfolio.js');
const Transaction = require('../models/Transaction.js');
const axios = require('axios');
const mongoose = require('mongoose');

const ALPHA_VANTAGE_API_KEY = 'demo'; // Replace with your API key
const RAPID_API_KEY = process.env.RAPID_API_KEY;
const RAPID_API_HOST = 'nse-market.p.rapidapi.com';

// Helper function to make API calls to Alpha Vantage
const alphaVantageCall = async (params) => {
    try {
        const response = await axios.get('https://www.alphavantage.co/query', {
            params: {
                apikey: ALPHA_VANTAGE_API_KEY,
                ...params
            }
        });
        return response.data;
    } catch (error) {
        throw new Error(`Alpha Vantage API Error: ${error.message}`);
    }
};

// Helper function to make API calls to NSE API
const nseApiCall = async (endpoint) => {
    try {
        console.log(`Calling NSE API: ${endpoint}`);
        const response = await axios.get(`https://${RAPID_API_HOST}${endpoint}`, {
            headers: {
                'X-RapidAPI-Key': RAPID_API_KEY,
                'X-RapidAPI-Host': RAPID_API_HOST
            }
        });
        console.log('NSE API Response:', response.data);
        return response.data;
    } catch (error) {
        console.error('NSE API Error:', error.response?.data || error.message);
        throw new Error(`NSE API Error: ${error.message}`);
    }
};

// @desc    Get all stocks
// @route   GET /api/stocks
// @access  Private
exports.getStocks = async (req, res) => {
    try {
        const stocks = await Stock.find();
        res.json({
            success: true,
            count: stocks.length,
            data: stocks
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Get stock by symbol
// @route   GET /api/stocks/:symbol
// @access  Private
exports.getStockBySymbol = async (req, res) => {
    try {
        const stockData = await nseApiCall('/price/all');
        
        // Update or create stock in database
        const stock = await Stock.findOneAndUpdate(
            { symbol: stockData.symbol },
            stockData,
            { new: true, upsert: true }
        );

        res.json({
            success: true,
            data: stock
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Buy stock
// @route   POST /api/stocks/buy
// @access  Private
exports.buyStock = async (req, res) => {
    try {
        const { symbol, quantity, price, name } = req.body;
        const userId = req.user.id;
        const cleanSymbol = symbol.replace('.BSE', '');

        const totalCost = price * quantity;

        // Check user's wallet balance
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        if (user.walletBalance < totalCost) {
            return res.status(400).json({
                success: false,
                error: 'Insufficient funds'
            });
        }

        // Create or find stock
        let stock = await Stock.findOne({ symbol: cleanSymbol });
        if (!stock) {
            stock = await Stock.create({ 
                symbol: cleanSymbol, 
                name
            });
        }

        // Update user's wallet
        user.walletBalance -= totalCost;
        await user.save();

        // Create transaction record
        const transaction = await Transaction.create({
            userId,
            assetId: stock._id,
            assetType: 'Stock',
            type: 'buy',
            symbol: cleanSymbol,
            quantity,
            price,
            amount: totalCost,
            balance: user.walletBalance
        });

        // Update or create portfolio
        let portfolio = await Portfolio.findOne({ userId });
        if (!portfolio) {
            portfolio = await Portfolio.create({
                userId,
                holdings: [{
                    stockId: stock._id,
                    symbol: cleanSymbol,
                    name,
                    quantity,
                    avgPrice: price,
                    currentPrice: price,
                    totalValue: totalCost,
                    profitLoss: 0,
                    profitLossPercentage: 0
                }]
            });
        } else {
            const existingHolding = portfolio.holdings.find(h => h.symbol === cleanSymbol);
            if (existingHolding) {
                const oldValue = existingHolding.quantity * existingHolding.avgPrice;
                const newValue = totalCost;
                const totalQuantity = existingHolding.quantity + quantity;
                
                existingHolding.quantity = totalQuantity;
                existingHolding.avgPrice = (oldValue + newValue) / totalQuantity;
                existingHolding.currentPrice = price;
                existingHolding.totalValue = totalQuantity * price;
                existingHolding.profitLoss = (price - existingHolding.avgPrice) * totalQuantity;
                existingHolding.profitLossPercentage = ((price - existingHolding.avgPrice) / existingHolding.avgPrice) * 100;
            } else {
                portfolio.holdings.push({
                    stockId: stock._id,
                    symbol: cleanSymbol,
                    name,
                    quantity,
                    avgPrice: price,
                    currentPrice: price,
                    totalValue: totalCost,
                    profitLoss: 0,
                    profitLossPercentage: 0
                });
            }
            await portfolio.save();
        }

        res.json({
            success: true,
            data: {
                transaction,
                newBalance: user.walletBalance,
                portfolio: portfolio.holdings
            }
        });
    } catch (error) {
        console.error('Error in buyStock:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Sell stock
// @route   POST /api/stocks/sell
// @access  Private
exports.sellStock = async (req, res) => {
    try {
        const { symbol, quantity, price } = req.body;
        const userId = req.user.id;
        const cleanSymbol = symbol.replace('.BSE', '');

        // Find user and portfolio
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        const portfolio = await Portfolio.findOne({ userId });
        if (!portfolio) {
            return res.status(404).json({
                success: false,
                error: 'Portfolio not found'
            });
        }

        // Check if user owns enough shares
        const holding = portfolio.holdings.find(h => h.symbol === cleanSymbol);
        if (!holding || holding.quantity < quantity) {
            return res.status(400).json({
                success: false,
                error: 'Not enough shares to sell'
            });
        }

        const totalValue = price * quantity;

        // Find stock
        const stock = await Stock.findOne({ symbol: cleanSymbol });
        if (!stock) {
            return res.status(404).json({
                success: false,
                error: 'Stock not found'
            });
        }

        // Update user's wallet first
        user.walletBalance += totalValue;
        await user.save();

        // Create transaction record
        const transaction = await Transaction.create({
            userId,
            assetId: stock._id,
            assetType: 'Stock',
            type: 'sell',
            symbol: cleanSymbol,
            quantity,
            price,
            amount: totalValue,
            balance: user.walletBalance
        });

        // Update portfolio
        if (holding.quantity === quantity) {
            portfolio.holdings = portfolio.holdings.filter(h => h.symbol !== cleanSymbol);
        } else {
            holding.quantity -= quantity;
            holding.currentPrice = price;
            holding.totalValue = holding.quantity * price;
            holding.profitLoss = (price - holding.avgPrice) * holding.quantity;
            holding.profitLossPercentage = ((price - holding.avgPrice) / holding.avgPrice) * 100;
        }
        await portfolio.save();

        res.json({
            success: true,
            data: {
                transaction,
                newBalance: user.walletBalance,
                portfolio: portfolio.holdings
            }
        });
    } catch (error) {
        console.error('Error in sellStock:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Get multiple stock quotes
// @route   GET /api/stocks/quotes
// @access  Private
exports.getBatchQuotes = async (req, res) => {
    try {
        // Get price data for all stocks
        const priceData = await nseApiCall('/price');
        
        if (!Array.isArray(priceData)) {
            return res.status(500).json({
                success: false,
                error: 'Invalid response from NSE API'
            });
        }

        // Format the response data
        const formattedData = priceData.map(stock => ({
            symbol: stock.symbol,
            name: stock.identifier || stock.symbol,
            price: stock.lastPrice,
            change: stock.pChange,
            volume: stock.totalTradedVolume,
            dayHigh: stock.dayHigh,
            dayLow: stock.dayLow,
            open: stock.open,
            previousClose: stock.previousClose,
            lastUpdateTime: stock.lastUpdateTime
        }));

        res.json({
            success: true,
            data: formattedData
        });
    } catch (error) {
        console.error('Error in getBatchQuotes:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Get stock details
// @route   GET /api/stocks/details/:symbol
// @access  Private
exports.getStockDetails = async (req, res) => {
    try {
        console.log('Fetching details for symbol:', req.params.symbol);
        const symbol = req.params.symbol;
        
        if (!symbol) {
            console.error('No symbol provided');
            return res.status(400).json({
                success: false,
                error: 'Stock symbol is required'
            });
        }

        // Stock price ranges for different symbols
        const priceRanges = {
            'RELIANCE': { min: 2300, max: 2500 },
            'TCS': { min: 3400, max: 3600 },
            'HDFCBANK': { min: 1500, max: 1700 },
            'INFY': { min: 1300, max: 1500 },
            'ICICIBANK': { min: 900, max: 1100 }
        };

        // Get price range for the symbol or use default
        const range = priceRanges[symbol] || { min: 500, max: 2000 };
        
        // Generate realistic mock data
        const basePrice = parseFloat((Math.random() * (range.max - range.min) + range.min).toFixed(2));
        const changePercent = parseFloat((Math.random() * 5 - 2.5).toFixed(2)); // -2.5% to +2.5%
        const volume = Math.floor(Math.random() * (1000000 - 100000) + 100000);
        const dayHigh = parseFloat((basePrice * (1 + Math.random() * 0.02)).toFixed(2));
        const dayLow = parseFloat((basePrice * (1 - Math.random() * 0.02)).toFixed(2));
        const previousClose = parseFloat((basePrice * (1 + (Math.random() * 0.04 - 0.02))).toFixed(2));

        const mockData = {
            symbol,
            price: basePrice,
            change: changePercent,
            volume,
            dayHigh,
            dayLow,
            previousClose,
            name: symbol
        };

        // Update stock in database
        await Stock.findOneAndUpdate(
            { symbol },
            { 
                ...mockData,
                lastUpdated: Date.now()
            },
            { upsert: true, new: true }
        );

        console.log('Sending stock data:', mockData);

        res.json({
            success: true,
            data: mockData
        });
    } catch (error) {
        console.error('Error in getStockDetails:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch stock details'
        });
    }
};

// @desc    Get stock chart data
// @route   GET /api/stocks/:symbol/chart
// @access  Private
exports.getStockChartData = async (req, res) => {
    try {
        const symbol = req.params.symbol;
        
        const data = await alphaVantageCall({
            function: 'TIME_SERIES_DAILY',
            symbol: symbol,
            outputsize: 'compact'
        });

        if (!data['Time Series (Daily)']) {
            return res.status(404).json({
                success: false,
                error: 'Stock not found'
            });
        }

        const timeSeriesData = data['Time Series (Daily)'];
        const chartData = Object.entries(timeSeriesData).map(([date, values]) => ({
            date: date,
            open: parseFloat(values['1. open']),
            high: parseFloat(values['2. high']),
            low: parseFloat(values['3. low']),
            close: parseFloat(values['4. close']),
            volume: parseInt(values['5. volume'])
        }));

        res.json({
            success: true,
            data: chartData
        });
    } catch (error) {
        console.error('Error in getStockChartData:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}; 