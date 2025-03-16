import api from './api';

export const portfolioService = {
    async getPortfolio() {
        try {
            const response = await api.get('/portfolio');
            return response.data;
        } catch (error) {
            throw this._handleError(error);
        }
    },

    async addInvestment(investmentData) {
        try {
            const response = await api.post('/portfolio/investments', investmentData);
            return response.data;
        } catch (error) {
            throw this._handleError(error);
        }
    },

    async updateInvestment(id, investmentData) {
        try {
            const response = await api.put(`/portfolio/investments/${id}`, investmentData);
            return response.data;
        } catch (error) {
            throw this._handleError(error);
        }
    },

    async deleteInvestment(id) {
        try {
            await api.delete(`/portfolio/investments/${id}`);
        } catch (error) {
            throw this._handleError(error);
        }
    },

    _handleError(error) {
        if (error.response) {
            const message = error.response.data.error || 'An error occurred';
            return new Error(message);
        }
        return new Error('Request failed');
    }
}; 