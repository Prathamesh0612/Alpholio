const mongoose = require('mongoose');

const HoldingSchema = new mongoose.Schema({
    symbol: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 0
    },
    avgPrice: {
        type: Number,
        required: true,
        min: 0
    },
    currentPrice: {
        type: Number,
        required: true,
        min: 0
    }
});

const PortfolioSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    userName: {
        type: String,
        required: true
    },
    holdings: [HoldingSchema],
    transactions: [{
        transactionId: {
            type: String,
            required: true
        },
        symbol: {
            type: String,
            required: true
        },
        quantity: {
            type: Number,
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        type: {
            type: String,
            enum: ['buy', 'sell'],
            required: true
        },
        date: {
            type: Date,
            default: Date.now
        }
    }],
    walletBalance: {
        type: Number,
        required: true,
        default: 100000
    },
    lastUpdated: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

// Calculate total portfolio value
PortfolioSchema.methods.calculateTotalValue = function() {
    return this.holdings.reduce((total, holding) => {
        return total + (holding.currentPrice * holding.quantity);
    }, 0);
};

// Calculate total profit/loss
PortfolioSchema.methods.calculateTotalProfitLoss = function() {
    return this.holdings.reduce((total, holding) => {
        const profitLoss = (holding.currentPrice - holding.avgPrice) * holding.quantity;
        return total + profitLoss;
    }, 0);
};

module.exports = mongoose.model('Portfolio', PortfolioSchema); 