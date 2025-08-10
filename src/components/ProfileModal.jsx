import React, { useState, useEffect, useCallback } from 'react';
import { User, Bell, X, Mail, Building, MapPin } from 'lucide-react';
import Modal from './ui/Modal';
import Input from './ui/Input';
import Card from './ui/Card';
import UserRoleIndicator from './UserRoleIndicator';
import NotificationToggle from './ui/NotificationToggle';
import { getUserNotificationPreferences, updateNotificationPreferences } from '../services/notificationService';


const ProfileModal = ({ isOpen, onClose, currentUser }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [notificationPreferences, setNotificationPreferences] = useState({
    request_updates: true,
    system_alerts: true,
    weekly_reports: false,
    email_enabled: true
  });
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(false);

  const loadNotificationPreferences = useCallback(async () => {
    try {
      setIsLoadingPreferences(true);
      const preferences = await getUserNotificationPreferences(currentUser.id);
      setNotificationPreferences(preferences);
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    } finally {
      setIsLoadingPreferences(false);
    }
  }, [currentUser.id]);

  // Load notification preferences when modal opens
  useEffect(() => {
    if (isOpen && currentUser?.id) {
      loadNotificationPreferences();
    }
  }, [isOpen, currentUser?.id, loadNotificationPreferences]);

  if (!currentUser) return null;

  const handleNotificationChange = async (setting, value) => {
    try {
      const updatedPreferences = {
        ...notificationPreferences,
        [setting]: value
      };

      setNotificationPreferences(updatedPreferences);

      // Save to backend
      await updateNotificationPreferences(currentUser.id, updatedPreferences);
      console.log(`Notification setting saved: ${setting} = ${value}`);
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      // Revert on error
      setNotificationPreferences(notificationPreferences);
    }
  };



  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">Profile Information</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Personal Information */}
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-800">Personal Information</h4>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <Input
                      value={currentUser.name}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 text-gray-400 mr-2" />
                      <Input
                        type="email"
                        value={currentUser.email}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                  </div>
                </div>
              </Card>

              {/* Work Information */}
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
                    <Building className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-800">Work Information</h4>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Access Level</label>
                    <div className="flex items-center space-x-2">
                      <div className="p-1 rounded-lg bg-green-100">
                        <User className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="bg-green-100 text-green-800 px-3 py-1 rounded-lg text-sm font-medium">
                        {currentUser.role === 'admin' ? 'Administrator' :
                         currentUser.role === 'archive_team' ? 'Archive Team' :
                         currentUser.role === 'operations_team' ? 'Operations Team' :
                         currentUser.role === 'core_banking' ? 'Core Banking' :
                         'User'}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                    <Input
                      value={currentUser.department || 'Not specified'}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Office Location</label>
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                      <Input
                        value={currentUser.regional_assignment || 'Abu Dhabi Main Office'}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800">Notification Preferences</h3>
            
            <Card className="p-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Email Notifications</h4>
              {isLoadingPreferences ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Loading preferences...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <NotificationToggle
                    title="Request Updates"
                    description="Get notified about request status changes"
                    defaultChecked={notificationPreferences.request_updates}
                    color="blue"
                    onChange={(value) => handleNotificationChange('request_updates', value)}
                  />
                  <NotificationToggle
                    title="System Alerts"
                    description="Important system notifications"
                    defaultChecked={notificationPreferences.system_alerts}
                    color="green"
                    onChange={(value) => handleNotificationChange('system_alerts', value)}
                  />
                  <NotificationToggle
                    title="Weekly Reports"
                    description="Weekly summary of activities"
                    defaultChecked={notificationPreferences.weekly_reports}
                    color="orange"
                    onChange={(value) => handleNotificationChange('weekly_reports', value)}
                  />
                  <NotificationToggle
                    title="Email Notifications"
                    description="Enable/disable all email notifications"
                    defaultChecked={notificationPreferences.email_enabled}
                    color="purple"
                    onChange={(value) => handleNotificationChange('email_enabled', value)}
                  />
                </div>
              )}


            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-6 rounded-t-3xl">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center text-white text-xl font-bold shadow-xl">
              {currentUser.avatar}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{currentUser.name}</h2>
              <p className="text-slate-200">{currentUser.email}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-white hover:text-slate-200 bg-white/20 hover:bg-white/30 p-2 rounded-xl transition-all duration-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-4">
        <div className="flex space-x-2 justify-center">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-xl'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6 max-h-96 overflow-y-auto">
        {renderTabContent()}
      </div>
    </Modal>
  );
};

export default ProfileModal;