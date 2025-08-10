import React from 'react';
import { DollarSign, Plus, User, Settings } from 'lucide-react';
import Button from './ui/Button';
import UserRoleIndicator from './UserRoleIndicator';
import LogoutButton from './LogoutButton';
import NotificationBell from './NotificationBell';

const Header = ({ currentUser, onProfileClick, onCreateRequest, onLogout }) => {
  return (
    <header className="relative z-50 backdrop-blur-xl bg-white/80 shadow-lg border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Withdrawal Request Tracker
              </h1>
              <p className="text-sm text-gray-600">Real-time tracking dashboard • Full access for testing</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <Button 
              onClick={onCreateRequest}
              variant="success"
              className="flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>New Request</span>
              <span className="text-xs bg-white/20 px-2 py-1 rounded-lg">Full Access</span>
            </Button>
            
            {currentUser ? (
              <div className="flex items-center space-x-3">
                <NotificationBell />
                <LogoutButton onLogout={onLogout} />
                <button
                  onClick={onProfileClick}
                  className="flex items-center space-x-3 bg-white/50 backdrop-blur-md rounded-2xl px-4 py-3 shadow-lg hover:bg-white/70 transition-all duration-200 group"
                >
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-xl flex items-center justify-center text-lg">
                    {currentUser.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">{currentUser.name}</div>
                    <div className="text-xs text-gray-500">
                      Full Access User
                    </div>
                  </div>
                  <Settings className="w-4 h-4 text-gray-500 group-hover:text-blue-600 transition-colors" />
                </button>
              </div>
            ) : (
              <Button 
                onClick={onProfileClick}
                variant="primary"
                className="flex items-center space-x-2"
              >
                <User className="w-5 h-5" />
                <span>Profile</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;