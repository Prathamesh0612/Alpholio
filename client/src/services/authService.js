import api from './api';

export const authService = {
    async register(userData) {
        try {
            const response = await api.post('/auth/register', userData);
            return response.data;
        } catch (error) {
            throw this._handleError(error);
        }
    },

    async login(credentials) {
        try {
            console.log('Login credentials:', credentials);
            const response = await api.post('/auth/login', credentials);
            console.log('Login response:', response.data);
            
            // Store token in localStorage
            if (response.data.data && response.data.data.token) {
                localStorage.setItem('token', response.data.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.data));
            }
            
            return response.data;
        } catch (error) {
            console.error('Login error:', error);
            throw this._handleError(error);
        }
    },

    async logout() {
        try {
            await api.get('/auth/logout');
            window.location.href = '/login';
        } catch (error) {
            console.error('Logout error:', error);
        }
    },

    async getCurrentUser() {
        try {
            const response = await api.get('/auth/me');
            return response.data;
        } catch (error) {
            throw this._handleError(error);
        }
    },

    async isAuthenticated() {
        try {
            await this.getCurrentUser();
            return true;
        } catch (error) {
            return false;
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