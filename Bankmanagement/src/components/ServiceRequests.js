import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Typography, Button, Grid, Paper, Box } from '@mui/material';
import './ServiceRequests.css';

const ServiceRequests = () => {
  const [loanRequests, setLoanRequests] = useState([]);
  const [message, setMessage] = useState('');
  const [loanIdCounter, setLoanIdCounter] = useState(0); // State to hold loan ID counter

  const API_KEY = process.env.REACT_APP_API_KEY;
  const PROJECT_ID = process.env.REACT_APP_PROJECT_ID;

  useEffect(() => {
    const fetchLoanRequests = async () => {
      try {
        const response = await axios.get(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/LoanRequests?key=${API_KEY}`);
        const requests = response.data.documents.map(doc => ({
          ...doc.fields,
          id: doc.name.split('/').pop() // Extract document ID
        }));
        setLoanRequests(requests);
      } catch (error) {
        console.error('Error fetching loan requests:', error);
        setMessage('Failed to fetch loan requests.');
      }
    };

    const fetchLoanIdCounter = async () => {
      try {
        const response = await axios.get(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/Counters/loancounter?key=${API_KEY}`);
        const counterValue = response.data.fields.loanCounter.integerValue;
        setLoanIdCounter(parseInt(counterValue, 10));
      } catch (error) {
        console.error('Error fetching loan ID counter:', error);
      }
    };

    fetchLoanRequests();
    fetchLoanIdCounter(); // Fetch loan ID counter on component mount
  }, [API_KEY, PROJECT_ID]);

  const handleAccept = async (request) => {
    const customerid = request.customerId.integerValue; // Using 'customerid' instead of 'customerId'
    const loanCounterUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/Counters/loancounter?key=${API_KEY}`;
    const loansCollectionUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/Loans/${customerid}?key=${API_KEY}`; // Using 'customerid'

    try {
      // Increment the loan ID counter
      const updatedLoanId = loanIdCounter + 1;
      await axios.patch(loanCounterUrl, {
        fields: {
          loanCounter: { integerValue: updatedLoanId },
        }
      });

      // Create a new loan entry using the incremented loan ID
      const loanEntry = {
        mapValue: {
          fields: {
            loanId: { integerValue: updatedLoanId },
            loanAmount: { doubleValue: request.loanAmount.doubleValue },
            loanType: { stringValue: request.loanType.stringValue },
            monthlyInstallment: { doubleValue: request.monthlyInstallment.doubleValue },
            numberOfYears: { integerValue: request.numberOfYears.integerValue },
            totalAmount: { doubleValue: request.totalAmount.doubleValue },
            totalInterest: { doubleValue: request.totalInterest.doubleValue },
          }
        }
      };

      // Retrieve the existing Loans document for the customer or create a new one
      const loansResponse = await axios.get(loansCollectionUrl).catch(() => null); // Ignore error if document does not exist

      if (loansResponse) {
        // Append to existing loans array
        const existingLoans = loansResponse.data.fields.loans.arrayValue.values || [];
        existingLoans.push(loanEntry);

        await axios.patch(loansCollectionUrl, {
          fields: {
            customerid: { integerValue: customerid }, // Use 'customerid' field
            loans: {
              arrayValue: {
                values: existingLoans
              }
            }
          }
        });
      } else {
        // Create a new document if it doesn't exist
        await axios.patch(loansCollectionUrl, {
          fields: {
            customerid: { integerValue: customerid }, // Use 'customerid' field
            loans: {
              arrayValue: {
                values: [loanEntry]
              }
            }
          }
        });
      }

      // Delete from LoanRequests collection
      await axios.delete(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/LoanRequests/${request.id}?key=${API_KEY}`);

      setMessage(`Loan request for Customer ID ${customerid} accepted successfully!`);
      setLoanRequests(prevRequests => prevRequests.filter(r => r.id !== request.id));
      setLoanIdCounter(updatedLoanId); // Update loan ID counter state
    } catch (error) {
      console.error('Error accepting loan request:', error);
      setMessage('Failed to accept loan request.');
    }
  };

  const handleReject = async (requestId) => {
    try {
      await axios.delete(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/LoanRequests/${requestId}?key=${API_KEY}`);
      setMessage('Loan request rejected successfully!');
      setLoanRequests(prevRequests => prevRequests.filter(r => r.id !== requestId));
    } catch (error) {
      console.error('Error rejecting loan request:', error);
      setMessage('Failed to reject loan request.');
    }
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom>Service Requests</Typography>
      {message && <Typography color="secondary">{message}</Typography>}
      <Grid container spacing={2}>
        {loanRequests.map((request) => (
          <Grid item xs={12} sm={6} md={4} key={request.id}>
            <Paper elevation={3} className="loan-request">
              <Box padding={2}>
                <Typography><strong>Customer ID:</strong> {request.customerId.integerValue}</Typography>
                <Typography><strong>Loan Amount:</strong> {request.loanAmount.doubleValue}</Typography>
                <Typography><strong>Loan Request ID:</strong> {request.id}</Typography>
                <Typography><strong>Loan Type:</strong> {request.loanType.stringValue}</Typography>
                <Typography><strong>Monthly Installment:</strong> {request.monthlyInstallment.doubleValue}</Typography>
                <Typography><strong>Number of Years:</strong> {request.numberOfYears.integerValue}</Typography>
                <Typography><strong>Total Amount:</strong> {request.totalAmount.doubleValue}</Typography>
                <Typography><strong>Total Interest:</strong> {request.totalInterest.doubleValue}</Typography>
                <Button onClick={() => handleAccept(request)} variant="contained" color="success" sx={{ margin: '5px' }}>Accept</Button>
                <Button onClick={() => handleReject(request.id)} variant="contained" color="error" sx={{ margin: '5px' }}>Reject</Button>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default ServiceRequests;
