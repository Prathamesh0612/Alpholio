const mongoose = require('mongoose');

const bondSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a bond name'],
        unique: true
    },
    issuer: {
        type: String,
        required: [true, 'Please add bond issuer']
    },
    interestRate: {
        type: Number,
        required: [true, 'Please add interest rate']
    },
    maturityDate: {
        type: Date,
        required: [true, 'Please add maturity date']
    },
    faceValue: {
        type: Number,
        required: [true, 'Please add face value']
    },
    price: {
        type: Number,
        required: [true, 'Please add current price']
    },
    minimumInvestment: {
        type: Number,
        default: 1000
    },
    rating: {
        type: String,
        enum: ['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'CCC', 'CC', 'C', 'D']
    }
});

module.exports = mongoose.model('Bond', bondSchema); 