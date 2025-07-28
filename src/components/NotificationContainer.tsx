import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { Notification } from '../types/withdrawalTypes';
import { notificationService } from '../services/notificationService';

const NotificationContainer: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // Subscribe to notification changes
    const unsubscribe = notificationService.subscribe(setNotifications);
    
    // Get initial notifications
    setNotifications(notificationService.getNotifications());
    
    return unsubscribe;
  }, []);

  const getNotificationIcon = (type: Notification['type']) => {
    const iconProps = { className: "w-5 h-5" };
    
    switch (type) {
      case 'success':
        return <CheckCircle {...iconProps} style={{ color: '#4A8B2C' }} />;
      case 'error':
        return <AlertCircle {...iconProps} style={{ color: '#DC3545' }} />;
      case 'warning':
        return <AlertTriangle {...iconProps} style={{ color: '#FFA500' }} />;
      case 'info':
        return <Info {...iconProps} style={{ color: '#007CBA' }} />;
      default:
        return <Info {...iconProps} style={{ color: '#007CBA' }} />;
    }
  };

  const getNotificationStyles = (type: Notification['type']) => {
    const baseStyles = {
      border: '1px solid',
      borderRadius: '12px',
      padding: '16px',
      marginBottom: '12px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
    };

    switch (type) {
      case 'success':
        return {
          ...baseStyles,
          backgroundColor: '#F0F8F0',
          borderColor: '#4A8B2C',
          color: '#323E48'
        };
      case 'error':
        return {
          ...baseStyles,
          backgroundColor: '#FFF5F5',
          borderColor: '#DC3545',
          color: '#323E48'
        };
      case 'warning':
        return {
          ...baseStyles,
          backgroundColor: '#FFF8E1',
          borderColor: '#FFA500',
          color: '#323E48'
        };
      case 'info':
        return {
          ...baseStyles,
          backgroundColor: '#F0F8FF',
          borderColor: '#007CBA',
          color: '#323E48'
        };
      default:
        return {
          ...baseStyles,
          backgroundColor: '#F9F9F9',
          borderColor: '#DEE1E3',
          color: '#323E48'
        };
    }
  };

  const handleDismiss = (id: string) => {
    notificationService.removeNotification(id);
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed top-4 right-4 max-w-md w-full"
      style={{ maxHeight: '80vh', overflowY: 'auto', zIndex: 10003 }}
    >
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            style={getNotificationStyles(notification.type)}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-0.5">
                {getNotificationIcon(notification.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm mb-1">
                  {notification.title}
                </div>
                <div className="text-sm opacity-90">
                  {notification.message}
                </div>
                <div className="text-xs opacity-70 mt-2">
                  {notification.timestamp.toLocaleTimeString()}
                </div>
              </div>
              
              <motion.button
                onClick={() => handleDismiss(notification.id)}
                className="flex-shrink-0 p-1 rounded-lg transition-all duration-200"
                style={{ 
                  backgroundColor: 'rgba(0, 0, 0, 0.1)',
                  color: '#5B6670'
                }}
                whileHover={{ 
                  scale: 1.1, 
                  backgroundColor: 'rgba(0, 0, 0, 0.2)' 
                }}
                whileTap={{ scale: 0.9 }}
                title="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default NotificationContainer;
