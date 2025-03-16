import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Typography, 
    Paper, 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow,
    TablePagination,
    Chip,
    CircularProgress,
    Alert,
    Button,
    Snackbar
} from '@mui/material';
import { transactionService } from '../../services/transactionService';
import RefreshIcon from '@mui/icons-material/Refresh';

function OrderHistory() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'info'
    });

    const fetchTransactions = async (showLoading = true) => {
        try {
            if (showLoading) {
                setLoading(true);
            }
            const data = await transactionService.getTransactions();
            setTransactions(data);
            setError(null);
        } catch (error) {
            console.error('Error fetching transactions:', error);
            setError('Failed to load transaction history. Please try again later.');
            setSnackbar({
                open: true,
                message: 'Failed to load transactions. Please try again.',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    const handleRefresh = () => {
        fetchTransactions();
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2
        }).format(amount);
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                message={snackbar.message}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4">
                    Order History
                </Typography>
                <Button 
                    variant="outlined" 
                    startIcon={<RefreshIcon />} 
                    onClick={handleRefresh}
                    disabled={loading}
                >
                    Refresh
                </Button>
            </Box>
            
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                    <Button 
                        size="small" 
                        onClick={handleRefresh} 
                        sx={{ ml: 2 }}
                    >
                        Try Again
                    </Button>
                </Alert>
            )}
            
            <Paper sx={{ width: '100%', mb: 2 }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Date & Time</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell>Symbol</TableCell>
                                <TableCell align="right">Quantity</TableCell>
                                <TableCell align="right">Price</TableCell>
                                <TableCell align="right">Total Value</TableCell>
                                <TableCell align="right">Status</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {transactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center">
                                        <Typography variant="body1" sx={{ py: 3 }}>
                                            No transactions found
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                transactions
                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map((transaction) => (
                                        <TableRow key={transaction._id}>
                                            <TableCell>{formatDate(transaction.createdAt)}</TableCell>
                                            <TableCell>
                                                <Chip 
                                                    label={transaction.type.toUpperCase()}
                                                    color={transaction.type === 'buy' ? 'success' : 'error'}
                                                    size="small"
                                                    sx={{ fontWeight: 'bold' }}
                                                />
                                            </TableCell>
                                            <TableCell>{transaction.symbol}</TableCell>
                                            <TableCell align="right">{transaction.quantity}</TableCell>
                                            <TableCell align="right">{formatCurrency(transaction.price)}</TableCell>
                                            <TableCell align="right">{formatCurrency(transaction.amount)}</TableCell>
                                            <TableCell align="right">
                                                <Chip 
                                                    label={transaction.status.toUpperCase()}
                                                    color={
                                                        transaction.status === 'completed' ? 'primary' : 
                                                        transaction.status === 'pending' ? 'warning' : 'error'
                                                    }
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={transactions.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </Paper>
        </Box>
    );
}

export default OrderHistory; 