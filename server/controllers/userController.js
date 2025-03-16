const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc    Get user's wallet balance
// @route   GET /api/user/wallet
// @access  Private
exports.getWalletBalance = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

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

// @desc    Add funds to wallet
// @route   POST /api/user/wallet/add
// @access  Private
exports.addFunds = async (req, res) => {
    try {
        const { amount } = req.body; // Add this line to extract amount from request body

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        user.walletBalance = Number(user.walletBalance) + Number(amount);
        await user.save();

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

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
exports.registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({
                success: false,
                error: 'User already exists'
            });
        }

        // Create new user
        const user = await User.create({
            name,
            email,
            password,
            isNewUser: true, // Mark as a new user
            walletBalance: 0  // Initialize wallet balance to zero
        });

        // Generate JWT token
        const token = generateToken(user._id);

        // Set cookie with token
        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            secure: process.env.NODE_ENV === 'production'
        });

        res.status(201).json({
            success: true,
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                isNewUser: true,
                walletBalance: user.walletBalance,
                token
            }
        });
    } catch (error) {
        console.error('Error in registerUser:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Update user's new status
// @route   PUT /api/users/update-status
// @access  Private
exports.updateNewUserStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Find user and update isNewUser status
        const user = await User.findByIdAndUpdate(
            userId,
            { isNewUser: false },
            { new: true }
        );
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        
        res.json({
            success: true,
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                isNewUser: user.isNewUser,
                walletBalance: user.walletBalance
            }
        });
    } catch (error) {
        console.error('Error in updateNewUserStatus:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};