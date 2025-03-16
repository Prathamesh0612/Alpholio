const express = require('express');
const router = express.Router();
const {
    getInsurancePolicies,
    getInsuranceById,
    purchaseInsurance
} = require('../controllers/insuranceController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/').get(getInsurancePolicies);
router.route('/:id').get(getInsuranceById);
router.route('/purchase').post(purchaseInsurance);

module.exports = router; 