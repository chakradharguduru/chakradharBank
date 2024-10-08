// src/pages/FDrequest.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './FDrequest.css';
import { Container, Typography, Button, Box } from '@mui/material';

const FDrequest = () => {
  const [fdRequests, setFdRequests] = useState([]);
  const [message, setMessage] = useState('');

  const API_KEY = process.env.REACT_APP_API_KEY;
  const PROJECT_ID = process.env.REACT_APP_PROJECT_ID;

  useEffect(() => {
    const fetchFdRequests = async () => {
      try {
        const response = await axios.get(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/FDrequest?key=${API_KEY}`);
        const requests = response.data.documents.map(doc => {
          const data = doc.fields;
          return {
            customerid: data.customerid.integerValue,
            fdAmount: data.fdAmount.doubleValue,
            fdRequestId: data.fdrequestid.integerValue,
            fdType: data.fdType.stringValue,
            numberOfYears: data.numberOfYears.integerValue,
            returns: data.returns.doubleValue,
            totalAmount: data.totalAmount.doubleValue,
          };
        });
        setFdRequests(requests);
      } catch (error) {
        console.error('Error fetching FD requests:', error);
      }
    };

    fetchFdRequests();
  }, [API_KEY, PROJECT_ID]);

  const handleAccept = async (request) => {
    try {
      const counterUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/Counters/fdcounter?key=${API_KEY}`;
      const counterResponse = await axios.get(counterUrl);
      let fdCounter = parseInt(counterResponse.data.fields.fdCounter.integerValue, 10);
      fdCounter += 1;

      // Update the counter
      await axios.patch(counterUrl, {
        fields: {
          fdCounter: { integerValue: fdCounter },
        },
      });

      const fdUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/FD/${request.customerid}`;
      const fdEntry = {
        mapValue: {
          fields: {
            fDId: { integerValue: fdCounter }, // Change made here to use integerValue
            fdAmount: { doubleValue: request.fdAmount },
            fdType: { stringValue: request.fdType },
            numberOfYears: { integerValue: request.numberOfYears },
            returns: { doubleValue: request.returns },
            totalAmount: { doubleValue: request.totalAmount },
          },
        },
      };

      // Retrieve the existing FD document for the customer or create a new one
      const loansResponse = await axios.get(fdUrl).catch(() => null); // Ignore error if document does not exist

      if (loansResponse) {
        // Append to existing FDs array
        const existingFDs = loansResponse.data.fields.FD.arrayValue.values || [];
        existingFDs.push(fdEntry);

        await axios.patch(fdUrl, {
          fields: {
            customerid: { integerValue: request.customerid },
            FD: {
              arrayValue: {
                values: existingFDs,
              },
            },
          },
        });
      } else {
        // Create a new document if it doesn't exist
        await axios.patch(fdUrl, {
          fields: {
            customerid: { integerValue: request.customerid },
            FD: {
              arrayValue: {
                values: [fdEntry],
              },
            },
          },
        });
      }

      // Delete the FD request
      await axios.delete(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/FDrequest/${request.fdRequestId}?key=${API_KEY}`);

      setMessage(`FD request for Customer ID ${request.customerid} accepted successfully!`);
      setFdRequests(fdRequests.filter(r => r.fdRequestId !== request.fdRequestId));
    } catch (error) {
      console.error('Error accepting FD request:', error);
      setMessage('Failed to accept FD request.');
    }
  };

  const handleReject = async (requestId) => {
    try {
      await axios.delete(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/FDrequest/${requestId}?key=${API_KEY}`);
      setMessage('FD request rejected successfully!');
      setFdRequests(fdRequests.filter(r => r.fdRequestId !== requestId));
    } catch (error) {
      console.error('Error rejecting FD request:', error);
      setMessage('Failed to reject FD request.');
    }
  };

  return (
    <Container className="fdrequest-container" maxWidth="md">
      <Typography variant="h4" className="fdrequest-title" gutterBottom>
        FD Requests
      </Typography>

      {fdRequests.map((request) => (
        <Box className="fdrequest-item" key={request.fdRequestId}>
          <Typography variant="body1">Customer ID: {request.customerid}</Typography>
          <Typography variant="body1">FD Amount: {request.fdAmount}</Typography>
          <Typography variant="body1">FD Request ID: {request.fdRequestId}</Typography>
          <Typography variant="body1">FD Type: {request.fdType}</Typography>
          <Typography variant="body1">Number of Years: {request.numberOfYears}</Typography>
          <Typography variant="body1">Returns: {request.returns}</Typography>
          <Typography variant="body1">Total Amount: {request.totalAmount}</Typography>
          <Button variant="contained" color="primary" onClick={() => handleAccept(request)}>
            Accept
          </Button>
          <Button variant="contained" color="secondary" onClick={() => handleReject(request.fdRequestId)}>
            Reject
          </Button>
        </Box>
      ))}

      {message && (
        <Typography variant="body2" className="fdrequest-message">
          {message}
        </Typography>
      )}
    </Container>
  );
};

export default FDrequest;
