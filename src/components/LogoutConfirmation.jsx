import React, { useEffect } from 'react';
import { CheckCircle, LogOut } from 'lucide-react';

const LogoutConfirmation = ({ isVisible, onComplete }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onComplete();
      }, 2500); // Show for 2.5 seconds

      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 transform animate-fadeIn">
        <div className="text-center">
          {/* Success Icon */}
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          
          {/* ADFD Branding */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">🏛️ ADFD Tracking System</h1>
            <p className="text-gray-600 text-sm">Secure Session Management</p>
          </div>
          
          {/* Success Message */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-center space-x-3 mb-3">
              <LogOut className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-bold text-green-800">Logout Successful</h2>
            </div>
            <p className="text-green-700 font-medium">
              ✅ You have been logged out successfully
            </p>
            <p className="text-green-600 text-sm mt-2">
              Your session has been securely terminated and all data cleared.
            </p>
          </div>
          
          {/* Security Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-xs text-blue-700 font-medium">
              🔒 For your security, all session data has been cleared from this device.
            </p>
          </div>
          
          {/* Auto-redirect notice */}
          <div className="mt-4">
            <p className="text-xs text-gray-500">
              Redirecting to login page...
            </p>
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mt-2"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoutConfirmation;
