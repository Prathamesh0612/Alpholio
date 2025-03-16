const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Portfolio = require('../models/Portfolio');

/**
 * Get all transactions for the current user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getTransactions = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Find all transactions for this user
        const transactions = await Transaction.find({ userId })
            .sort({ createdAt: -1 }) // Sort by newest first
            .lean();
        
        return res.status(200).json({
            success: true,
            data: transactions
        });
    } catch (error) {
        console.error('Error in getTransactions:', error);
        return res.status(500).json({
            success: false,
            error: 'Server error while fetching transactions'
        });
    }
};

/**
 * Get transaction by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getTransactionById = async (req, res) => {
    try {
        const userId = req.user.id;
        const transactionId = req.params.id;
        
        if (!transactionId) {
            return res.status(400).json({
                success: false,
                error: 'Transaction ID is required'
            });
        }
        
        // Find the transaction
        const transaction = await Transaction.findOne({
            _id: transactionId,
            userId
        }).lean();
        
        if (!transaction) {
            return res.status(404).json({
                success: false,
                error: 'Transaction not found'
            });
        }
        
        return res.status(200).json({
            success: true,
            data: transaction
        });
    } catch (error) {
        console.error('Error in getTransactionById:', error);
        return res.status(500).json({
            success: false,
            error: 'Server error while fetching transaction'
        });
    }
};

// @desc    Record a new transaction
// @route   POST /api/transactions
// @access  Private
exports.recordTransaction = async (req, res) => {
    try {
        const {
            transactionId,
            userId,
            symbol,
            quantity,
            price,
            type,
            date,
            totalValue,
            walletBalanceBefore,
            walletBalanceAfter,
            timestamp
        } = req.body;

        // Validate required fields
        if (!transactionId || !userId || !symbol || !quantity || !price || !type || !totalValue) {
            return res.status(400).json({
                success: false,
                error: 'Missing required transaction fields'
            });
        }

        // Check if transaction already exists
        const existingTransaction = await Transaction.findOne({ transactionId });
        if (existingTransaction) {
            return res.status(400).json({
                success: false,
                error: 'Transaction with this ID already exists'
            });
        }

        // Create new transaction
        const transaction = await Transaction.create({
            transactionId,
            userId,
            symbol,
            quantity,
            price,
            type,
            date: date || new Date(),
            totalValue,
            walletBalanceBefore,
            walletBalanceAfter,
            timestamp: timestamp || new Date().toISOString(),
            status: 'completed'
        });

        // Update user's wallet balance
        const user = await User.findById(userId);
        if (user) {
            user.walletBalance = walletBalanceAfter;
            await user.save();
        }

        res.status(201).json({
            success: true,
            data: transaction
        });
    } catch (error) {
        console.error('Error in recordTransaction:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Get all transactions for a user
// @route   GET /api/transactions/user/:userId
// @access  Private
exports.getUserTransactions = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Get transactions for the user, sorted by date (newest first)
        const transactions = await Transaction.find({ userId })
            .sort({ date: -1 });
        
        res.json({
            success: true,
            count: transactions.length,
            data: transactions
        });
    } catch (error) {
        console.error('Error in getUserTransactions:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Get a single transaction by ID
// @route   GET /api/transactions/:id
// @access  Private
exports.getTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);
        
        if (!transaction) {
            return res.status(404).json({
                success: false,
                error: 'Transaction not found'
            });
        }
        
        res.json({
            success: true,
            data: transaction
        });
    } catch (error) {
        console.error('Error in getTransaction:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Get transaction statistics for a user
// @route   GET /api/transactions/stats/:userId
// @access  Private
exports.getTransactionStats = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Get total buy and sell amounts
        const buyTransactions = await Transaction.find({ 
            userId, 
            type: 'buy' 
        });
        
        const sellTransactions = await Transaction.find({ 
            userId, 
            type: 'sell' 
        });
        
        const totalBuyAmount = buyTransactions.reduce((total, t) => total + t.totalValue, 0);
        const totalSellAmount = sellTransactions.reduce((total, t) => total + t.totalValue, 0);
        
        // Get transaction counts
        const totalTransactions = await Transaction.countDocuments({ userId });
        const buyCount = buyTransactions.length;
        const sellCount = sellTransactions.length;
        
        // Get most recent transaction
        const recentTransaction = await Transaction.findOne({ userId })
            .sort({ date: -1 });
        
        res.json({
            success: true,
            data: {
                totalTransactions,
                buyCount,
                sellCount,
                totalBuyAmount,
                totalSellAmount,
                netTrading: totalSellAmount - totalBuyAmount,
                recentTransaction
            }
        });
    } catch (error) {
        console.error('Error in getTransactionStats:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}; 