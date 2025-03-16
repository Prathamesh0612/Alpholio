const express = require('express');
const router = express.Router();
const { getWalletBalance, addFunds } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const {
    registerUser,
    updateNewUserStatus
} = require('../controllers/userController');

// Protect all routes
router.use(protect);

router.get('/wallet', getWalletBalance);
router.post('/wallet/add', addFunds);

// Register a new user
router.post('/register', registerUser);

// Update user's new status
router.put('/update-status', protect, updateNewUserStatus);

module.exports = router; 