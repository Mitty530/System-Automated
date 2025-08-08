import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { fetchRequests } from '../services/requestService';

/**
 * Custom hook for real-time withdrawal requests
 * @param {object} filters - Filter options for requests
 * @param {object} user - Current user object
 * @returns {object} - Requests data and loading state
 */
export const useRealtimeRequests = (filters = {}, user = null) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch initial data
  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchRequests(filters);
      setRequests(data || []);
    } catch (err) {
      console.error('Error loading requests:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Handle real-time updates
  const handleRealtimeUpdate = useCallback((payload) => {
    console.log('Real-time update received:', payload);
    
    switch (payload.eventType) {
      case 'INSERT':
        setRequests(prev => [payload.new, ...prev]);
        break;
        
      case 'UPDATE':
        setRequests(prev => 
          prev.map(request => 
            request.id === payload.new.id ? payload.new : request
          )
        );
        break;
        
      case 'DELETE':
        setRequests(prev => 
          prev.filter(request => request.id !== payload.old.id)
        );
        break;
        
      default:
        console.log('Unknown event type:', payload.eventType);
    }
  }, []);

  // Set up real-time subscription
  useEffect(() => {
    // Load initial data
    loadRequests();

    // Set up real-time subscription
    const subscription = supabase
      .channel('withdrawal_requests_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'withdrawal_requests'
        },
        handleRealtimeUpdate
      )
      .subscribe((status) => {
        console.log('Real-time subscription status:', status);
      });

    // Cleanup subscription on unmount
    return () => {
      console.log('Cleaning up real-time subscription');
      subscription.unsubscribe();
    };
  }, [loadRequests, handleRealtimeUpdate]);

  // Refresh data manually
  const refreshRequests = useCallback(() => {
    loadRequests();
  }, [loadRequests]);

  // Update a specific request optimistically
  const updateRequestOptimistically = useCallback((requestId, updates) => {
    setRequests(prev => 
      prev.map(request => 
        request.id === requestId 
          ? { ...request, ...updates }
          : request
      )
    );
  }, []);

  return {
    requests,
    loading,
    error,
    refreshRequests,
    updateRequestOptimistically
  };
};

/**
 * Hook for real-time audit logs
 * @param {number} requestId - Request ID to watch
 * @returns {object} - Audit logs and loading state
 */
export const useRealtimeAuditLogs = (requestId) => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!requestId) return;

    // Fetch initial audit logs
    const fetchAuditLogs = async () => {
      try {
        const { data, error } = await supabase
          .from('request_decisions')
          .select(`
            *,
            user_profiles:user_id (
              full_name,
              role
            )
          `)
          .eq('request_id', requestId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setAuditLogs(data || []);
      } catch (err) {
        console.error('Error fetching audit logs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAuditLogs();

    // Set up real-time subscription for audit logs
    const subscription = supabase
      .channel(`audit_logs_${requestId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'request_decisions',
          filter: `request_id=eq.${requestId}`
        },
        (payload) => {
          console.log('Audit log update:', payload);
          
          switch (payload.eventType) {
            case 'INSERT':
              // Fetch the new record with user profile
              supabase
                .from('request_decisions')
                .select(`
                  *,
                  user_profiles:user_id (
                    full_name,
                    role
                  )
                `)
                .eq('id', payload.new.id)
                .single()
                .then(({ data }) => {
                  if (data) {
                    setAuditLogs(prev => [data, ...prev]);
                  }
                });
              break;
              
            case 'UPDATE':
              setAuditLogs(prev => 
                prev.map(log => 
                  log.id === payload.new.id ? { ...log, ...payload.new } : log
                )
              );
              break;
              
            case 'DELETE':
              setAuditLogs(prev => 
                prev.filter(log => log.id !== payload.old.id)
              );
              break;
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [requestId]);

  return { auditLogs, loading };
};

/**
 * Hook for real-time dashboard stats
 * @returns {object} - Dashboard statistics
 */
export const useRealtimeDashboardStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const calculateStats = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select('current_stage, amount, created_at, priority');

      if (error) throw error;

      const calculatedStats = {
        totalRequests: data.length,
        pendingReview: data.filter(r => r.current_stage === 'under_loan_review').length,
        operationsReview: data.filter(r => r.current_stage === 'under_operations_review').length,
        returnedForModification: data.filter(r => r.current_stage === 'returned_for_modification').length,
        approved: data.filter(r => r.current_stage === 'approved').length,
        disbursed: data.filter(r => r.current_stage === 'disbursed').length,
        totalAmount: data.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0),
        averageAmount: data.length > 0 ? data.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0) / data.length : 0,
        urgentRequests: data.filter(r => r.priority === 'urgent').length
      };

      setStats(calculatedStats);
    } catch (err) {
      console.error('Error calculating stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    calculateStats();

    // Set up real-time subscription for stats updates
    const subscription = supabase
      .channel('dashboard_stats')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'withdrawal_requests'
        },
        () => {
          // Recalculate stats when any request changes
          calculateStats();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [calculateStats]);

  return { stats, loading };
};
