const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getSuggestions,
    generateSuggestions,
    updateSuggestion
} = require('../controllers/suggestionController');

router.get('/', protect, getSuggestions);
router.post('/generate', protect, generateSuggestions);

router.route('/:id')
    .put(updateSuggestion);

module.exports = router; 