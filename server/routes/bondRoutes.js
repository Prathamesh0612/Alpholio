const express = require('express');
const router = express.Router();
const {
    getBonds,
    getBondById,
    buyBond,
    sellBond
} = require('../controllers/bondController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/').get(getBonds);
router.route('/:id').get(getBondById);
router.route('/buy').post(buyBond);
router.route('/sell').post(sellBond);

module.exports = router; 