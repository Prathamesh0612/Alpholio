const Bond = require('../models/Bond.js');
const User = require('../models/User.js');
const Portfolio = require('../models/Portfolio.js');
const Transaction = require('../models/Transaction.js');


// @route   GET /api/bonds

exports.getBonds = async (req, res) => {
    try {
        const bonds = await Bond.find();
        res.json({
            success: true,
            count: bonds.length,
            data: bonds
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Get bond by ID
// @route   GET /api/bonds/:id
// @access  Private
exports.getBondById = async (req, res) => {
    try {
        const bond = await Bond.findById(req.params.id);
        
        if (!bond) {
            return res.status(404).json({
                success: false,
                error: 'Bond not found'
            });
        }

        res.json({
            success: true,
            data: bond
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Buy bond
// @route   POST /api/bonds/buy
// @access  Private
exports.buyBond = async (req, res) => {
    try {
        const { bondId, quantity } = req.body;
        const userId = req.user.id;

        // Find bond
        const bond = await Bond.findById(bondId);
        if (!bond) {
            return res.status(404).json({
                success: false,
                error: 'Bond not found'
            });
        }

        const totalCost = bond.price * quantity;

        // Check minimum investment
        if (totalCost < bond.minimumInvestment) {
            return res.status(400).json({
                success: false,
                error: `Minimum investment required is ${bond.minimumInvestment}`
            });
        }

        // Check user's wallet balance
        const user = await User.findById(userId);
        if (user.walletBalance < totalCost) {
            return res.status(400).json({
                success: false,
                error: 'Insufficient funds'
            });
        }

        // Create transaction
        const transaction = await Transaction.create({
            userId,
            assetId: bond._id,
            assetType: 'Bond',
            type: 'buy',
            quantity,
            price: bond.price,
            totalAmount: totalCost
        });

        // Update user's wallet
        user.walletBalance -= totalCost;
        await user.save();

        // Update or create portfolio entry
        const portfolio = await Portfolio.findOne({ userId });
        if (!portfolio) {
            await Portfolio.create({
                userId,
                assets: [{
                    assetId: bond._id,
                    assetType: 'Bond',
                    quantity,
                    avgPrice: bond.price,
                    currentValue: totalCost
                }],
                totalValue: totalCost
            });
        } else {
            const existingAsset = portfolio.assets.find(
                asset => asset.assetId.toString() === bond._id.toString()
            );

            if (existingAsset) {
                const newQuantity = existingAsset.quantity + quantity;
                const newAvgPrice = ((existingAsset.avgPrice * existingAsset.quantity) + totalCost) / newQuantity;
                existingAsset.quantity = newQuantity;
                existingAsset.avgPrice = newAvgPrice;
                existingAsset.currentValue = newQuantity * bond.price;
            } else {
                portfolio.assets.push({
                    assetId: bond._id,
                    assetType: 'Bond',
                    quantity,
                    avgPrice: bond.price,
                    currentValue: totalCost
                });
            }

            portfolio.totalValue = portfolio.assets.reduce((total, asset) => total + asset.currentValue, 0);
            await portfolio.save();
        }

        res.json({
            success: true,
            data: {
                transaction,
                newBalance: user.walletBalance
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Sell bond
// @route   POST /api/bonds/sell
// @access  Private
exports.sellBond = async (req, res) => {
    try {
        const { bondId, quantity } = req.body;
        const userId = req.user.id;

        // Find bond
        const bond = await Bond.findById(bondId);
        if (!bond) {
            return res.status(404).json({
                success: false,
                error: 'Bond not found'
            });
        }

        const totalAmount = bond.price * quantity;

        // Check if user has enough bonds to sell
        const portfolio = await Portfolio.findOne({ userId });
        const existingAsset = portfolio.assets.find(
            asset => asset.assetId.toString() === bond._id.toString()
        );

        if (!existingAsset || existingAsset.quantity < quantity) {
            return res.status(400).json({
                success: false,
                error: 'Insufficient bonds'
            });
        }

        // Create transaction
        const transaction = await Transaction.create({
            userId,
            assetId: bond._id,
            assetType: 'Bond',
            type: 'sell',
            quantity,
            price: bond.price,
            totalAmount
        });

        // Update user's wallet
        const user = await User.findById(userId);
        user.walletBalance += totalAmount;
        await user.save();

        // Update portfolio
        existingAsset.quantity -= quantity;
        existingAsset.currentValue = existingAsset.quantity * bond.price;

        if (existingAsset.quantity === 0) {
            portfolio.assets = portfolio.assets.filter(
                asset => asset.assetId.toString() !== bond._id.toString()
            );
        }

        portfolio.totalValue = portfolio.assets.reduce((total, asset) => total + asset.currentValue, 0);
        await portfolio.save();

        res.json({
            success: true,
            data: {
                transaction,
                newBalance: user.walletBalance
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
}; 