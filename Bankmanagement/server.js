// server.js
require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Nodemailer transporter configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Your email (from which emails will be sent)
    pass: process.env.EMAIL_APP_PASS, // Use the app-specific password here
  },
});

// Centralized API endpoint for sending emails
app.post('/send-email', (req, res) => {
  const { to, subject, text } = req.body; // Destructure content sent from frontend

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: to, // Recipient's email address
    subject: subject, // Email subject
    text: text, // Email body text
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return res.status(500).json({ message: 'Failed to send email', error });
    }
    res.status(200).json({ message: 'Email sent successfully!' });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
