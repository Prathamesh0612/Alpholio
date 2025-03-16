const axios = require('axios');

class AlphaVantageAPI {
    constructor() {
        this.apiKey = process.env.ALPHA_VANTAGE_API_KEY;
        this.baseURL = 'https://www.alphavantage.co/query';
    }

    async getStockQuote(symbol) {
        try {
            const response = await axios.get(this.baseURL, {
                params: {
                    function: 'GLOBAL_QUOTE',
                    symbol,
                    apikey: this.apiKey
                }
            });

            if (response.data['Global Quote']) {
                const quote = response.data['Global Quote'];
                return {
                    symbol: quote['01. symbol'],
                    price: parseFloat(quote['05. price']),
                    volume: parseInt(quote['06. volume']),
                    lastUpdated: quote['07. latest trading day']
                };
            }
            throw new Error('No quote data available');
        } catch (error) {
            console.error(`Error fetching stock quote: ${error.message}`);
            throw error;
        }
    }

    async getStockHistory(symbol, interval = 'daily') {
        try {
            const response = await axios.get(this.baseURL, {
                params: {
                    function: `TIME_SERIES_${interval.toUpperCase()}`,
                    symbol,
                    apikey: this.apiKey
                }
            });

            if (response.data[`Time Series (${interval})`]) {
                return response.data[`Time Series (${interval})`];
            }
            throw new Error('No historical data available');
        } catch (error) {
            console.error(`Error fetching stock history: ${error.message}`);
            throw error;
        }
    }

    // Rate limit handling
    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Implement rate limiting
    async handleRateLimit(error) {
        if (error.response && error.response.status === 429) {
            console.log('Rate limit reached, waiting for 60 seconds...');
            await this.sleep(60000);
            return true;
        }
        return false;
    }
}

module.exports = new AlphaVantageAPI(); 