import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { usePerformance } from './hooks/usePerformance';
import { initializePerformanceOptimizations } from './utils/performanceOptimizations';

// Lazy load components for better performance
const NewLandingPage = lazy(() => import('./components/NewLandingPage'));
const Login = lazy(() => import('./components/Login'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const ProtectedRoute = lazy(() => import('./components/ProtectedRoute'));

// Loading component
const LoadingSpinner: React.FC = () => (
  <div className="loading-spinner" style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #334155 50%, #475569 75%, #64748b 100%)'
  }}>
    <div style={{
      width: '40px',
      height: '40px',
      border: '4px solid #e2e8f0',
      borderTop: '4px solid #3b82f6',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }} />
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

// Component to handle password reset redirects
function PasswordResetRedirect() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logPerformanceMetrics } = usePerformance();

  useEffect(() => {
    // Check if we're on the home page with password reset tokens in the hash
    if (location.pathname === '/' && location.hash.includes('type=recovery')) {
      console.log('🔄 Redirecting password reset from home page to enter-new-password');
      // Redirect to enter-new-password page with the hash intact
      navigate('/enter-new-password' + location.hash);
    }
  }, [location, navigate]);

  useEffect(() => {
    // Log performance metrics for the landing page
    logPerformanceMetrics();
  }, [logPerformanceMetrics]);

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <NewLandingPage />
    </Suspense>
  );
}

function App() {
  useEffect(() => {
    // Initialize performance optimizations on app start
    initializePerformanceOptimizations();
  }, []);

  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<PasswordResetRedirect />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
            </Routes>
          </Suspense>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
