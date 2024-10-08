import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, AppBar, Toolbar, Grid } from '@mui/material';
import './CustomerMenu.css';

const CustomerMenu = () => {
  const [customerName, setCustomerName] = useState('');
  const [customerId, setCustomerId] = useState(localStorage.getItem('customerId')); // Get customer ID from local storage

  const navigate = useNavigate();

  useEffect(() => {
    const fetchCustomerData = async () => {
      const API_KEY = process.env.REACT_APP_API_KEY;
      const PROJECT_ID = process.env.REACT_APP_PROJECT_ID;

      try {
        const response = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/Customers/${customerId}?key=${API_KEY}`);
        const data = await response.json();
        setCustomerName(data.fields.name.stringValue); // Set customer name
      } catch (error) {
        console.error('Error fetching customer data:', error);
      }
    };

    if (customerId) {
      fetchCustomerData();
    }
  }, [customerId]);

  const handleLogout = () => {
    localStorage.removeItem('customerId'); // Clear customer ID from local storage
    navigate('/'); // Redirect to Home
  };

  return (
    <Box className="customer-menu">
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" className="title">
            Customer Menu
          </Typography>
          <Button color="inherit" onClick={handleLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Box className="welcome-section">
        <Typography variant="h4" gutterBottom>
          Welcome, {customerName}!
        </Typography>
        <Typography variant="body1">Explore our services and options below:</Typography>
      </Box>

      <Box className="services-section">
        <Typography variant="h5" gutterBottom>Services</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Button onClick={() => navigate('/viewaccounts')} variant="outlined" fullWidth className="service-button">
              View Accounts
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button onClick={() => navigate('/editinfo')} variant="outlined" fullWidth className="service-button">
              Edit Info
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button onClick={() => navigate('/applyloan')} variant="outlined" fullWidth className="service-button">
              Apply Loan
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button onClick={() => navigate('/fixeddeposit')} variant="outlined" fullWidth className="service-button">
              Fixed Deposit
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button onClick={() => navigate('/transferwithinbank')} variant="outlined" fullWidth className="service-button">
              Transfer Within Bank
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button onClick={() => navigate('/transferother')} variant="outlined" fullWidth className="service-button">
              Transfer to Other Bank
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button onClick={() => navigate('/createother')} variant="outlined" fullWidth className="service-button">
              Create Another Account
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button onClick={() => navigate('/depwit')} variant="outlined" fullWidth className="service-button">
              Deposit/Withdraw
            </Button>
          </Grid>
        </Grid>
      </Box>

      <Box className="loans-section">
        <Typography variant="h5" gutterBottom>Loans</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Box className="loan-card">
              <Typography variant="h6">Personal Loan</Typography>
              <Typography variant="body2">Interest Rate: 10% p.a.</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box className="loan-card">
              <Typography variant="h6">Home Loan</Typography>
              <Typography variant="body2">Interest Rate: 8.5% p.a.</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box className="loan-card">
              <Typography variant="h6">Car Loan</Typography>
              <Typography variant="body2">Interest Rate: 9% p.a.</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box className="loan-card">
              <Typography variant="h6">Education Loan</Typography>
              <Typography variant="body2">Interest Rate: 7% p.a.</Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>

      <Box className="fixed-deposit-section">
        <Typography variant="h5" gutterBottom>Fixed Deposits</Typography>
        <Typography variant="body1">
          Enjoy higher interest rates on your savings with our fixed deposit options. Secure your future today!
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <Box className="fd-card">
              <Typography variant="h6">Regular FD</Typography>
              <Typography variant="body2">Interest Rate: 6% p.a.</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Box className="fd-card">
              <Typography variant="h6">Tax-Saving FD</Typography>
              <Typography variant="body2">Interest Rate: 6.5% p.a.</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Box className="fd-card">
              <Typography variant="h6">Senior Citizen FD</Typography>
              <Typography variant="body2">Interest Rate: 7% p.a.</Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>

      <footer className="footer">
        <p>© 2024 Your Bank Name. All rights reserved.</p>
      </footer>
    </Box>
  );
};

export default CustomerMenu;
