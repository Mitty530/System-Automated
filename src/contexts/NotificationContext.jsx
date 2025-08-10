import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const NotificationContext = createContext({});

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // Get toast type based on notification type
  const getToastType = (notificationType) => {
    switch (notificationType) {
      case 'request_submitted':
        return 'info';
      case 'request_approved':
        return 'success';
      case 'request_rejected':
        return 'error';
      case 'request_disbursed':
        return 'success';
      case 'system_alert':
        return 'warning';
      default:
        return 'info';
    }
  };

  // Show toast notification
  const showToast = useCallback((notification) => {
    // This will be handled by the Toast component
    const event = new CustomEvent('show-toast', {
      detail: {
        type: getToastType(notification.notification_type),
        title: notification.title,
        message: notification.message,
        duration: 5000
      }
    });
    window.dispatchEvent(event);
  }, []);

  // Load user's notifications
  const loadNotifications = useCallback(async () => {
    if (!user?.id) {
      console.warn('No user ID available for loading notifications');
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('in_app_notifications')
        .select(`
          *,
          withdrawal_requests!in_app_notifications_request_id_fkey (
            ref_number,
            project_number,
            country,
            beneficiary_name,
            amount,
            currency
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error loading notifications:', error);
        // Set empty array on error to prevent crashes
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.read_at).length || 0);
    } catch (error) {
      console.error('Error in loadNotifications:', error);
      // Set empty array on error to prevent crashes
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Subscribe to real-time notifications
  const subscribeToNotifications = useCallback(() => {
    if (!user?.id) {
      console.warn('No user ID available for notification subscription');
      return () => {};
    }

    try {
      const channel = supabase
        .channel('user-notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'in_app_notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            try {
              const newNotification = payload.new;

              if (newNotification) {
                setNotifications(prev => [newNotification, ...prev]);
                setUnreadCount(prev => prev + 1);

                // Show toast notification
                showToast(newNotification);
              }
            } catch (error) {
              console.error('Error handling new notification:', error);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'in_app_notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            try {
              const updatedNotification = payload.new;
              if (updatedNotification) {
                setNotifications(prev =>
                  prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
                );

                // Update unread count if notification was marked as read
                if (updatedNotification.read_at && payload.old && !payload.old.read_at) {
                  setUnreadCount(prev => Math.max(0, prev - 1));
                }
              }
            } catch (error) {
              console.error('Error handling notification update:', error);
            }
          }
        )
        .subscribe();

      return () => {
        try {
          supabase.removeChannel(channel);
        } catch (error) {
          console.error('Error removing notification channel:', error);
        }
      };
    } catch (error) {
      console.error('Error setting up notification subscription:', error);
      return () => {};
    }
  }, [user?.id, showToast]);

  // Load notifications when user changes
  useEffect(() => {
    if (user?.id) {
      loadNotifications();
      subscribeToNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user?.id, loadNotifications, subscribeToNotifications]);

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const { error } = await supabase
        .from('in_app_notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error marking notification as read:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in markAsRead:', error);
      return false;
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('in_app_notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .is('read_at', null);

      if (error) {
        console.error('Error marking all notifications as read:', error);
        return false;
      }

      setUnreadCount(0);
      setNotifications(prev => 
        prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
      );

      return true;
    } catch (error) {
      console.error('Error in markAllAsRead:', error);
      return false;
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      const { error } = await supabase
        .from('in_app_notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting notification:', error);
        return false;
      }

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      // Update unread count if deleted notification was unread
      const deletedNotification = notifications.find(n => n.id === notificationId);
      if (deletedNotification && !deletedNotification.read_at) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      return true;
    } catch (error) {
      console.error('Error in deleteNotification:', error);
      return false;
    }
  };



  // Add notification (for testing or manual creation)
  const addNotification = async (notificationData) => {
    try {
      const { error } = await supabase
        .from('in_app_notifications')
        .insert({
          user_id: user.id,
          ...notificationData,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding notification:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in addNotification:', error);
      return false;
    }
  };

  const value = {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    addNotification,
    loadNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
