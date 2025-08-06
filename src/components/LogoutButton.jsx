import React from 'react';
import { LogOut } from 'lucide-react';
import Button from './ui/Button';

const LogoutButton = ({ onLogout, className = '' }) => {
  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      onLogout();
    }
  };

  return (
    <Button
      onClick={handleLogout}
      variant="secondary"
      size="sm"
      className={`flex items-center space-x-2 ${className}`}
      title="Logout from system"
    >
      <LogOut className="w-4 h-4" />
      <span>Logout</span>
    </Button>
  );
};

export default LogoutButton;