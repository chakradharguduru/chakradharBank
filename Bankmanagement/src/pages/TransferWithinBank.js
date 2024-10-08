import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Typography, TextField, Button, Box } from '@mui/material';
import './TransferWithinBank.css';

const TransferWithinBank = () => {
  const [customerId, setCustomerId] = useState(localStorage.getItem('customerId'));
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [transferAmount, setTransferAmount] = useState('');
  const [recipientAccount, setRecipientAccount] = useState('');
  const [recipientIFSC, setRecipientIFSC] = useState('');
  const [message, setMessage] = useState('');
  const [allAccounts, setAllAccounts] = useState([]);

  const API_KEY = process.env.REACT_APP_API_KEY;
  const PROJECT_ID = process.env.REACT_APP_PROJECT_ID;

  useEffect(() => {
    if (customerId) {
      fetchAccounts();
      fetchAllAccounts();
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

  const fetchAllAccounts = async () => {
    try {
      const response = await axios.get(
        `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/Accounts?key=${API_KEY}`
      );
      const allAccountDocs = response.data.documents || [];
      const allAccountsList = allAccountDocs.map(doc => ({
        documentId: doc.name.split('/').pop(), // Store the document ID
        customerid: doc.fields?.customerid?.integerValue,
        accounts: doc.fields?.accounts?.arrayValue?.values?.map(acc => acc.mapValue.fields) || [],
      }));
      setAllAccounts(allAccountsList);
    } catch (error) {
      console.error('Error fetching all accounts:', error);
      setMessage('Failed to fetch all accounts. Please try again.');
    }
  };

  const handleTransfer = async () => {
    if (!selectedAccount || !recipientAccount || !recipientIFSC || !transferAmount) {
      setMessage('Please fill in all fields.');
      return;
    }
  
    const senderBalance = parseInt(selectedAccount.balance?.integerValue);
    const transferLimit = parseInt(selectedAccount.transferlimit?.integerValue);
    const amount = parseInt(transferAmount);
  
    if (!senderBalance || !transferLimit) {
      setMessage('Error retrieving sender account details.');
      return;
    }
  
    if (amount > transferLimit) {
      setMessage('Transfer amount exceeds the transfer limit.');
      return;
    }
  
    if (amount > senderBalance) {
      setMessage('Insufficient balance.');
      return;
    }
  
    // Find the recipient account
    let recipientData = null;
    let recipientDocumentId = null;
    let recipientAccountIndex = -1;
  
    allAccounts.forEach((accountDoc) => {
      if (accountDoc.accounts) {
        accountDoc.accounts.forEach((acc, index) => {
          if (
            acc.accountNumber?.integerValue?.toString() === recipientAccount &&
            acc.IFSC?.stringValue === recipientIFSC
          ) {
            recipientData = acc;
            recipientDocumentId = accountDoc.documentId; // Store the correct document ID
            recipientAccountIndex = index;
          }
        });
      }
    });
  
    if (!recipientData || recipientDocumentId === null || recipientAccountIndex === -1) {
      setMessage('No user found with the given account number and IFSC code.');
      return;
    }
  
    const updatedSenderBalance = senderBalance - amount;
    const updatedRecipientBalance = parseInt(recipientData.balance?.integerValue) + amount;
  
    try {
      // Update sender's account balance
      const senderAccountData = accounts.map(account => ({
        mapValue: {
          fields: account.accountNumber?.integerValue === selectedAccount.accountNumber?.integerValue
            ? {
                ...account,
                balance: { integerValue: updatedSenderBalance },
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
                values: senderAccountData,
              },
            },
          }
        }
      );
  
      // Update recipient's account balance using the correct document ID
      const recipientAccountData = allAccounts
        .find(doc => doc.documentId === recipientDocumentId)
        ?.accounts.map((account, index) => ({
          mapValue: {
            fields: index === recipientAccountIndex
              ? {
                  ...account,
                  balance: { integerValue: updatedRecipientBalance },
                }
              : account,
          },
        })) || [];
  
      await axios.patch(
        `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/Accounts/${recipientDocumentId}?key=${API_KEY}`,
        {
          fields: {
            accounts: {
              arrayValue: {
                values: recipientAccountData,
              },
            },
          }
        }
      );
  
      setMessage('Transfer successful!');
      setTransferAmount('');
      setRecipientAccount('');
      setRecipientIFSC('');
      setSelectedAccount(null);
  
      // Refetch accounts after successful transfer to update balances in UI
      await fetchAccounts();
      await fetchAllAccounts();
    } catch (error) {
      console.error('Error updating account balances:', error);
      setMessage('Failed to update account balances. Please try again.');
    }
  };
  
  return (
    <Container maxWidth="sm">
      <Typography variant="h4" gutterBottom>Transfer Within Bank</Typography>
      <div className="account-list">
        {accounts.length > 0 ? (
          accounts.map((account, index) => (
            <Box key={index} className="account-card">
              <Typography><strong>Account Number:</strong> {account.accountNumber?.integerValue}</Typography>
              <Typography><strong>Account Type:</strong> {account.accountType?.stringValue}</Typography>
              <Typography><strong>Balance:</strong> ₹{account.balance?.integerValue}</Typography>
              <Typography><strong>Transfer Limit:</strong> ₹{account.transferlimit?.integerValue}</Typography>
              <Typography><strong>IFSC Code:</strong> {account.IFSC?.stringValue}</Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => setSelectedAccount(account)}
              >
                Send Using This
              </Button>
            </Box>
          ))
        ) : (
          <Typography>No accounts found.</Typography>
        )}
      </div>

      {selectedAccount && (
        <Box className="transfer-section">
          <Typography variant="h6">Initiate Transfer</Typography>
          <TextField
            label="Recipient Account Number"
            value={recipientAccount}
            onChange={(e) => setRecipientAccount(e.target.value)}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Recipient IFSC Code"
            value={recipientIFSC}
            onChange={(e) => setRecipientIFSC(e.target.value)}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Amount"
            type="number"
            value={transferAmount}
            onChange={(e) => setTransferAmount(e.target.value)}
            fullWidth
            margin="normal"
          />
          <Button variant="contained" color="secondary" onClick={handleTransfer}>
            Transfer
          </Button>
        </Box>
      )}

      {message && <Typography color="secondary">{message}</Typography>}
    </Container>
  );
};

export default TransferWithinBank;
