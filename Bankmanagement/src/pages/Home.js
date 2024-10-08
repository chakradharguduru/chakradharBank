// src/pages/Home.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css'; // Importing the Home CSS file

const Home = () => {
  const navigate = useNavigate();

  // Navigate to the desired page based on the button click
  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div className="home-container">
      {/* Header section */}
      <header className="home-header">
        <div className="logo">
          <img src="https://via.placeholder.com/150" alt="Bank Logo" className="bank-logo" />
          <h1 className="bank-title">Your Bank Name</h1>
        </div>
        {/* Navigation options */}
        <nav className="nav-links">
          <button className="nav-button" onClick={() => handleNavigation('/admin')}>
            Admin
          </button>
          <button className="nav-button" onClick={() => handleNavigation('/login')}>
            Customer Login
          </button>
          <button className="nav-button" onClick={() => handleNavigation('/signup')}>
            Create Account
          </button>
        </nav>
      </header>

      {/* Banner Section */}
      <div className="banner">
        <h2>Welcome to Your Bank</h2>
        <p>Your trusted partner in financial services.</p>
        <button className="banner-button">Explore Our Services</button>
      </div>

      {/* Main content Section */}
      <section className="content">
        <h2>Our Services</h2>
        <div className="services">
          <div className="service-card">
            <h3>Personal Banking</h3>
            <p>Manage your personal finances with ease using our diverse range of banking services.</p>
          </div>
          <div className="service-card">
            <h3>Business Banking</h3>
            <p>Empowering your business with our tailored banking solutions and support.</p>
          </div>
          <div className="service-card">
            <h3>Loans and Credit</h3>
            <p>Explore our loan and credit options to meet your personal and business needs.</p>
          </div>
          <div className="service-card">
            <h3>Investments</h3>
            <p>Grow your wealth with our investment solutions and advisory services.</p>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="footer">
        <p>© 2024 Your Bank Name. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Home;
