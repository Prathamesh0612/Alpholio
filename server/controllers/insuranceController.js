const Insurance = require('../models/Insurance.js');
const User = require('../models/User.js');
const Portfolio = require('../models/Portfolio.js');
const Transaction = require('../models/Transaction.js');

// @desc    Get all insurance policies
// @route   GET /api/insurance
// @access  Private
exports.getInsurancePolicies = async (req, res) => {
    try {
        const policies = await Insurance.find();
        res.json({
            success: true,
            count: policies.length,
            data: policies
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Get insurance policy by ID
// @route   GET /api/insurance/:id
// @access  Private
exports.getInsuranceById = async (req, res) => {
    try {
        const policy = await Insurance.findById(req.params.id);
        
        if (!policy) {
            return res.status(404).json({
                success: false,
                error: 'Insurance policy not found'
            });
        }

        res.json({
            success: true,
            data: policy
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Purchase insurance policy
// @route   POST /api/insurance/purchase
// @access  Private
exports.purchaseInsurance = async (req, res) => {
    try {
        const { policyId } = req.body;
        const userId = req.user.id;

        // Find insurance policy
        const policy = await Insurance.findById(policyId);
        if (!policy) {
            return res.status(404).json({
                success: false,
                error: 'Insurance policy not found'
            });
        }

        // Check user's wallet balance
        const user = await User.findById(userId);
        if (user.walletBalance < policy.premiumAmount) {
            return res.status(400).json({
                success: false,
                error: 'Insufficient funds for premium payment'
            });
        }

        // Check if user already has this policy
        const portfolio = await Portfolio.findOne({ userId });
        if (portfolio) {
            const existingPolicy = portfolio.assets.find(
                asset => asset.assetId.toString() === policy._id.toString()
            );

            if (existingPolicy) {
                return res.status(400).json({
                    success: false,
                    error: 'You already have this insurance policy'
                });
            }
        }

        // Create transaction
        const transaction = await Transaction.create({
            userId,
            assetId: policy._id,
            assetType: 'Insurance',
            type: 'buy',
            quantity: 1,
            price: policy.premiumAmount,
            totalAmount: policy.premiumAmount
        });

        // Update user's wallet
        user.walletBalance -= policy.premiumAmount;
        await user.save();

        // Update or create portfolio entry
        if (!portfolio) {
            await Portfolio.create({
                userId,
                assets: [{
                    assetId: policy._id,
                    assetType: 'Insurance',
                    quantity: 1,
                    avgPrice: policy.premiumAmount,
                    currentValue: policy.coverageAmount
                }],
                totalValue: policy.coverageAmount
            });
        } else {
            portfolio.assets.push({
                assetId: policy._id,
                assetType: 'Insurance',
                quantity: 1,
                avgPrice: policy.premiumAmount,
                currentValue: policy.coverageAmount
            });

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