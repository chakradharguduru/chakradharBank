// src/pages/OpenRequests.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './OpenRequests.css';
import { Container, Typography, Button, Box } from '@mui/material';

const OpenRequests = () => {
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState('');

  const API_KEY = process.env.REACT_APP_API_KEY;
  const PROJECT_ID = process.env.REACT_APP_PROJECT_ID;

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/Users?key=${API_KEY}`);
        const userList = response.data.documents.map((doc) => ({
          id: doc.name.split('/').pop(), // Extract document ID
          ...doc.fields,
        }));
        setUsers(userList);
      } catch (error) {
        console.error('Error fetching users:', error);
        setMessage('Failed to load user requests. Please try again.');
      }
    };

    fetchUsers();
  }, [API_KEY, PROJECT_ID]);

  const handleAccept = async (user) => {
    const customerCounterUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/Counters/customercounter?key=${API_KEY}`;
    const accountCounterUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/Counters/accountcounter?key=${API_KEY}`;

    try {
      // Fetch and increment customerCounter
      const customerCounterResponse = await axios.get(customerCounterUrl);
      let customerCounter = customerCounterResponse.data.fields.customerCounter.integerValue;
      customerCounter = parseInt(customerCounter) + 1;

      await axios.patch(customerCounterUrl, {
        fields: {
          customerCounter: { integerValue: customerCounter },
        },
      });

      // Create a new customer in the Customers collection
      const newCustomerUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/Customers/${customerCounter}?key=${API_KEY}`;
      const newCustomer = {
        fields: {
          customerid: { integerValue: customerCounter },
          name: { stringValue: user.name.stringValue },
          email: { stringValue: user.email.stringValue },
          dob: { timestampValue: user.dob.timestampValue },
          panNumber: { stringValue: user.panNumber.stringValue },
          phoneNumber: { integerValue: user.phoneNumber.integerValue },
          aadharNumber: { integerValue: user.aadharNumber.integerValue },
          PANurl: { stringValue: user.PANurl.stringValue }, // Store PAN URL
          AADHARurl: { stringValue: user.AADHARurl.stringValue }, // Store AADHAR URL
          password: { stringValue: user.password.stringValue }, // Store encrypted password
        },
      };

      await axios.patch(newCustomerUrl, newCustomer);

      // Fetch and increment accountCounter for generating a unique account number
      const accountCounterResponse = await axios.get(accountCounterUrl);
      let accountCounter = accountCounterResponse.data.fields.accountCounter.integerValue;
      accountCounter = parseInt(accountCounter) + 1;

      await axios.patch(accountCounterUrl, {
        fields: {
          accountCounter: { integerValue: accountCounter },
        },
      });

      // Create a new document in the Accounts collection
      const newAccountUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/Accounts/${customerCounter}?key=${API_KEY}`;
      const newAccount = {
        fields: {
          customerid: { integerValue: customerCounter },
          accounts: {
            arrayValue: {
              values: [
                {
                  mapValue: {
                    fields: {
                      accountNumber: { integerValue: accountCounter },
                      accountType: { stringValue: user.accountType.stringValue },
                      balance: { integerValue: parseInt(user.balance.integerValue) },
                      transferlimit: { integerValue: 500000 }, // Add transferlimit field
                      IFSC: { stringValue: 'chakradhar2002' }, // Store IFSC code in Accounts collection
                    },
                  },
                },
              ],
            },
          },
        },
      };

      await axios.patch(newAccountUrl, newAccount);

      // Delete the user from Users collection
      await axios.delete(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/Users/${user.id}?key=${API_KEY}`);

      // Send email notification
      const acceptEmailContent = `
        Dear ${user.name.stringValue},

        Congratulations! Your account has been successfully created with us.

        Here are your account details:
        - Customer ID: ${customerCounter}
        - Account Number: ${accountCounter}
        - IFSC: chakradhar2002
        - Account Type: ${user.accountType.stringValue}
        - Balance: ${user.balance.integerValue}
        - Transfer Limit: 500000

        If you have any questions, feel free to contact us.

        Best regards,
        Your Bank Team
      `;

      await axios.post('http://localhost:5000/send-email', {
        to: user.email.stringValue,
        subject: 'Account Creation Successful',
        text: acceptEmailContent,
      });

      setMessage('User accepted successfully and account created!');
      setUsers(users.filter((u) => u.id !== user.id)); // Remove accepted user from list
    } catch (error) {
      console.error('Error accepting user and creating account:', error);
      setMessage('Failed to accept user. Please try again.');
    }
  };

  const handleReject = async (userId, userEmail, userName) => {
    try {
      await axios.delete(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/Users/${userId}?key=${API_KEY}`);
      
      // Send email notification for rejection
      const rejectEmailContent = `
        Dear ${userName},

        We regret to inform you that your account creation request has been rejected.

        If you believe this is a mistake or have any questions, please feel free to reach out.

        Best regards,
        Your Bank Team
      `;

      await axios.post('http://localhost:5000/send-email', {
        to: userEmail,
        subject: 'Account Creation Request Rejected',
        text: rejectEmailContent,
      });

      setMessage('User rejected successfully!');
      setUsers(users.filter((user) => user.id !== userId)); // Remove rejected user from list
    } catch (error) {
      console.error('Error rejecting user:', error);
      setMessage('Failed to reject user. Please try again.');
    }
  };

  return (
    <Container className="open-requests-container" maxWidth="lg">
      <Typography className="open-requests-title" variant="h4" gutterBottom>
        Open Requests
      </Typography>
      {message && <Typography className="message" color="secondary">{message}</Typography>}
      <Box className="requests-list">
        {users.map((user) => (
          <Box key={user.id} className="request-card">
            <div className="request-details">
              {/* Left column details */}
              <div className="col1">
                <div><strong>User ID:</strong> {user.id}</div>
                <div><strong>Name:</strong> {user.name.stringValue}</div>
                <div><strong>Email:</strong> {user.email.stringValue}</div>
                <div><strong>DOB:</strong> {new Date(user.dob.timestampValue).toLocaleDateString()}</div>
                <div><strong>PAN Number:</strong> {user.panNumber.stringValue}</div>
              </div>
              {/* Right column details */}
              <div className="col2">
                <div><strong>Phone Number:</strong> {user.phoneNumber.integerValue}</div>
                <div><strong>Aadhar Number:</strong> {user.aadharNumber.integerValue}</div>
                <div><strong>Account Type:</strong> {user.accountType?.stringValue}</div>
                <div><strong>Balance:</strong> {user.balance?.integerValue}</div>
              </div>
              {/* Images in the last row */}
              <div className="images">
                <div>
                  <strong>PAN Image:</strong> 
                  <img src={user.PANurl.stringValue} alt="PAN" />
                </div>
                <div>
                  <strong>AADHAR Image:</strong>
                  <img src={user.AADHARurl.stringValue} alt="AADHAR" />
                </div>
              </div>
            </div>
            <div className="request-actions">
              <Button className="accept-button" onClick={() => handleAccept(user)}>Accept</Button>
              <Button className="reject-button" onClick={() => handleReject(user.id, user.email.stringValue, user.name.stringValue)}>Reject</Button>
            </div>
          </Box>        
        ))}
      </Box>
    </Container>
  );
};

export default OpenRequests;
