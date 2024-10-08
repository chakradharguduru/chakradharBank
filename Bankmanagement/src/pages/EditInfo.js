import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './EditInfo.css';
import { Box, Typography, TextField, Button, CircularProgress } from '@mui/material';
import CryptoJS from 'crypto-js';

const EditInfo = () => {
  const [customer, setCustomer] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [editing, setEditing] = useState(false);

  const customerId = localStorage.getItem('customerId'); // Retrieve customerId from local storage
  const API_KEY = process.env.REACT_APP_API_KEY;
  const PROJECT_ID = process.env.REACT_APP_PROJECT_ID;
  const SECRET_KEY = process.env.REACT_APP_SECRET_KEY;

  useEffect(() => {
    if (customerId) {
      fetchCustomerData();
    } else {
      setMessage('Customer ID not found. Please log in again.');
      setLoading(false);
    }
  }, [customerId]);

  // Fetch customer details from Firestore
  const fetchCustomerData = async () => {
    try {
      const response = await axios.get(
        `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/Customers/${customerId}?key=${API_KEY}`
      );
      const customerData = response.data.fields;

      // Decrypt the password before displaying
      const decryptedPassword = CryptoJS.AES.decrypt(customerData.password.stringValue, SECRET_KEY).toString(CryptoJS.enc.Utf8);

      // Format DOB as DD/MM/YYYY
      const formattedDOB = new Date(customerData.dob.timestampValue)
        .toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

      setCustomer({
        customerId: customerId,
        name: customerData.name.stringValue,
        email: customerData.email.stringValue,
        dob: formattedDOB, // Display formatted DOB
        password: decryptedPassword, // Decrypt and display password
        phoneNumber: customerData.phoneNumber.integerValue, // Retrieve as integer
        panNumber: customerData.panNumber.stringValue,
        aadharNumber: customerData.aadharNumber.integerValue, // Retrieve as integer
        AADHARurl: customerData.AADHARurl.stringValue,
        PANurl: customerData.PANurl.stringValue,
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching customer data:', error);
      setMessage('Failed to load customer data. Please try again.');
      setLoading(false);
    }
  };

  // Handle input change for editable fields
  const handleChange = (e) => {
    setCustomer({ ...customer, [e.target.name]: e.target.value });
  };

  // Validate password against the given pattern
  const validatePassword = (password) => {
    const passwordPattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    return passwordPattern.test(password);
  };

  // Save edited information to Firestore
  const saveCustomerData = async () => {
    // Validate password
    if (!validatePassword(customer.password)) {
      setMessage('Password must contain at least 8 characters, including one uppercase letter, one number, and one special character.');
      return;
    }

    // Encrypt the password before saving
    const encryptedPassword = CryptoJS.AES.encrypt(customer.password, SECRET_KEY).toString();

    // Prepare updated fields, including all original fields
    const updatedData = {
      fields: {
        name: { stringValue: customer.name },
        email: { stringValue: customer.email },
        phoneNumber: { integerValue: customer.phoneNumber }, // Save as integer
        password: { stringValue: encryptedPassword }, // Save encrypted password
        dob: { timestampValue: new Date(customer.dob.split('/').reverse().join('-')).toISOString() }, // Convert to Firestore timestamp format
        panNumber: { stringValue: customer.panNumber },
        aadharNumber: { integerValue: customer.aadharNumber }, // Save as integer
        AADHARurl: { stringValue: customer.AADHARurl },
        PANurl: { stringValue: customer.PANurl },
      },
    };

    try {
      await axios.patch(
        `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/Customers/${customerId}?key=${API_KEY}`,
        updatedData
      );
      setMessage('Information updated successfully!');
      setEditing(false);
    } catch (error) {
      console.error('Error updating customer data:', error);
      setMessage('Failed to update customer data. Please try again.');
    }
  };

  return (
    <div className="edit-info-container">
      {loading ? (
        <CircularProgress />
      ) : (
        <Box className="customer-info-box">
          <Typography variant="h4" className="customer-info-title">Customer Information</Typography>
          {message && <Typography className="message" color="secondary">{message}</Typography>}

          {/* Customer Information Form */}
          <form className="customer-info-form">
            <TextField
              label="Customer ID"
              name="customerId"
              value={customer.customerId}
              variant="outlined"
              fullWidth
              disabled
              className="input-field"
            />
            <TextField
              label="Name"
              name="name"
              value={customer.name}
              variant="outlined"
              fullWidth
              className="input-field"
              disabled={!editing}
              onChange={handleChange}
            />
            <TextField
              label="Email"
              name="email"
              value={customer.email}
              variant="outlined"
              fullWidth
              className="input-field"
              disabled={!editing}
              onChange={handleChange}
            />
            <TextField
              label="Date of Birth (DD/MM/YYYY)"
              name="dob"
              value={customer.dob}
              variant="outlined"
              fullWidth
              className="input-field"
              disabled
            />
            <TextField
              label="Phone Number"
              name="phoneNumber"
              value={customer.phoneNumber}
              variant="outlined"
              fullWidth
              className="input-field"
              disabled={!editing}
              onChange={handleChange}
            />
            <TextField
              label="PAN Number"
              name="panNumber"
              value={customer.panNumber}
              variant="outlined"
              fullWidth
              className="input-field"
              disabled
            />
            <TextField
              label="Aadhar Number"
              name="aadharNumber"
              value={customer.aadharNumber}
              variant="outlined"
              fullWidth
              className="input-field"
              disabled
            />
            <TextField
              label="Password"
              name="password"
              value={customer.password}
              variant="outlined"
              fullWidth
              className="input-field"
              disabled={!editing}
              onChange={handleChange}
            />

            {/* Display Aadhar and PAN images */}
            <Box className="image-section">
              <Typography variant="h6">Aadhar Card</Typography>
              {customer.AADHARurl ? (
                <img src={customer.AADHARurl} alt="Aadhar" className="image-preview" />
              ) : (
                <Typography>No Aadhar image available.</Typography>
              )}

              <Typography variant="h6">PAN Card</Typography>
              {customer.PANurl ? (
                <img src={customer.PANurl} alt="PAN" className="image-preview" />
              ) : (
                <Typography>No PAN image available.</Typography>
              )}
            </Box>

            {/* Save and Edit Buttons */}
            <Box className="action-buttons">
              {!editing ? (
                <Button variant="contained" onClick={() => setEditing(true)}>
                  Edit
                </Button>
              ) : (
                <Button variant="contained" color="primary" onClick={saveCustomerData}>
                  Save
                </Button>
              )}
              {editing && (
                <Button variant="contained" color="secondary" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              )}
            </Box>
          </form>
        </Box>
      )}
    </div>
  );
};

export default EditInfo;
