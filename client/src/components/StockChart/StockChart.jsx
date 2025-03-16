import React, { useEffect } from 'react';
import { Box, Typography } from '@mui/material';

function StockChart({ symbol }) {
    useEffect(() => {
        // Create TradingView Widget
        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/tv.js';
        script.async = true;
        script.onload = () => {
            new window.TradingView.widget({
                width: '100%',
                height: 500,
                symbol: `BSE:${symbol.replace('.BSE', '')}`,
                interval: 'D',
                timezone: 'Asia/Kolkata',
                theme: 'light',
                style: '1',
                locale: 'in',
                toolbar_bg: '#f1f3f6',
                enable_publishing: false,
                allow_symbol_change: true,
                container_id: 'tradingview_chart'
            });
        };
        document.head.appendChild(script);

        return () => {
            document.head.removeChild(script);
        };
    }, [symbol]);

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
                {symbol.replace('.BSE', '')} Price Chart
            </Typography>
            <div id="tradingview_chart" />
        </Box>
    );
}

export default StockChart; 