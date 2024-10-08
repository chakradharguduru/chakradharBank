// src/pages/FixedDeposit.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './FixedDeposit.css';
import { Container, Typography, Button, TextField, MenuItem, Select, FormControl, InputLabel, Box } from '@mui/material';
import { Pie } from 'react-chartjs-2';

const FixedDeposit = () => {
  const [fdType, setFdType] = useState('');
  const [fdAmount, setFdAmount] = useState(0);
  const [numberOfYears, setNumberOfYears] = useState(0);
  const [returns, setReturns] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [customerAge, setCustomerAge] = useState(null); // Customer age to validate for Senior Citizen FD
  const [chartData, setChartData] = useState(null);
  const [message, setMessage] = useState('');

  const API_KEY = process.env.REACT_APP_API_KEY;
  const PROJECT_ID = process.env.REACT_APP_PROJECT_ID;
  const customerId = localStorage.getItem('customerId'); // Retrieve locally stored customer ID

  useEffect(() => {
    const fetchCustomerAge = async () => {
      try {
        const response = await axios.get(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/Customers/${customerId}?key=${API_KEY}`);
        const customerData = response.data.fields;
        const dob = new Date(customerData.dob.timestampValue);
        const age = new Date().getFullYear() - dob.getFullYear(); // Calculate age
        setCustomerAge(age);
      } catch (error) {
        console.error('Error fetching customer age:', error);
      }
    };

    fetchCustomerAge();
  }, [API_KEY, PROJECT_ID, customerId]);

  const calculateReturns = () => {
    if (fdType === '') {
      setMessage('Please select an FD type.');
      return;
    }

    if (fdAmount <= 0 || numberOfYears <= 0) {
      setMessage('Please enter valid FD amount and number of years.');
      return;
    }

    let rateOfInterest = 0;
    if (fdType === 'Regular FD') rateOfInterest = 0.06;
    if (fdType === 'Tax Saving FD') rateOfInterest = 0.065;
    if (fdType === 'Senior Citizen FD') {
      if (customerAge < 60) {
        setMessage('You are not eligible for Senior Citizen FD as your age is below 60.');
        return;
      }
      rateOfInterest = 0.07;
    }

    const estimatedReturns = fdAmount * rateOfInterest * numberOfYears;
    const totalAmount = fdAmount + estimatedReturns;

    setReturns(estimatedReturns);
    setTotalAmount(totalAmount);

    setChartData({
      labels: ['Invested Amount', 'Returns'],
      datasets: [
        {
          data: [fdAmount, estimatedReturns],
          backgroundColor: ['#3498db', '#2ecc71'],
        },
      ],
    });
  };

  const handleApply = async () => {
    try {
      const counterUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/Counters/fdrequestcounter?key=${API_KEY}`;
      const counterResponse = await axios.get(counterUrl);
      let fdrequestCounter = parseInt(counterResponse.data.fields.fdrequestCounter.integerValue, 10);
      fdrequestCounter += 1;

      await axios.patch(counterUrl, {
        fields: {
          fdrequestCounter: { integerValue: fdrequestCounter },
        },
      });

      const fdRequestUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/FDrequest/${fdrequestCounter}?key=${API_KEY}`;
      const fdRequestData = {
        fields: {
          customerid: { integerValue: parseInt(customerId, 10) },
          fdrequestid: { integerValue: fdrequestCounter },
          fdAmount: { doubleValue: fdAmount },
          numberOfYears: { integerValue: numberOfYears },
          returns: { doubleValue: returns },
          totalAmount: { doubleValue: totalAmount },
          fdType: { stringValue: fdType },
        },
      };

      await axios.patch(fdRequestUrl, fdRequestData);

      setMessage('FD request applied successfully!');
      setFdType('');
      setFdAmount(0);
      setNumberOfYears(0);
      setChartData(null);
    } catch (error) {
      console.error('Error applying FD request:', error);
      setMessage('Failed to apply FD request.');
    }
  };

  const handleFDTypeChange = (type) => {
    setFdType(type);
    if (type === 'Tax Saving FD') {
      setNumberOfYears(5); // Set number of years to 5 for Tax Saving FD
    } else {
      setNumberOfYears(0); // Reset number of years for other types
    }
  };

  return (
    <Container className="fd-container" maxWidth="md">
      <Typography variant="h4" className="fd-title" gutterBottom>
        Fixed Deposit Options
      </Typography>
      <Box className="fd-types">
        <div className={`fd-type ${fdType === 'Regular FD' ? 'selected' : ''}`} onClick={() => handleFDTypeChange('Regular FD')}>
          <Typography variant="h6">Regular FD - 6%</Typography>
          <Typography variant="body2">Ideal for individuals seeking steady returns with a fixed interest rate over a period.</Typography>
        </div>
        <div className={`fd-type ${fdType === 'Tax Saving FD' ? 'selected' : ''}`} onClick={() => handleFDTypeChange('Tax Saving FD')}>
          <Typography variant="h6">Tax Saving FD - 6.5%</Typography>
          <Typography variant="body2">Provides tax benefits under Section 80C of the Income Tax Act, with a lock-in period of 5 years.</Typography>
        </div>
        <div className={`fd-type ${fdType === 'Senior Citizen FD' ? 'selected' : ''}`} onClick={() => handleFDTypeChange('Senior Citizen FD')}>
          <Typography variant="h6">Senior Citizen FD - 7%</Typography>
          <Typography variant="body2">Offers higher interest rates for senior citizens, ensuring better returns for retirees.</Typography>
        </div>
      </Box>
      <form className="fd-form">
        <FormControl fullWidth>
          <InputLabel id="fd-type-select">FD Type</InputLabel>
          <Select labelId="fd-type-select" value={fdType} onChange={(e) => handleFDTypeChange(e.target.value)} label="FD Type">
            <MenuItem value="Regular FD">Regular FD</MenuItem>
            <MenuItem value="Tax Saving FD">Tax Saving FD</MenuItem>
            <MenuItem value="Senior Citizen FD">Senior Citizen FD</MenuItem>
          </Select>
        </FormControl>
        <TextField fullWidth type="number" label="FD Amount" value={fdAmount} onChange={(e) => setFdAmount(parseFloat(e.target.value))} />
        <TextField
          fullWidth
          type="number"
          label="Number of Years"
          value={numberOfYears}
          onChange={(e) => setNumberOfYears(parseFloat(e.target.value))}
          disabled={fdType === 'Tax Saving FD'} // Disable if FD type is 'Tax Saving FD'
        />
        <Button variant="contained" onClick={calculateReturns} className="calculate-button">
          Calculate
        </Button>
      </form>

      {chartData && (
        <div className="fd-chart">
          <Pie data={chartData} width={200} height={200} />
        </div>
      )}

      <Typography variant="h6" className="fd-summary">
        Estimated Returns: {returns.toFixed(2)} <br />
        Total Amount: {totalAmount.toFixed(2)}
      </Typography>

      <Button variant="contained" color="primary" onClick={handleApply} className="apply-button">
        Apply
      </Button>

      {message && (
        <Typography variant="body2" className="fd-message">
          {message}
        </Typography>
      )}
    </Container>
  );
};

export default FixedDeposit;
