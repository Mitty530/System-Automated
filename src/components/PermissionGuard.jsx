import React from 'react';

const PermissionGuard = ({ children }) => {
  // For testing purposes, always allow access
  return children;
};

export default PermissionGuard;