import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

// Import components
import NewLandingPage from './components/NewLandingPage';
import Login from './components/Login';
import Signup from './components/Signup';

import Dashboard from './components/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';

// Component to handle password reset redirects
function PasswordResetRedirect() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if we're on the home page with password reset tokens in the hash
    if (location.pathname === '/' && location.hash.includes('type=recovery')) {
      console.log('🔄 Redirecting password reset from home page to enter-new-password');
      // Redirect to enter-new-password page with the hash intact
      navigate('/enter-new-password' + location.hash);
    }
  }, [location, navigate]);

  return <NewLandingPage />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<PasswordResetRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
