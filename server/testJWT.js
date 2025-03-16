const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

console.log('Testing JWT functionality...');
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);

try {
    // Create a test token
    const testPayload = { id: 'test123' };
    const token = jwt.sign(testPayload, process.env.JWT_SECRET, {
        expiresIn: '1h'
    });
    
    console.log('Token created successfully:', token);
    
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token verified successfully:', decoded);
    
} catch (error) {
    console.error('JWT Error:', error);
} 