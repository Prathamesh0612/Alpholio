import React from 'react';
import { Box, Typography, Button, Container, Paper } from '@mui/material';

class ErrorBoundaryFallback extends React.Component {
    render() {
        const { error, resetError } = this.props;
        return (
            <Container maxWidth="sm">
                <Box
                    sx={{
                        marginTop: 8,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    <Paper elevation={3} sx={{ p: 4, width: '100%', textAlign: 'center' }}>
                        <Typography variant="h5" component="h2" gutterBottom>
                            Oops! Something went wrong
                        </Typography>
                        <Typography variant="body1" color="text.secondary" paragraph>
                            {error.message || 'An unexpected error occurred'}
                        </Typography>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={resetError}
                            sx={{ mt: 2 }}
                        >
                            Try Again
                        </Button>
                    </Paper>
                </Box>
            </Container>
        );
    }
}

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
        this.resetError = this.resetError.bind(this);
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // Log the error to an error reporting service
        console.error('Error caught by boundary:', error, errorInfo);
    }

    resetError() {
        this.setState({ hasError: false, error: null });
    }

    render() {
        if (this.state.hasError) {
            return (
                <ErrorBoundaryFallback
                    error={this.state.error}
                    resetError={this.resetError}
                />
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary; 