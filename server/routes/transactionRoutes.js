const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    recordTransaction,
    getUserTransactions,
    getTransaction,
    getTransactionStats
} = require('../controllers/transactionController');

// Record a new transaction
router.post('/', protect, recordTransaction);

// Get all transactions for a user
router.get('/user/:userId', protect, getUserTransactions);

// Get a single transaction
router.get('/:id', protect, getTransaction);

// Get transaction statistics for a user
router.get('/stats/:userId', protect, getTransactionStats);

module.exports = router; 