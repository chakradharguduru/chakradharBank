import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './ViewAccounts.css';
import { Box, Typography, Button } from '@mui/material';

const ViewAccounts = () => {
  const [selectedView, setSelectedView] = useState('accounts'); // 'accounts', 'loans', 'fds'
  const [accounts, setAccounts] = useState([]);
  const [loans, setLoans] = useState([]);
  const [fds, setFds] = useState([]);
  const [message, setMessage] = useState('');

  const customerId = localStorage.getItem('customerId'); // Retrieve customerId from local storage
  const API_KEY = process.env.REACT_APP_API_KEY;
  const PROJECT_ID = process.env.REACT_APP_PROJECT_ID;

  useEffect(() => {
    if (customerId) {
      fetchData();
    } else {
      setMessage('Customer ID not found. Please log in again.');
    }
  }, [customerId]);

  const fetchData = async () => {
    try {
      // Fetch account details
      const accountResponse = await axios.get(
        `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/Accounts/${customerId}?key=${API_KEY}`
      );
      const accountData = accountResponse.data.fields;
      setAccounts(accountData ? accountData.accounts.arrayValue.values.map(acc => acc.mapValue.fields) : []);

      // Fetch loan details
      const loanResponse = await axios.get(
        `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/Loans/${customerId}?key=${API_KEY}`
      );
      const loanData = loanResponse.data.fields;
      setLoans(loanData ? loanData.loans.arrayValue.values.map(loan => loan.mapValue.fields) : []);

      // Fetch FD details
      const fdResponse = await axios.get(
        `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/FD/${customerId}?key=${API_KEY}`
      );
      const fdData = fdResponse.data.fields;
      setFds(fdData && fdData.FD ? fdData.FD.arrayValue.values.map(fd => fd.mapValue.fields) : []);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      
    }
  };

  // Helper function to get Firestore field value dynamically
  const getFieldValue = (field) => {
    return (
      field?.stringValue || field?.integerValue || field?.doubleValue || field?.numberValue || ''
    );
  };

  return (
    <div className="view-accounts-container">
      {/* Sidebar Navigation */}
      <Box className="sidebar">
        <Button onClick={() => setSelectedView('accounts')} className={selectedView === 'accounts' ? 'active' : ''}>
          Accounts
        </Button>
        <Button onClick={() => setSelectedView('loans')} className={selectedView === 'loans' ? 'active' : ''}>
          Loans
        </Button>
        <Button onClick={() => setSelectedView('fds')} className={selectedView === 'fds' ? 'active' : ''}>
          Fixed Deposits
        </Button>
      </Box>

      {/* Main Content Area */}
      <Box className="content">
        {message && <Typography className="message" color="secondary">{message}</Typography>}

        {/* Display accounts when selected */}
        {selectedView === 'accounts' && (
          <div className="account-details">
            <Typography variant="h5">Account Details</Typography>
            {accounts.length > 0 ? (
              accounts.map((account, index) => (
                <Box key={index} className="account-card">
                  <Typography><strong>Account Number:</strong> {getFieldValue(account.accountNumber)}</Typography>
                  <Typography><strong>Account Type:</strong> {getFieldValue(account.accountType)}</Typography>
                  <Typography><strong>Balance:</strong> ₹{getFieldValue(account.balance)}</Typography>
                  <Typography><strong>Transfer Limit:</strong> ₹{getFieldValue(account.transferlimit) || 0}</Typography>
                  {/* Added IFSC code */}
                  <Typography><strong>IFSC Code:</strong> {getFieldValue(account.IFSC)}</Typography>
                </Box>
              ))
            ) : (
              <Typography>No account details found.</Typography>
            )}
          </div>
        )}

        {/* Display loans when selected */}
        {selectedView === 'loans' && (
          <div className="loan-details">
            <Typography variant="h5">Loan Details</Typography>
            {loans.length > 0 ? (
              loans.map((loan, index) => (
                <Box key={index} className="loan-card">
                  {/* Display loanId */}
                  <Typography><strong>Loan ID:</strong> {getFieldValue(loan.loanId)}</Typography>
                  <Typography><strong>Loan Type:</strong> {getFieldValue(loan.loanType)}</Typography>
                  <Typography><strong>Loan Amount:</strong> ₹{getFieldValue(loan.loanAmount)}</Typography>
                  <Typography><strong>Monthly Installment:</strong> ₹{getFieldValue(loan.monthlyInstallment)}</Typography>
                  <Typography><strong>Number of Years:</strong> {getFieldValue(loan.numberOfYears)}</Typography>
                  <Typography><strong>Total Amount:</strong> ₹{getFieldValue(loan.totalAmount)}</Typography>
                  <Typography><strong>Total Interest:</strong> ₹{getFieldValue(loan.totalInterest)}</Typography>
                </Box>
              ))
            ) : (
              <Typography>No loan details found.</Typography>
            )}
          </div>
        )}

        {/* Display FDs when selected */}
        {selectedView === 'fds' && (
          <div className="fd-details">
            <Typography variant="h5">Fixed Deposit Details</Typography>
            {fds.length > 0 ? (
              fds.map((fd, index) => (
                <Box key={index} className="fd-card">
                  {/* Display fdId */}
                  <Typography><strong>FD ID:</strong> {getFieldValue(fd.fDId)}</Typography>
                  <Typography><strong>FD Type:</strong> {getFieldValue(fd.fdType)}</Typography>
                  <Typography><strong>FD Amount:</strong> ₹{getFieldValue(fd.fdAmount)}</Typography>
                  <Typography><strong>Number of Years:</strong> {getFieldValue(fd.numberOfYears)}</Typography>
                  <Typography><strong>Estimated Returns:</strong> ₹{getFieldValue(fd.returns)}</Typography>
                  <Typography><strong>Total Amount:</strong> ₹{getFieldValue(fd.totalAmount)}</Typography>
                </Box>
              ))
            ) : (
              <Typography>No fixed deposit details found.</Typography>
            )}
          </div>
        )}
      </Box>
    </div>
  );
};

export default ViewAccounts;
