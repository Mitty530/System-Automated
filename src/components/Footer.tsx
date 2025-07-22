import React from 'react';
import logo from '../logo.svg';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="footer-logo">
              <img src={logo} alt="Logo" className="footer-logo-icon" />
              <div className="brand-text">
                <div className="brand-name" style={{ color: 'white' }}>Quandrox</div>
                <div className="brand-tagline">Tracking System</div>
              </div>
            </div>
            <p className="footer-description">
              Advanced tracking system for efficient project management and monitoring.
            </p>
            <div className="footer-social">
              <a href="#" className="social-link">💼</a>
              <a href="#" className="social-link">🐦</a>
              <a href="#" className="social-link">🔧</a>
              <a href="#" className="social-link">✉️</a>
            </div>
          </div>

          <div className="footer-sections">
            <div className="footer-section">
              <h4>Platform</h4>
              <ul>
                <li><a href="#features">Features</a></li>
                <li><a href="#security">Security</a></li>
              </ul>
            </div>

          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-copyright">
            &copy; 2025 Quandrox Tracking System. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
