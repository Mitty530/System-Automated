import React from 'react';

/**
 * Simplified authentication wrapper
 * Loading state is now handled at the App level
 */
const AuthWrapper = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {children}
    </div>
  );
};

export default AuthWrapper;
