const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
    symbol: {
        type: String,
        required: [true, 'Please provide the stock symbol'],
        uppercase: true,
        unique: true
    },
    name: {
        type: String,
        required: [true, 'Please provide the stock name']
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Stock', stockSchema);