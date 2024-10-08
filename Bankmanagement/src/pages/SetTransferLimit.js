import React, { useState } from 'react';
import axios from 'axios';
import { Container, Typography, TextField, Button, Box } from '@mui/material';
import './SetTransferLimit.css';

const SetTransferLimit = () => {
  const [customerId, setCustomerId] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [transferLimits, setTransferLimits] = useState({});
  const [editingAccount, setEditingAccount] = useState(null);
  const [message, setMessage] = useState('');

  const API_KEY = process.env.REACT_APP_API_KEY;
  const PROJECT_ID = process.env.REACT_APP_PROJECT_ID;

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

  const handleEditClick = (account) => {
    setEditingAccount(account);
    setTransferLimits({ ...transferLimits, [account.accountNumber.integerValue]: account.transferlimit.integerValue });
  };

  const handleTransferLimitChange = (accountNumber, newLimit) => {
    setTransferLimits((prev) => ({
      ...prev,
      [accountNumber]: newLimit,
    }));
  };

  const handleUpdateTransferLimit = async (accountNumber) => {
    const newLimit = transferLimits[accountNumber];

    if (newLimit === undefined) {
      setMessage('Please enter a valid transfer limit.');
      return;
    }

    try {
      const accountUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/Accounts/${customerId}?key=${API_KEY}`;

      // Update the transfer limit in Firestore
      await axios.patch(accountUrl, {
        fields: {
          accounts: {
            arrayValue: {
              values: accounts.map(account => {
                if (account.accountNumber.integerValue === accountNumber) {
                  return {
                    mapValue: {
                      fields: {
                        ...account,
                        transferlimit: { integerValue: newLimit },
                      },
                    },
                  };
                }
                return account; // Keep the rest of the accounts unchanged
              }),
            },
          },
        },
      });

      setMessage('Transfer limit updated successfully!');
      setEditingAccount(null); // Reset editing state
    } catch (error) {
      console.error('Error updating transfer limit:', error);
      setMessage('Failed to update transfer limit. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setEditingAccount(null);
  };

  return (
    <Container maxWidth="sm">
      <Typography variant="h4" gutterBottom>Set Transfer Limit</Typography>
      <TextField
        label="Customer ID"
        value={customerId}
        onChange={(e) => setCustomerId(e.target.value)}
        fullWidth
        margin="normal"
      />
      <Button variant="contained" color="primary" onClick={fetchData}>
        Fetch Accounts
      </Button>

      {accounts.length > 0 && (
        <div className="account-details">
          <Typography variant="h5">Account Details</Typography>
          {accounts.map((account, index) => (
            <Box key={index} className="account-card">
              <Typography><strong>Account Number:</strong> {account.accountNumber.integerValue}</Typography>
              <Typography><strong>Account Type:</strong> {account.accountType.stringValue}</Typography>
              <Typography><strong>Balance:</strong> ₹{account.balance.integerValue}</Typography>
              <Typography><strong>Transfer Limit:</strong> ₹{account.transferlimit.integerValue || 0}</Typography>
              <Typography><strong>IFSC Code:</strong> {account.IFSC.stringValue}</Typography>

              {editingAccount?.accountNumber.integerValue === account.accountNumber.integerValue ? (
                <div className="edit-section">
                  <TextField
                    label="New Transfer Limit"
                    type="number"
                    value={transferLimits[account.accountNumber.integerValue] || ''}
                    onChange={(e) => handleTransferLimitChange(account.accountNumber.integerValue, e.target.value)}
                    margin="normal"
                    fullWidth
                  />
                  <Button variant="contained" color="secondary" onClick={() => handleUpdateTransferLimit(account.accountNumber.integerValue)}>
                    Update Transfer Limit
                  </Button>
                  <Button variant="outlined" color="default" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button variant="outlined" color="primary" onClick={() => handleEditClick(account)}>
                  Edit
                </Button>
              )}
            </Box>
          ))}
        </div>
      )}

      {message && <Typography color="secondary">{message}</Typography>}
    </Container>
  );
};

export default SetTransferLimit;
