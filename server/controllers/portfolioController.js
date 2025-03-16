const Portfolio = require('../models/Portfolio.js');
const Stock = require('../models/Stock.js');
const Bond = require('../models/Bond.js');
const Insurance = require('../models/Insurance.js');
const alphaVantage = require('../utils/alphaVantage.js');
const User = require('../models/User.js');
const Transaction = require('../models/Transaction.js');


// @route   GET /api/user/portfolio
exports.getPortfolio = async (req, res) => {
    try {
        // Get all transactions for the user
        const transactions = await Transaction.find({ 
            userId: req.user.id,
            type: { $in: ['buy', 'sell'] }
        }).sort({ createdAt: -1 });

        // Initialize empty portfolio
        const portfolio = {
            holdings: [],
            transactions: transactions.map(t => ({
                ...t.toObject(),
                date: t.createdAt,
                total: t.price * t.quantity
            }))
        };

        // Calculate holdings from transactions
        const holdingsMap = {};
        
        for (const transaction of transactions) {
            const symbol = transaction.symbol;
            
            if (!holdingsMap[symbol]) {
                holdingsMap[symbol] = {
                    symbol,
                    name: transaction.name || symbol,
                    quantity: 0,
                    avgPrice: 0,
                    totalInvestment: 0,
                    currentPrice: transaction.price,
                    totalValue: 0,
                    profitLoss: 0,
                    profitLossPercentage: 0
                };
            }

            const holding = holdingsMap[symbol];

            if (transaction.type === 'buy') {
                const newQuantity = holding.quantity + transaction.quantity;
                const newTotalInvestment = holding.totalInvestment + (transaction.price * transaction.quantity);
                
                holding.quantity = newQuantity;
                holding.totalInvestment = newTotalInvestment;
                holding.avgPrice = newTotalInvestment / newQuantity;
                holding.currentPrice = transaction.price;
                holding.totalValue = holding.quantity * holding.currentPrice;
                holding.profitLoss = (holding.currentPrice - holding.avgPrice) * holding.quantity;
                holding.profitLossPercentage = ((holding.currentPrice - holding.avgPrice) / holding.avgPrice) * 100;
            } else if (transaction.type === 'sell') {
                holding.quantity -= transaction.quantity;
                
                if (holding.quantity > 0) {
                    holding.totalValue = holding.quantity * holding.currentPrice;
                    holding.profitLoss = (holding.currentPrice - holding.avgPrice) * holding.quantity;
                    holding.profitLossPercentage = ((holding.currentPrice - holding.avgPrice) / holding.avgPrice) * 100;
                } else {
                    delete holdingsMap[symbol];
                }
            }
        }

        // Convert holdings map to array and filter out zero quantities
        portfolio.holdings = Object.values(holdingsMap)
            .filter(holding => holding.quantity > 0)
            .map(holding => ({
                ...holding,
                profitLoss: parseFloat(holding.profitLoss.toFixed(2)),
                profitLossPercentage: parseFloat(holding.profitLossPercentage.toFixed(2)),
                totalValue: parseFloat(holding.totalValue.toFixed(2)),
                avgPrice: parseFloat(holding.avgPrice.toFixed(2)),
                currentPrice: parseFloat(holding.currentPrice.toFixed(2))
            }));

        // Add summary data
        portfolio.totalInvestment = portfolio.holdings.reduce((sum, holding) => sum + holding.totalInvestment, 0);
        portfolio.totalValue = portfolio.holdings.reduce((sum, holding) => sum + holding.totalValue, 0);
        portfolio.totalProfitLoss = parseFloat((portfolio.totalValue - portfolio.totalInvestment).toFixed(2));
        portfolio.totalProfitLossPercentage = portfolio.totalInvestment > 0 
            ? parseFloat(((portfolio.totalValue - portfolio.totalInvestment) / portfolio.totalInvestment * 100).toFixed(2))
            : 0;

        res.json({
            success: true,
            data: portfolio
        });
    } catch (error) {
        console.error('Error in getPortfolio:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch portfolio data'
        });
    }
};

// @route   GET /api/user/wallet

