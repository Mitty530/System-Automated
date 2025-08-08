import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LandingPage from './LandingPage';

/**
 * Authentication wrapper that prevents flash of landing page
 * Shows a minimal loading state while checking authentication
 */
const AuthWrapper = ({ children }) => {
  const { user, loading } = useAuth();
  const [isInitializing, setIsInitializing] = useState(true);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Fast initialization check
    const initTimer = setTimeout(() => {
      setIsInitializing(false);
      
      // Smooth transition to content
      if (user) {
        setTimeout(() => setShowContent(true), 50);
      } else {
        setShowContent(true);
      }
    }, 100); // Very short delay to prevent flash

    return () => clearTimeout(initTimer);
  }, [user]);

  // Show minimal loading during initialization
  if (isInitializing || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">Loading ADFD System...</p>
        </div>
      </div>
    );
  }

  // Show content with smooth transition
  if (!showContent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 opacity-0 transition-opacity duration-200">
        {user ? children : <LandingPage />}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 opacity-100 transition-opacity duration-200">
      {user ? children : <LandingPage />}
    </div>
  );
};

export default AuthWrapper;
