import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Typography, Box, TextField, Button, FormControl, InputLabel, Select, MenuItem, Grid } from '@mui/material';
import { Doughnut } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';
import './ApplyLoan.css';

Chart.register(ArcElement, Tooltip, Legend);

const loanInterestRates = {
  'Personal Loan': 10,
  'Home Loan': 8.5,
  'Car Loan': 9,
  'Education Loan': 7,
};

const loanInformation = {
  'Personal Loan': 'A personal loan can be used for various purposes, including debt consolidation, home improvements, and unexpected expenses.',
  'Home Loan': 'A home loan is secured by the property you buy. It typically has a lower interest rate compared to personal loans.',
  'Car Loan': 'A car loan is secured against the vehicle you purchase and often comes with competitive interest rates.',
  'Education Loan': 'An education loan helps students fund their education and can cover tuition fees, accommodation, and other expenses.',
};

const ApplyLoan = () => {
  const [formData, setFormData] = useState({
    loanType: '',
    loanAmount: '',
    numberOfYears: '',
    monthlyInstallment: '',
    totalInterest: '',
    totalAmount: '',
  });

  const [loanRequestId, setLoanRequestId] = useState(0);
  const [message, setMessage] = useState('');
  const [showCalculations, setShowCalculations] = useState(false);
  const [chartData, setChartData] = useState({});

  const API_KEY = process.env.REACT_APP_API_KEY;
  const PROJECT_ID = process.env.REACT_APP_PROJECT_ID;

  useEffect(() => {
    const fetchLoanRequestId = async () => {
      try {
        const counterUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/Counters/loanrequestcounter?key=${API_KEY}`;
        const response = await axios.get(counterUrl);
        const counterValue = response.data.fields.loanrequestCounter.integerValue;
        setLoanRequestId(parseInt(counterValue, 10));
      } catch (error) {
        console.error('Error fetching loan request ID:', error);
      }
    };

    fetchLoanRequestId();
  }, [API_KEY, PROJECT_ID]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateInputs = () => {
    const { loanAmount, numberOfYears } = formData;
    if (loanAmount <= 0 || numberOfYears <= 0) {
      setMessage('Please enter a valid loan amount and number of years (greater than zero).');
      return false;
    }
    return true;
  };

  const calculateLoanDetails = () => {
    if (!validateInputs()) {
      return;
    }

    const loanAmount = parseFloat(formData.loanAmount);
    const numberOfYears = parseInt(formData.numberOfYears, 10);
    const interestRate = loanInterestRates[formData.loanType];
    const monthlyInterest = interestRate / 100 / 12;

    const numberOfPayments = numberOfYears * 12;
    const monthlyInstallment = (loanAmount * monthlyInterest) / (1 - Math.pow(1 + monthlyInterest, -numberOfPayments));
    const totalAmount = monthlyInstallment * numberOfPayments;
    const totalInterest = totalAmount - loanAmount;

    setFormData({
      ...formData,
      monthlyInstallment: monthlyInstallment.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
      totalInterest: totalInterest.toFixed(2),
    });

    // Set chart data
    setChartData({
      labels: ['Principal Amount', 'Interest Amount'],
      datasets: [
        {
          data: [loanAmount, totalInterest],
          backgroundColor: ['#36A2EB', '#FF6384'],
        },
      ],
    });

    setShowCalculations(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateInputs()) {
      return;
    }

    try {
      const loanRequestUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/LoanRequests/${loanRequestId + 1}?key=${API_KEY}`;
      const newLoanRequest = {
        fields: {
          loanRequestId: { integerValue: loanRequestId + 1 },
          customerId: { integerValue: parseInt(localStorage.getItem('customerId'), 10) },
          loanType: { stringValue: formData.loanType },
          loanAmount: { doubleValue: parseFloat(formData.loanAmount) },
          numberOfYears: { integerValue: parseInt(formData.numberOfYears, 10) },
          monthlyInstallment: { doubleValue: parseFloat(formData.monthlyInstallment) },
          totalInterest: { doubleValue: parseFloat(formData.totalInterest) },
          totalAmount: { doubleValue: parseFloat(formData.totalAmount) },
        }
      };

      await axios.patch(loanRequestUrl, newLoanRequest);
      
      // Update loan request counter
      await axios.patch(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/Counters/loanrequestcounter?key=${API_KEY}`, {
        fields: {
          loanrequestCounter: { integerValue: loanRequestId + 1 },
        }
      });

      setMessage('Loan application submitted successfully!');
      setFormData({
        loanType: '',
        loanAmount: '',
        numberOfYears: '',
        monthlyInstallment: '',
        totalInterest: '',
        totalAmount: '',
      });
      setShowCalculations(false);

    } catch (error) {
      console.error('Error applying for loan:', error);
      setMessage('Failed to apply for loan. Please try again.');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box>
        <Typography variant="h4" gutterBottom>Apply for a Loan</Typography>

        {/* Loan Types Section */}
        <Grid container spacing={2} marginBottom={2}>
          {Object.keys(loanInterestRates).map((loanType) => (
            <Grid item xs={12} sm={6} key={loanType}>
              <Box className="loan-item">
                <Typography variant="h6">{loanType}</Typography>
                <Typography variant="body2">Interest Rate: {loanInterestRates[loanType]}% p.a.</Typography>
                <Typography variant="body2">{loanInformation[loanType]}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>

        <form onSubmit={handleSubmit}>
          <FormControl fullWidth required margin="normal">
            <InputLabel>Loan Type</InputLabel>
            <Select
              name="loanType"
              value={formData.loanType}
              onChange={handleChange}
            >
              {Object.keys(loanInterestRates).map((loanType) => (
                <MenuItem key={loanType} value={loanType}>{loanType}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Loan Amount"
            name="loanAmount"
            value={formData.loanAmount}
            onChange={handleChange}
            fullWidth
            required
            margin="normal"
            type="number"
            inputProps={{ min: 0 }} // Prevent negative input
          />

          <TextField
            label="Number of Years"
            name="numberOfYears"
            value={formData.numberOfYears}
            onChange={handleChange}
            fullWidth
            required
            margin="normal"
            type="number"
            inputProps={{ min: 0 }} // Prevent negative input
          />

          <Button onClick={calculateLoanDetails} variant="contained" color="primary" fullWidth sx={{ marginBottom: 2 }}>
            Calculate
          </Button>

          {showCalculations && (
            <Box textAlign="center">
              <Typography variant="h6">Monthly Installment: {formData.monthlyInstallment}</Typography>
              <Typography variant="h6">Total Interest: {formData.totalInterest}</Typography>
              <Typography variant="h6">Total Amount: {formData.totalAmount}</Typography>
              <Box sx={{ width: 300, height: 300, margin: '0 auto' }}>
                <Doughnut data={chartData} />
              </Box>
            </Box>
          )}

          <Button type="submit" variant="contained" color="primary" fullWidth>
            Apply
          </Button>
        </form>
        {message && (
          <Typography variant="body1" color="secondary">
            {message}
          </Typography>
        )}
      </Box>
    </Container>
  );
};

export default ApplyLoan;
