// src/pages/Admin.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Admin.css'; // Importing the CSS file for Admin component

const Admin = () => {
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const API_KEY = process.env.REACT_APP_API_KEY;
  const PROJECT_ID = process.env.REACT_APP_PROJECT_ID;

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Firestore URL to access the admin document
    const adminUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/admin/admin?key=${API_KEY}`;

    try {
      const response = await axios.get(adminUrl);
      const adminData = response.data.fields;

      const storedId = adminData.id.stringValue;
      const storedPassword = adminData.password.stringValue;

      if (adminId === storedId && password === storedPassword) {
        // Successful login - Navigate to Admin Menu
        navigate('/adminmenu');
      } else {
        // Incorrect ID or Password
        setMessage("Oops! Your ID or password is incorrect. Don't worry, it happens to the best of us!");
      }
    } catch (error) {
      console.error('Error logging in:', error);
      setMessage('Unable to connect to the database. Please try again later.');
    }
  };

  return (
    <div className="admin-container">
      {/* Back Button */}
      <button className="back-button" onClick={() => navigate('/')}>
        &larr; Back to Home
      </button>

      {/* Admin Login Section */}
      <div className="admin-login-box">
        <h2>Hey Admin, Ready to Log In?</h2>
        <p>Login to perform admin operations. Make sure you've got your ID and password handy!</p>

        <form onSubmit={handleLogin} className="admin-form">
          <input
            type="text"
            placeholder="Enter Admin ID"
            value={adminId}
            onChange={(e) => setAdminId(e.target.value)}
            required
            className="admin-input"
          />
          <input
            type="password"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="admin-input"
          />
          <button type="submit" className="admin-submit-button">
            Login
          </button>
        </form>

        {/* Message Section */}
        {message && <p className="admin-message">{message}</p>}
      </div>
    </div>
  );
};

export default Admin;
