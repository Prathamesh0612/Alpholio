const mongoose = require('mongoose');

const insuranceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add insurance policy name'],
        unique: true
    },
    provider: {
        type: String,
        required: [true, 'Please add insurance provider']
    },
    premiumAmount: {
        type: Number,
        required: [true, 'Please add premium amount']
    },
    coverageAmount: {
        type: Number,
        required: [true, 'Please add coverage amount']
    },
    duration: {
        type: Number,
        required: [true, 'Please add duration in months']
    },
    type: {
        type: String,
        enum: ['Life', 'Health', 'Property', 'Vehicle'],
        required: true
    },
    description: {
        type: String,
        required: [true, 'Please add policy description']
    },
    benefits: [{
        type: String
    }],
    terms: [{
        type: String
    }]
});

module.exports = mongoose.model('Insurance', insuranceSchema); 