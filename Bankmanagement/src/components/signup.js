// src/pages/Signup.js
import React, { useState, useRef } from 'react';
import axios from 'axios';
import CryptoJS from 'crypto-js'; // Import crypto-js for encryption
import './signup.css'; // Importing the custom CSS file for Signup
import { TextField, Button, Container, Typography, Box, Input, MenuItem, Select, FormControl, InputLabel } from '@mui/material';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    dob: '',
    email: '',
    panNumber: '',
    panImage: null,
    aadharNumber: '',
    aadharImage: null,
    accountType: '',
    openingBalance: '',
    password: '', // Add password to state
  });

  const [message, setMessage] = useState('');

  const API_KEY = process.env.REACT_APP_API_KEY;
  const PROJECT_ID = process.env.REACT_APP_PROJECT_ID;

  const baseStorageUrl = `https://firebasestorage.googleapis.com/v0/b/${PROJECT_ID}.appspot.com/o`;

  const panImageRef = useRef(null);
  const aadharImageRef = useRef(null);

  const handleChange = (e) => {
    if (e.target.name === 'panImage' || e.target.name === 'aadharImage') {
      setFormData({ ...formData, [e.target.name]: e.target.files[0] });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const validatePAN = (pan) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan);
  const validateAadhar = (aadhar) => /^\d{12}$/.test(aadhar);
  const validateBalance = (balance) => parseInt(balance) >= 100000;

  // Password validation
  const validatePassword = (password) => {
    const passwordPattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    return passwordPattern.test(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validatePAN(formData.panNumber)) {
      setMessage('Invalid PAN number format. Please enter a valid PAN.');
      return;
    }

    if (!validateAadhar(formData.aadharNumber)) {
      setMessage('Invalid Aadhar number. Please enter a 12-digit Aadhar number.');
      return;
    }

    if (!validateBalance(formData.openingBalance)) {
      setMessage('Opening balance must be at least 100,000.');
      return;
    }

    if (!validatePassword(formData.password)) {
      setMessage('Password must be at least 8 characters long, contain one capital letter, one number, and one special character.');
      return;
    }

    try {
      const counterUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/Counters/usercounter?key=${API_KEY}`;
      const counterResponse = await axios.get(counterUrl);

      let userCounter = counterResponse.data.fields.userCounter.integerValue;
      userCounter = parseInt(userCounter) + 1;

      await axios.patch(counterUrl, {
        fields: {
          userCounter: { integerValue: userCounter }
        }
      });

      const dobTimestamp = new Date(formData.dob).toISOString();

      let panImageUrl = '';
      if (formData.panImage) {
        const panFormData = new FormData();
        panFormData.append('file', formData.panImage);
        panFormData.append('uploadType', 'media');

        const panStorageUrl = `${baseStorageUrl}/PAN-${userCounter}?uploadType=media&key=${API_KEY}`;
        await axios.post(panStorageUrl, panFormData, { headers: { 'Content-Type': 'multipart/form-data' } });
        panImageUrl = `${baseStorageUrl}/PAN-${userCounter}?alt=media`;
      }

      let aadharImageUrl = '';
      if (formData.aadharImage) {
        const aadharFormData = new FormData();
        aadharFormData.append('file', formData.aadharImage);
        aadharFormData.append('uploadType', 'media');

        const aadharStorageUrl = `${baseStorageUrl}/AADHAR-${userCounter}?uploadType=media&key=${API_KEY}`;
        await axios.post(aadharStorageUrl, aadharFormData, { headers: { 'Content-Type': 'multipart/form-data' } });
        aadharImageUrl = `${baseStorageUrl}/AADHAR-${userCounter}?alt=media`;
      }

      // Encrypt password before storing
      const encryptedPassword = CryptoJS.AES.encrypt(formData.password, process.env.REACT_APP_SECRET_KEY).toString();

      const newUserUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/Users/${userCounter}?key=${API_KEY}`;
      const newUser = {
        fields: {
          userid: { integerValue: userCounter },
          name: { stringValue: formData.name },
          phoneNumber: { integerValue: parseInt(formData.phoneNumber) },
          dob: { timestampValue: dobTimestamp },
          email: { stringValue: formData.email },
          panNumber: { stringValue: formData.panNumber },
          PANurl: { stringValue: panImageUrl },
          aadharNumber: { integerValue: parseInt(formData.aadharNumber) },
          AADHARurl: { stringValue: aadharImageUrl },
          accountType: { stringValue: formData.accountType },
          balance: { integerValue: parseInt(formData.openingBalance) },
          password: { stringValue: encryptedPassword }, // Store encrypted password
        }
      };

      await axios.patch(newUserUrl, newUser);

      setFormData({
        name: '',
        phoneNumber: '',
        dob: '',
        email: '',
        panNumber: '',
        panImage: null,
        aadharNumber: '',
        aadharImage: null,
        accountType: '',
        openingBalance: '',
        password: '', // Reset password field
      });

      if (panImageRef.current) panImageRef.current.value = null;
      if (aadharImageRef.current) aadharImageRef.current.value = null;

      setMessage('User registered successfully!');

    } catch (error) {
      console.error('Error registering user:', error);
      setMessage('Failed to register user. Please try again.');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box className="signup-container">
        <Typography variant="h4" gutterBottom className="signup-heading">
          Signup
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            fullWidth
            required
            margin="normal"
          />
          <TextField
            label="Phone Number"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            fullWidth
            required
            margin="normal"
          />
          <TextField
            label="Date of Birth"
            name="dob"
            type="date"
            value={formData.dob}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            fullWidth
            required
            margin="normal"
          />
          <TextField
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            fullWidth
            required
            margin="normal"
          />
          <TextField
            label="PAN Number"
            name="panNumber"
            value={formData.panNumber}
            onChange={handleChange}
            fullWidth
            required
            margin="normal"
            helperText="Format: ABCDE2222M"
          />
          <Typography className="upload-label">Upload PAN Image</Typography>
          <Input
            type="file"
            name="panImage"
            onChange={handleChange}
            fullWidth
            required
            className="file-input"
            inputProps={{ accept: 'image/*' }}
            inputRef={panImageRef}
          />
          <TextField
            label="Aadhar Number"
            name="aadharNumber"
            value={formData.aadharNumber}
            onChange={handleChange}
            fullWidth
            required
            margin="normal"
            helperText="Enter 12-digit Aadhar Number"
          />
          <Typography className="upload-label">Upload Aadhar Image</Typography>
          <Input
            type="file"
            name="aadharImage"
            onChange={handleChange}
            fullWidth
            required
            className="file-input"
            inputProps={{ accept: 'image/*' }}
            inputRef={aadharImageRef}
          />

          {/* Account Type Dropdown */}
          <FormControl fullWidth required margin="normal">
            <InputLabel>Account Type</InputLabel>
            <Select
              name="accountType"
              value={formData.accountType}
              onChange={handleChange}
            >
              <MenuItem value="Savings Account">Savings Account</MenuItem>
              <MenuItem value="Current Account">Current Account</MenuItem>
            </Select>
          </FormControl>

          {/* Opening Balance Field */}
          <TextField
            label="Opening Balance"
            name="openingBalance"
            value={formData.openingBalance}
            onChange={handleChange}
            fullWidth
            required
            margin="normal"
            helperText="Minimum balance required is 100,000"
          />
          
          {/* Password Field */}
          <TextField
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            fullWidth
            required
            margin="normal"
            helperText="At least 8 characters, one uppercase letter, one number, and one special character."
          />

          <Button type="submit" variant="contained" color="primary" fullWidth className="submit-button">
            Register
          </Button>
        </form>
        {message && (
          <Typography variant="body1" color="secondary" className="message">
            {message}
          </Typography>
        )}
      </Box>
    </Container>
  );
};

export default Signup;
