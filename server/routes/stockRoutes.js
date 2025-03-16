const express = require('express');
const router = express.Router();
const {
    getStocks,
    getStockBySymbol,
    buyStock,
    sellStock,
    getStockDetails,
    getStockChartData
} = require('../controllers/stockController');
const { protect } = require('../middleware/authMiddleware');

// Apply authentication middleware
router.use(protect);

// Stock listing and search
router.get('/', getStocks);

// Stock details
router.get('/details/:symbol', getStockDetails);

// Trading endpoints
router.post('/buy', buyStock);
router.post('/sell', sellStock);

// Chart data
router.get('/:symbol/chart', getStockChartData);

module.exports = router; 