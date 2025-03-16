import api from './api';

class SuggestionService {
    async getSuggestions() {
        try {
            const response = await api.get('/suggestions');
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async generateSuggestions() {
        try {
            const response = await api.post('/suggestions/generate');
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async updateSuggestionStatus(id, status) {
        try {
            const response = await api.put(`/suggestions/${id}`, { status });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    handleError(error) {
        if (error.response) {
            // Server responded with error
            return new Error(error.response.data.error || 'Server error occurred');
        } else if (error.request) {
            // Request made but no response
            return new Error('No response from server');
        } else {
            // Something else went wrong
            return new Error('Failed to make request');
        }
    }
}

export const suggestionService = new SuggestionService(); 