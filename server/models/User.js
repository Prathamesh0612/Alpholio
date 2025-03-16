const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Portfolio = require('./Portfolio');
const Transaction = require('./Transaction');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false
    },
    isNewUser: {
        type: Boolean,
        default: true
    },
    walletBalance: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Encrypt password using bcrypt
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Cascade delete user's portfolio and transactions when user is deleted
userSchema.pre('remove', async function(next) {
    console.log(`Deleting portfolio and transactions for user ${this._id}`);
    try {
        // Delete user's portfolio
        await Portfolio.deleteOne({ userId: this._id });
        
        // Delete all user's transactions
        await Transaction.deleteMany({ userId: this._id });
        
        next();
    } catch (error) {
        next(error);
    }
});

// Log after user is deleted
userSchema.post('remove', function(doc) {
    console.log(`User ${doc._id} has been deleted along with their portfolio and transactions`);
});

// Add a method to safely delete user and all related data
userSchema.methods.deleteWithData = async function() {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        // Delete portfolio
        await Portfolio.findOneAndDelete({ userId: this._id }, { session });

        // Delete all transactions
        await Transaction.deleteMany({ userId: this._id }, { session });

        // Delete the user
        await this.remove({ session });

        await session.commitTransaction();
        console.log('Successfully deleted user and all related data');
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

module.exports = mongoose.model('User', userSchema); 