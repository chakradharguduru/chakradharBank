import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Typography, Button, Box } from '@mui/material';
import './CheckIncomingTransactions.css';

const CheckIncomingTransactions = () => {
  const [customerId, setCustomerId] = useState(localStorage.getItem('customerId'));
  const [accounts, setAccounts] = useState([]);
  const [message, setMessage] = useState('');

  const API_KEY = process.env.REACT_APP_API_KEY;
  const PROJECT_ID = process.env.REACT_APP_PROJECT_ID;
  const COMMON_DB_API = 'https://firestore.googleapis.com/v1/projects/bank-common-db/databases/(default)/documents/common_db';

  useEffect(() => {
    if (customerId) {
      fetchAccounts();
    } else {
      setMessage('Customer ID not found. Please log in again.');
    }
  }, [customerId]);

  const fetchAccounts = async () => {
    try {
      const response = await axios.get(
        `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/Accounts/${customerId}?key=${API_KEY}`
      );
      const accountData = response.data.fields;

      if (accountData && accountData.accounts) {
        const accountList = accountData.accounts.arrayValue.values.map(acc => acc.mapValue.fields);
        setAccounts(accountList);
      } else {
        setMessage('No accounts found for this customer ID.');
      }
    } catch (error) {
      console.error('Error fetching account details:', error);
      setMessage('Failed to fetch account details. Please try again.');
    }
  };

  const checkIncomingTransactions = async (accountNumber, receiverIFSC) => {
    try {
      const response = await axios.get(`${COMMON_DB_API}/Banks/${receiverIFSC}`);
      const transactionsData = response.data.fields[accountNumber]?.arrayValue?.values || [];

      if (transactionsData.length > 0) {
        let totalCredits = 0;
        
        // Process each transaction
        transactionsData.forEach(transaction => {
          const creditAmount = parseInt(transaction.mapValue.fields.creditAmount.integerValue);
          totalCredits += creditAmount;
        });

        // Update the receiver's account balance in the bank's database
        const updatedAccounts = accounts.map(account => ({
          mapValue: {
            fields: account.accountNumber?.integerValue === accountNumber
              ? {
                  ...account,
                  balance: {
                    integerValue: parseInt(account.balance?.integerValue) + totalCredits,
                  },
                }
              : account,
          },
        }));

        await axios.patch(
          `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/Accounts/${customerId}?key=${API_KEY}`,
          {
            fields: {
              accounts: {
                arrayValue: {
                  values: updatedAccounts,
                },
              },
            },
          }
        );

        setMessage(`Account ${accountNumber} updated with ${totalCredits} credits.`);

        // Optionally clear the processed transactions (reset the array)
        await axios.patch(`${COMMON_DB_API}/Banks/${receiverIFSC}`, {
          fields: {
            [accountNumber]: {
              arrayValue: {
                values: [], // Reset to an empty array to clear processed transactions
              },
            },
          },
        });
      } else {
        setMessage(`No new transactions found for account ${accountNumber}.`);
      }
    } catch (error) {
      console.error('Error checking incoming transactions:', error);
      setMessage('Failed to check incoming transactions. Please try again.');
    }
  };

  return (
    <Container maxWidth="sm">
      <Typography variant="h4" gutterBottom>Check Incoming Transactions</Typography>
      <div className="account-list">
        {accounts.length > 0 ? (
          accounts.map((account, index) => (
            <Box key={index} className="account-card">
              <Typography><strong>Account Number:</strong> {account.accountNumber?.integerValue}</Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => checkIncomingTransactions(account.accountNumber?.integerValue, account.IFSC?.stringValue)}
              >
                Check Transactions
              </Button>
            </Box>
          ))
        ) : (
          <Typography>No accounts found.</Typography>
        )}
      </div>

      {message && <Typography color="secondary">{message}</Typography>}
    </Container>
  );
};

export default CheckIncomingTransactions;
