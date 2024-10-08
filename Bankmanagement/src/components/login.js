// src/pages/Login.js
import React, { useState } from 'react';
import axios from 'axios';
import './login.css'; // Import the custom CSS file for Login
import { TextField, Button, Container, Typography, Box, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CryptoJS from 'crypto-js'; // Import CryptoJS for encryption/decryption

const Login = () => {
  const [customerId, setCustomerId] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  
  const API_KEY = process.env.REACT_APP_API_KEY;
  const PROJECT_ID = process.env.REACT_APP_PROJECT_ID;
  
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.get(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/Customers/${customerId}?key=${API_KEY}`);
      const customerData = response.data.fields;

      // Decrypt the stored password for comparison
      const decryptedPassword = CryptoJS.AES.decrypt(customerData.password.stringValue, process.env.REACT_APP_SECRET_KEY).toString(CryptoJS.enc.Utf8);

      if (decryptedPassword === password) {
        // Store customer ID in localStorage
        localStorage.setItem('customerId', customerId); // Store customer ID

        navigate('/customermenu'); // Navigate to CustomerMenu.js
      } else {
        setMessage('Incorrect password. Please try again.'); // Humble error message
      }
    } catch (error) {
      console.error('Error logging in:', error);
      setMessage('Customer ID not found. Please check your ID and try again.'); // Humble error message
    }
  };

  return (
    <Container maxWidth="sm">
      <Box className="login-container">
        <Typography variant="h4" gutterBottom className="login-heading">
          Welcome to Our Bank!
        </Typography>
        <Typography variant="body1" className="welcome-message">
          We're excited to have you here! Please log in to manage your account.
        </Typography>
        <form onSubmit={handleLogin}>
          <TextField
            label="Customer ID"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            fullWidth
            required
            margin="normal"
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            required
            margin="normal"
          />
          <Button type="submit" variant="contained" color="primary" fullWidth className="login-button">
            Login
          </Button>
        </form>
        {message && (
          <Typography variant="body1" color="secondary" className="message">
            {message}
          </Typography>
        )}
      </Box>
      
      {/* Loan Products Section */}
      <Box className="loan-info-container" sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Explore Our Loan Products
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Box className="loan-item">
              <Typography variant="h6">Personal Loan</Typography>
              <Typography variant="body2">Interest Rate: 10% p.a.</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box className="loan-item">
              <Typography variant="h6">Home Loan</Typography>
              <Typography variant="body2">Interest Rate: 8.5% p.a.</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box className="loan-item">
              <Typography variant="h6">Car Loan</Typography>
              <Typography variant="body2">Interest Rate: 9% p.a.</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box className="loan-item">
              <Typography variant="h6">Education Loan</Typography>
              <Typography variant="body2">Interest Rate: 7% p.a.</Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default Login;
