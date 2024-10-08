// TransferToOtherBank.js
import React from 'react';
import { Button, Container, Typography, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import './TransferToOtherBank.css';

const TransferToOtherBank = () => {
  const navigate = useNavigate();

  return (
    <Container className="transfer-to-other-bank">
      <Typography variant="h4" align="center" gutterBottom>
        Transfer to Other Bank
      </Typography>
      <Box className="options-box">
        {/* Transfer Option */}
        <Button
          variant="contained"
          color="primary"
          className="option-button"
          onClick={() => navigate('/transfer')}
        >
          Transfer
        </Button>

        {/* Check Incoming Transactions Option */}
        <Button
          variant="contained"
          color="secondary"
          className="option-button"
          onClick={() => navigate('/check-incoming-transactions')}
        >
          Check Incoming Transactions
        </Button>
      </Box>
    </Container>
  );
};

export default TransferToOtherBank;