exports.getWalletBalance = async (req, res) => {
    try {
        // Log authentication information for debugging
        console.log('Auth request received for wallet balance');
        console.log('User ID from token:', req.user?.id);
        
        if (!req.user || !req.user.id) {
            console.log('No authenticated user found in request');
            return res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
        }

        const user = await User.findById(req.user.id);
        
        if (!user) {
            console.log(`User with ID ${req.user.id} not found in database`);
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        
        console.log(`Wallet balance for user ${req.user.id}: ${user.walletBalance}`);
        
        res.json({
            success: true,
            balance: user.walletBalance
        });
    } catch (error) {
        console.error('Error in getWalletBalance:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};


exports.addFunds = async (req, res) => {
    try {
        const { amount } = req.body;
        
        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Please provide a valid amount'
            });
        }

        const user = await User.findById(req.user.id);
        user.walletBalance += amount;
        await user.save();

        // Create transaction record
        await Transaction.create({
            userId: req.user.id,
            type: 'deposit',
            amount,
            balance: user.walletBalance
        });

        res.json({
            success: true,
            balance: user.walletBalance
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

exports.calculateProfitLoss = async (req, res) => {
    try {
        const portfolio = await Portfolio.findOne({ userId: req.params.userId });

        if (!portfolio) {
            return res.status(404).json({
                success: false,
                error: 'Portfolio not found'
            });
        }

        let totalProfitLoss = 0;
        let updatedAssets = [];

        // Calculate profit/loss for each asset
        for (const asset of portfolio.assets) {
            let currentPrice;
            let profitLoss;

            switch (asset.assetType) {
                case 'Stock':
                    const stock = await Stock.findById(asset.assetId);
                    const stockData = await alphaVantage.getStockQuote(stock.symbol);
                    currentPrice = stockData.price;
                    break;

                case 'Bond':
                    const bond = await Bond.findById(asset.assetId);
                    currentPrice = bond.price;
                    break;

                case 'Insurance':
                    const insurance = await Insurance.findById(asset.assetId);
                    currentPrice = insurance.coverageAmount;
                    break;
            }

            const currentValue = asset.quantity * currentPrice;
            const investedValue = asset.quantity * asset.avgPrice;
            profitLoss = currentValue - investedValue;

            updatedAssets.push({
                ...asset.toObject(),
                currentValue,
                profitLoss
            });

            totalProfitLoss += profitLoss;
        }

        // Update portfolio with new values
        portfolio.assets = updatedAssets;
        portfolio.totalValue = updatedAssets.reduce((total, asset) => total + asset.currentValue, 0);
        portfolio.totalProfitLoss = totalProfitLoss;
        portfolio.lastUpdated = Date.now();
        await portfolio.save();

        res.json({
            success: true,
            data: {
                portfolio,
                totalProfitLoss
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};


exports.getPortfolioStats = async (req, res) => {
    try {
        const portfolio = await Portfolio.findOne({ userId: req.params.userId });

        if (!portfolio) {
            return res.status(404).json({
                success: false,
                error: 'Portfolio not found'
            });
        }

        // Calculate asset type distribution
        const distribution = {
            stocks: 0,
            bonds: 0,
            insurance: 0
        };

        portfolio.assets.forEach(asset => {
            switch (asset.assetType) {
                case 'Stock':
                    distribution.stocks += asset.currentValue;
                    break;
                case 'Bond':
                    distribution.bonds += asset.currentValue;
                    break;
                case 'Insurance':
                    distribution.insurance += asset.currentValue;
                    break;
            }
        });

        const totalValue = portfolio.totalValue || 0;
        const stats = {
            totalValue,
            totalProfitLoss: portfolio.totalProfitLoss || 0,
            distribution: {
                stocks: (distribution.stocks / totalValue) * 100 || 0,
                bonds: (distribution.bonds / totalValue) * 100 || 0,
                insurance: (distribution.insurance / totalValue) * 100 || 0
            },
            lastUpdated: portfolio.lastUpdated
        };

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};


// @route   GET /api/portfolio/:userId
exports.getUserPortfolio = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Find portfolio by user ID
        const portfolio = await Portfolio.findOne({ userId });
        
        if (!portfolio) {
            return res.status(404).json({
                success: false,
                error: 'Portfolio not found for this user'
            });
        }
        
        res.json({
            success: true,
            data: portfolio
        });
    } catch (error) {
        console.error('Error in getUserPortfolio:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};


// @route   PUT /api/portfolio/:userId

exports.updateUserPortfolio = async (req, res) => {
    try {
        const { userId } = req.params;
        const portfolioData = req.body;
        
        // Validate required fields
        if (!portfolioData.holdings || !portfolioData.walletBalance) {
            return res.status(400).json({
                success: false,
                error: 'Missing required portfolio fields'
            });
        }
        
        // Find and update portfolio, or create if it doesn't exist
        let portfolio = await Portfolio.findOne({ userId });
        
        if (portfolio) {
            // Update existing portfolio
            portfolio.holdings = portfolioData.holdings;
            portfolio.transactions = portfolioData.transactions || portfolio.transactions;
            portfolio.walletBalance = portfolioData.walletBalance;
            portfolio.lastUpdated = new Date().toISOString();
            
            await portfolio.save();
        } else {
            // Create new portfolio
            portfolio = await Portfolio.create({
                userId,
                userName: portfolioData.userName || 'User',
                holdings: portfolioData.holdings,
                transactions: portfolioData.transactions || [],
                walletBalance: portfolioData.walletBalance,
                lastUpdated: new Date().toISOString()
            });
        }
        
        // Update user's wallet balance
        const user = await User.findById(userId);
        if (user) {
            user.walletBalance = portfolioData.walletBalance;
            await user.save();
        }
        
        res.json({
            success: true,
            data: portfolio
        });
    } catch (error) {
        console.error('Error in updateUserPortfolio:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};


// @route   GET /api/portfolio/stats/:userId

exports.getPortfolioStats = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Find portfolio by user ID
        const portfolio = await Portfolio.findOne({ userId });
        
        if (!portfolio) {
            return res.status(404).json({
                success: false,
                error: 'Portfolio not found for this user'
            });
        }
        
        // Calculate portfolio statistics
        const totalValue = portfolio.calculateTotalValue();
        const totalProfitLoss = portfolio.calculateTotalProfitLoss();
        const profitLossPercentage = totalValue > 0 
            ? (totalProfitLoss / (totalValue - totalProfitLoss)) * 100 
            : 0;
        
        res.json({
            success: true,
            data: {
                totalValue,
                totalProfitLoss,
                profitLossPercentage,
                holdingsCount: portfolio.holdings.length,
                walletBalance: portfolio.walletBalance,
                lastUpdated: portfolio.lastUpdated
            }
        });
    } catch (error) {
        console.error('Error in getPortfolioStats:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}; 