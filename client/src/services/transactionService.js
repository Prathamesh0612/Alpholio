import axios from 'axios';

/**
 * Service for handling transaction-related API calls
 */
export const transactionService = {
    /**
     * Get all transactions for the current user
     * @returns {Promise<Array>} Array of transaction objects
     */
    async getTransactions() {
        try {
            // Update auth token
            const token = localStorage.getItem('token');
            if (token) {
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            }
            
            const response = await axios.get('/api/user/transactions');
            
            if (response.data?.success) {
                return response.data.data;
            } else {
                throw new Error(response.data?.error || 'Failed to fetch transactions');
            }
        } catch (error) {
            console.error('Error in getTransactions:', error);
            throw error;
        }
    },

    /**
     * Get transaction details by ID
     * @param {string} transactionId - The ID of the transaction to fetch
     * @returns {Promise<Object>} Transaction object
     */
    async getTransactionById(transactionId) {
        try {
            // Update auth token
            const token = localStorage.getItem('token');
            if (token) {
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            }
            
            const response = await axios.get(`/api/user/transactions/${transactionId}`);
            
            if (response.data?.success) {
                return response.data.data;
            } else {
                throw new Error(response.data?.error || 'Failed to fetch transaction details');
            }
        } catch (error) {
            console.error('Error in getTransactionById:', error);
            throw error;
        }
    }
};

export default transactionService; 