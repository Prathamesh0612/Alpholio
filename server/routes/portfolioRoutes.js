const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getUserPortfolio,
    updateUserPortfolio,
    getPortfolioStats
} = require('../controllers/portfolioController');

// Get user portfolio
router.get('/:userId', protect, getUserPortfolio);

// Update user portfolio
router.put('/:userId', protect, updateUserPortfolio);

// Get portfolio statistics
router.get('/stats/:userId', protect, getPortfolioStats);

module.exports = router; 