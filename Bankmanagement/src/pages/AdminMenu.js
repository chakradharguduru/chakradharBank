// src/pages/AdminMenu.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../pages/AdminMenu.css'; // Import the CSS file

const AdminMenu = () => {
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <div className="admin-menu-container">
      {/* Header with Logout button */}
      <div className="admin-header">
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* Welcome message */}
      <div className="welcome-message">
        Welcome, Super Admin! 🎉 Ready to handle some requests today? 😉
      </div>

      {/* Options container */}
      <div className="options-container">
        <div className="option-card" onClick={() => handleNavigation('/openrequests')}>
          <h3>Open Requests</h3>
        </div>
        <div className="option-card" onClick={() => handleNavigation('/servicerequests')}>
          <h3>Service Requests</h3>
        </div>
        <div className="option-card" onClick={() => handleNavigation('/fdrequest')}>
          <h3>FD Requests</h3>
        </div>
        <div className="option-card" onClick={() => handleNavigation('/settransferlimit')}>
          <h3>Set Transfer Limit</h3>
        </div>
      </div>
    </div>
  );
};

export default AdminMenu;
