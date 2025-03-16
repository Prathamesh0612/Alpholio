import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout/Layout';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import Portfolio from './pages/Portfolio/Portfolio';
import Landing from './pages/Landing/Landing';
import Suggestions from './pages/Suggestions/Suggestions';
import OrderHistory from './pages/OrderHistory/OrderHistory';
import { authService } from './services/authService';
import { CircularProgress, Box } from '@mui/material';
import React from 'react';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';

console.log('App is rendering'); // Debug log

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false
        }
    }
});

// Router configuration with future flags
const routerConfig = {
    future: {
        v7_startTransition: true,
        v7_relativeSplatPath: true
    }
};

// Protected Route component
const ProtectedRoute = ({ children }) => {
    const [isLoading, setIsLoading] = React.useState(true);
    const [isAuthenticated, setIsAuthenticated] = React.useState(false);

    React.useEffect(() => {
        console.log('ProtectedRoute effect running'); // Debug log
        const checkAuth = async () => {
            try {
                const isAuth = await authService.isAuthenticated();
                console.log('Auth check result:', isAuth); // Debug log
                setIsAuthenticated(isAuth);
            } catch (error) {
                console.error('Auth check failed:', error);
                setIsAuthenticated(false);
            } finally {
                setIsLoading(false);
            }
        };
        checkAuth();
    }, []);

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    return <Layout>{children}</Layout>;
};

function App() {
    React.useEffect(() => {
        console.log('App mounted'); // Debug log
    }, []);

    return (
        <QueryClientProvider client={queryClient}>
            <Router {...routerConfig}>
                <ErrorBoundary fallback={<div>Something went wrong!</div>}>
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/" element={<Landing />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        
                        {/* Protected Routes */}
                        <Route path="/dashboard" element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        } />
                        <Route path="/portfolio" element={
                            <ProtectedRoute>
                                <Portfolio />
                            </ProtectedRoute>
                        } />
                        <Route path="/suggestions" element={
                            <ProtectedRoute>
                                <Suggestions />
                            </ProtectedRoute>
                        } />
                        <Route path="/order-history" element={
                            <ProtectedRoute>
                                <OrderHistory />
                            </ProtectedRoute>
                        } />
                        
                        {/* Catch all route for 404 */}
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                </ErrorBoundary>
            </Router>
        </QueryClientProvider>
    );
}

export default App;
