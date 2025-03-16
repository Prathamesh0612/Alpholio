const mongoose = require('mongoose');

const suggestionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['stock', 'bond', 'insurance'],
        required: true
    },
    symbol: {
        type: String,
        required: true,
        uppercase: true
    },
    reason: {
        type: String,
        required: true
    },
    riskLevel: {
        type: String,
        enum: ['low', 'medium', 'high'],
        required: true
    },
    potentialReturn: {
        type: Number,
        required: true
    },
    suggestedAllocation: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: '30d' // Suggestions expire after 30 days
    }
});

module.exports = mongoose.model('Suggestion', suggestionSchema); 