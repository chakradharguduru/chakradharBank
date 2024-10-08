// src/pages/DepWit.js

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Container, Typography, TextField, Button, Box } from '@mui/material';
import './DepWit.css';

const DepWit = () => {
  const [customerId, setCustomerId] = useState(localStorage.getItem('customerId') || '');
  const [accounts, setAccounts] = useState([]);
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');

  const API_KEY = process.env.REACT_APP_API_KEY;
  const PROJECT_ID = process.env.REACT_APP_PROJECT_ID;

  useEffect(() => {
    if (customerId) {
      fetchData();
    }
  }, [customerId]);

  // Fetch account details using customerId
  const fetchData = async () => {
    try {
      const accountResponse = await axios.get(
        `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/Accounts/${customerId}?key=${API_KEY}`
      );
      const accountData = accountResponse.data.fields;
      if (accountData) {
        const accountList = accountData.accounts.arrayValue.values.map(acc => acc.mapValue.fields);
        setAccounts(accountList);
      } else {
        setAccounts([]);
        setMessage('No accounts found for this customer ID.');
      }
    } catch (error) {
      console.error('Error fetching account details:', error);
      setMessage('Failed to fetch account details. Please try again.');
    }
  };

  // Handle deposit action
  const handleDeposit = async (account) => {
    const depositAmount = parseInt(amount, 10); // Convert the amount to an integer
    const transferLimit = parseInt(account.transferlimit?.integerValue || 0, 10);

    if (depositAmount <= 0 || isNaN(depositAmount)) {
      setMessage('Please enter a valid deposit amount.');
      return;
    }

    if (depositAmount > transferLimit) {
      setMessage(`Deposit amount exceeds the transfer limit of ₹${transferLimit}.`);
      return;
    }

    const currentBalance = parseInt(account.balance.integerValue || 0, 10);
    const newBalance = currentBalance + depositAmount;
    updateBalance(account, newBalance);
  };

  // Handle withdraw action
  const handleWithdraw = async (account) => {
    const withdrawAmount = parseInt(amount, 10); // Convert the amount to an integer
    const currentBalance = parseInt(account.balance.integerValue || 0, 10);
    const transferLimit = parseInt(account.transferlimit?.integerValue || 0, 10);

    if (withdrawAmount <= 0 || isNaN(withdrawAmount)) {
      setMessage('Please enter a valid withdraw amount.');
      return;
    }

    if (withdrawAmount > transferLimit) {
      setMessage(`Withdraw amount exceeds the transfer limit of ₹${transferLimit}.`);
      return;
    }

    if (withdrawAmount > currentBalance) {
      setMessage('Insufficient balance.');
      return;
    }

    const newBalance = currentBalance - withdrawAmount;
    updateBalance(account, newBalance);
  };

  // Update balance in Firestore
  const updateBalance = async (account, newBalance) => {
    try {
      const accountIndex = accounts.findIndex(acc => acc.accountNumber.integerValue === account.accountNumber.integerValue);
      const updatedAccounts = [...accounts];
      updatedAccounts[accountIndex].balance = { integerValue: newBalance }; // Update balance as integer

      await axios.patch(
        `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/Accounts/${customerId}?key=${API_KEY}`,
        {
          fields: {
            accounts: {
              arrayValue: {
                values: updatedAccounts.map(account => ({
                  mapValue: {
                    fields: account,
                  },
                })),
              },
            },
          },
        }
      );

      setAccounts(updatedAccounts);
      setMessage('Transaction successful!');
      setAmount(''); // Reset the amount input field
    } catch (error) {
      console.error('Error updating account balance:', error);
      setMessage('Failed to update balance. Please try again.');
    }
  };

  return (
    <Container maxWidth="sm">
      <Typography variant="h4" gutterBottom>Deposit & Withdraw</Typography>
      <Typography variant="h6">Customer ID: {customerId}</Typography>
      
      {accounts.length > 0 ? (
        <div className="account-details">
          {accounts.map((account, index) => (
            <Box key={index} className="account-card">
              <Typography><strong>Account Number:</strong> {account.accountNumber.integerValue}</Typography>
              <Typography><strong>Account Type:</strong> {account.accountType.stringValue}</Typography>
              <Typography><strong>Balance:</strong> ₹{account.balance.integerValue || 0}</Typography>
              <Typography><strong>Transfer Limit:</strong> ₹{account.transferlimit?.integerValue || 0}</Typography>
              <Typography><strong>IFSC Code:</strong> {account.IFSC.stringValue}</Typography>

              {/* Transaction Section */}
              <TextField
                label="Amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                fullWidth
                margin="normal"
              />
              <Button variant="contained" color="primary" onClick={() => handleDeposit(account)} style={{ marginRight: '10px' }}>
                Deposit
              </Button>
              <Button variant="contained" color="secondary" onClick={() => handleWithdraw(account)}>
                Withdraw
              </Button>
            </Box>
          ))}
        </div>
      ) : (
        <Typography>No accounts found or failed to fetch account details.</Typography>
      )}

      {message && <Typography color="secondary">{message}</Typography>}
    </Container>
  );
};

export default DepWit;
