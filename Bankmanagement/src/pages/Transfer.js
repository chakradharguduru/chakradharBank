import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button, TextField, Typography, Card, CardContent } from '@mui/material';

export default function MoneyTransfer() {
  const [senderAccounts, setSenderAccounts] = useState([]);
  const [selectedSenderAccount, setSelectedSenderAccount] = useState(null);
  const [receiverIFSC, setReceiverIFSC] = useState('');
  const [receiverAccountNumber, setReceiverAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const API_KEY = process.env.REACT_APP_API_KEY;
  const PROJECT_ID = process.env.REACT_APP_PROJECT_ID;

  // Fetch sender's accounts from Firestore
  useEffect(() => {
    const fetchSenderAccounts = async () => {
      try {
        const customerId = localStorage.getItem('customerId');
        const accountUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/Accounts/${customerId}?key=${API_KEY}`;
        const response = await axios.get(accountUrl);
        const accountsData = response.data.fields.accounts.arrayValue.values;
        setSenderAccounts(accountsData);
      } catch (error) {
        console.error('Error fetching sender accounts:', error);
        setErrorMessage('Error fetching sender accounts. Please try again.');
      }
    };
    fetchSenderAccounts();
  }, [API_KEY, PROJECT_ID]);

  const transferMoney = async () => {
    if (!selectedSenderAccount) {
      setErrorMessage('Please select a valid sender account.');
      return;
    }

    const senderBalance = parseInt(selectedSenderAccount.mapValue.fields.balance.integerValue);
    const senderAccountNumber = selectedSenderAccount.mapValue.fields.accountNumber.integerValue;

    if (parseFloat(amount) > senderBalance) {
      setErrorMessage('Insufficient balance.');
      return;
    }

    try {
      const transactionMap = {
        senderAccountNumber: { integerValue: senderAccountNumber },
        amount: { integerValue: amount },
        timestamp: { timestampValue: new Date().toISOString() },
      };

      const receiverAccountKey = receiverAccountNumber.toString();
      const receiverUrl = `https://firestore.googleapis.com/v1/projects/bank-common-db/databases/(default)/documents/common_db/${receiverIFSC}`;

      // Retrieve the receiver's bank document
      const receiverBank = await axios.get(receiverUrl);
      const receiverAccounts = receiverBank.data.fields || {};

      // Check if the account already exists in receiverAccounts
      if (receiverAccountKey in receiverAccounts) {
        let accountArray = receiverAccounts[receiverAccountKey]?.arrayValue?.values || [];

        accountArray.push({ mapValue: { fields: transactionMap } });
        receiverAccounts[receiverAccountKey].arrayValue = {
          values: accountArray,
        };
        console.log('Transaction added to existing account:', accountArray);
      } else {
        receiverAccounts[receiverAccountKey] = {
          arrayValue: {
            values: [{ mapValue: { fields: transactionMap } }]
          }
        };
        console.log('New account created and transaction added:', receiverAccounts[receiverAccountKey]);
      }

      const updateUrl = `https://firestore.googleapis.com/v1/projects/bank-common-db/databases/(default)/documents/common_db/${receiverIFSC}`;
      const updatedData = { 
        fields: receiverAccounts,
      };

      await axios.patch(updateUrl, updatedData);
      console.log('Transaction successfully pushed to the receiver account.');

      const customerId = localStorage.getItem('customerId');
      const senderAccountUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/Accounts/${customerId}?key=${API_KEY}`;
      const updatedBalance = senderBalance - parseFloat(amount);

      await axios.patch(senderAccountUrl, {
        fields: {
          accounts: {
            arrayValue: {
              values: senderAccounts.map(account => {
                if (account.mapValue.fields.accountNumber.integerValue === senderAccountNumber) {
                  account.mapValue.fields.balance.integerValue = updatedBalance;
                }
                return account;
              }),
            },
          },
        },
      });

      setSuccessMessage('Transfer successful.');
      setAmount('');
      setReceiverAccountNumber('');
      setReceiverIFSC('');
      setSelectedSenderAccount(null);
    } catch (error) {
      console.error('Error during money transfer:', error);
      setErrorMessage('Error during transfer. Please try again.');
    }
  };

  return (
    <div>
      <Typography variant="h6">Money Transfer</Typography>

      {/* Display each sender's account with a "Use This" button */}
      {senderAccounts.length > 0 ? (
        senderAccounts.map((account, index) => (
          <Card key={index} variant="outlined" style={{ marginBottom: '10px' }}>
            <CardContent>
              <Typography variant="body1">
                Account Number: {account.mapValue.fields.accountNumber.integerValue}
              </Typography>
              <Typography variant="body1">
                Balance: {account.mapValue.fields.balance.integerValue}
              </Typography>
              <Button
                variant="contained"
                onClick={() => setSelectedSenderAccount(account)}
              >
                Use This
              </Button>
            </CardContent>
          </Card>
        ))
      ) : (
        <Typography>No accounts available.</Typography>
      )}

      {/* Display selected account details */}
      {selectedSenderAccount && (
        <Typography variant="body1" style={{ marginTop: '10px' }}>
          Selected Account: {selectedSenderAccount.mapValue.fields.accountNumber.integerValue}
        </Typography>
      )}

      {/* Receiver's Account and IFSC */}
      <TextField
        label="Receiver IFSC"
        fullWidth
        value={receiverIFSC}
        onChange={(e) => setReceiverIFSC(e.target.value)}
        margin="normal"
      />
      <TextField
        label="Receiver Account Number"
        fullWidth
        value={receiverAccountNumber}
        onChange={(e) => setReceiverAccountNumber(e.target.value)}
        margin="normal"
      />

      {/* Amount Input */}
      <TextField
        label="Amount"
        fullWidth
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        margin="normal"
      />

      <Button variant="contained" color="primary" onClick={transferMoney}>
        Transfer
      </Button>

      {errorMessage && <Typography color="error">{errorMessage}</Typography>}
      {successMessage && <Typography color="success">{successMessage}</Typography>}
    </div>
  );
}
