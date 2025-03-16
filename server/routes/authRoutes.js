const express = require('express');
const router = express.Router();
const {
    register,
    login,
    logout,
    getMe,
    deleteUser
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/logout', protect, logout);
router.get('/me', protect, getMe);
router.delete('/delete', protect, deleteUser);

module.exports = router; 