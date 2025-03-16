import axios from 'axios';

/**
 * Service for handling wallet-related API calls
 */
export const walletService = {
    /**
     * Get the user's wallet balance
     * @returns {Promise<number>} The wallet balance
     */
    async getBalance() {
        try {
            // Update auth token
            const token = localStorage.getItem('token');
            if (token) {
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            } else {
                throw new Error('No authentication token found');
            }
            
            // Set base URL if not already set
            if (!axios.defaults.baseURL) {
                axios.defaults.baseURL = 'http://localhost:5000';
            }
            
            const response = await axios.get('/api/user/wallet');
            
            if (response.data?.success) {
                return response.data.balance;
            } else {
                throw new Error(response.data?.error || 'Failed to fetch wallet balance');
            }
        } catch (error) {
            console.error('Error in getBalance:', error);
            throw error;
        }
    },

    /**
     * Add funds to the user's wallet
     * @param {number} amount - The amount to add
     * @returns {Promise<number>} The new wallet balance
     */
    async addFunds(amount) {
        try {
            // Update auth token
            const token = localStorage.getItem('token');
            if (token) {
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            } else {
                throw new Error('No authentication token found');
            }
            
            // Set base URL if not already set
            if (!axios.defaults.baseURL) {
                axios.defaults.baseURL = 'http://localhost:5000';
            }
            
            const response = await axios.post('/api/user/wallet/add', { amount });
            
            if (response.data?.success) {
                return response.data.balance;
            } else {
                throw new Error(response.data?.error || 'Failed to add funds');
            }
        } catch (error) {
            console.error('Error in addFunds:', error);
            throw error;
        }
    }
};

export default walletService; 