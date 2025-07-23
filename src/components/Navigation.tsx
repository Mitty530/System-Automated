import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import logo from '../logo.svg';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  region?: string;
  permissions: string[];
}

interface NavigationProps {
  user?: User | null;
  onLogout?: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ user, onLogout }) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`navigation ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container">
        <div className="nav-container">
          <Link to="/" className="brand">
            <img src={logo} alt="Logo" className="brand-logo" />
            <div className="brand-text">
              <div className="brand-name">Quantrox</div>
              <div className="brand-tagline">Tracking System</div>
            </div>
          </Link>

          <ul className="nav-menu">
            <li><a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Platform</a></li>
            <li><a href="#features">Features</a></li>
            <li><a href="#security">Security</a></li>
          </ul>

          <div className="nav-actions">
            {user ? (
              <div className="user-info">
                <div className="user-details">
                  <span className="user-name">{user.name}</span>
                  <span className="user-department">{user.department}</span>
                </div>
                <button
                  onClick={() => {
                    console.log('🔄 Logout button clicked');
                    if (onLogout) {
                      onLogout();
                    } else {
                      console.error('❌ onLogout function not provided');
                    }
                  }}
                  className="btn-nav secondary"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link to="/login" className="btn-nav primary">Get Started</Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
