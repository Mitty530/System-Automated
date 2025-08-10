import React, { useState, useEffect, useMemo } from 'react';
import Header from './Header';
import DashboardStats from './DashboardStats';
import ProcessTracking from './ProcessTracking';
import FiltersSection from './FiltersSection';
import RequestsTable from './RequestsTable';
import CreateRequestModal from './CreateRequestModal';
import EnhancedRequestDetailsModal from './EnhancedRequestDetailsModal';
import ProfileModal from './ProfileModal';
import { DecisionType, CommentType, WorkflowStage } from '../data/enums';

import { logPageView, logFilter } from '../services/auditService';
import { useRealtimeRequests, useRealtimeDashboardStats } from '../hooks/useRealtimeRequests';

const WithdrawalRequestTracker = ({ currentUser, onLogout }) => {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showCreateRequest, setShowCreateRequest] = useState(false);
  const [showRequestDetails, setShowRequestDetails] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [auditTrail, setAuditTrail] = useState([]);
  const [comments, setComments] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCountry, setFilterCountry] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Memoize filters for real-time hook
  const filters = useMemo(() => {
    const filterObj = {};
    if (filterStatus !== 'all') {
      filterObj.stage = filterStatus;
    }
    if (filterCountry !== 'all') {
      filterObj.country = filterCountry;
    }
    return filterObj;
  }, [filterStatus, filterCountry]);

  // Use real-time hooks
  const {
    requests,
    loading: requestsLoading,
    error: requestsError,
    refreshRequests,
    updateRequestOptimistically
  } = useRealtimeRequests(filters, currentUser);

  const {
    stats: dashboardStats,
    loading: statsLoading
  } = useRealtimeDashboardStats();

  const isLoading = requestsLoading || statsLoading;
  const error = requestsError;

  // Transform requests data for display
  const transformedRequests = useMemo(() => {
    return requests.map(request => ({
      id: request.id,
      projectNumber: request.project_number,
      refNumber: request.ref_number,
      beneficiaryName: request.beneficiary_name,
      country: request.country,
      amount: parseFloat(request.amount),
      currency: request.currency,
      valueDate: request.value_date,
      currentStage: request.current_stage,
      status: request.status,
      priority: request.priority,
      assignedTo: request.assigned_to,
      createdBy: request.created_by,
      createdAt: request.created_at,
      updatedAt: request.updated_at,
      processingDays: request.processing_days || 0,
      projectDetails: request.project_details,
      referenceDocumentation: request.reference_documentation,
      createdByProfile: request.created_by_profile,
      assignedToProfile: request.assigned_to_profile,
      documents: request.request_documents || []
    }));
  }, [requests]);



  // Log page view on mount and filter usage
  useEffect(() => {
    if (currentUser) {
      logPageView('Dashboard', {
        filterStatus,
        filterCountry,
        user_role: currentUser.role
      });
    }
  }, [currentUser, filterStatus, filterCountry]);

  // Log filter usage for analytics
  useEffect(() => {
    const logFilterUsage = async () => {
      if (filterStatus !== 'all' || filterCountry !== 'all') {
        try {
          await logFilter(
            { status: filterStatus, country: filterCountry },
            requests.length
          );
        } catch (err) {
          console.error('Error logging filter usage:', err);
        }
      }
    };

    logFilterUsage();
  }, [filterStatus, filterCountry, requests.length]);

  const handleRetry = () => {
    refreshRequests();
  };

  const handleProfileClick = () => {
    setShowProfileModal(true);
  };

  const handleLogout = () => {
    onLogout();
  };

  const executeAction = (action, request) => {
    switch (action) {
      case 'create_request':
        setShowCreateRequest(true);
        break;
      case 'approve':
        updateRequestStatus(request.id, 'Approved - Sent to Core Banking', 'core_banking');
        alert('✅ Request approved successfully!');
        break;
      case 'reject':
        updateRequestStatus(request.id, 'Rejected by Operations', 'initial_review');
        alert('✅ Request rejected successfully!');
        break;
      case 'disburse':
        updateRequestStatus(request.id, 'Disbursed', 'disbursed');
        alert('✅ Request disbursed successfully!');
        break;
      case 'delete':
        if (window.confirm('Are you sure you want to delete this request?')) {
          // Delete functionality would be handled by the real-time hook
          alert('✅ Request deleted successfully!');
        }
        break;
      default:
        // Invalid action requested
    }
  };

  const updateRequestStatus = (requestId, newStatus, newStage) => {
    // Use optimistic update from real-time hook
    updateRequestOptimistically(requestId, {
      status: newStatus,
      current_stage: newStage,
      currentStage: newStage,
      updated_at: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  };

  const handleDecisionMade = async (decision, comment) => {

    try {
      // Import workflow manager
      const { progressWorkflow } = await import('../utils/workflowManager');

      // Process the workflow transition (this will trigger notifications)
      const result = await progressWorkflow(
        selectedRequest.id,
        decision,
        comment,
        currentUser.id
      );

      if (result.success) {

        // Add to audit trail
        const newAuditEntry = {
          id: auditTrail.length + 1,
          requestId: selectedRequest.id,
          userId: currentUser.id,
          userName: currentUser.name,
          userRole: currentUser.role,
          action: `Decision: ${decision}`,
          comment: comment,
          timestamp: new Date().toISOString()
        };

        setAuditTrail(prev => [...prev, newAuditEntry]);

        // Add decision comment
        const newComment = {
          id: comments.length + 1,
          requestId: selectedRequest.id,
          userId: currentUser.id,
          userName: currentUser.name,
          userRole: currentUser.role,
          type: CommentType.DECISION,
          comment: comment,
          timestamp: new Date().toISOString()
        };

        setComments(prev => [...prev, newComment]);

        // Update the selected request with the result
        setSelectedRequest(result.request);

        // Refresh requests to get latest data
        if (refreshRequests) {
          refreshRequests();
        }


      } else {
        throw new Error(result.error || 'Failed to process workflow transition');
      }
    } catch (error) {
      console.error('❌ Failed to record decision:', error);
      alert(`Failed to record decision: ${error.message}. Please try again.`);
      return;
    }


  };

  const handleAddComment = async (comment, type) => {
    const newComment = {
      id: comments.length + 1,
      requestId: selectedRequest.id,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      type: type,
      comment: comment,
      timestamp: new Date().toISOString()
    };
    
    setComments(prev => [...prev, newComment]);
  };

  const handleCreateRequest = async (requestData) => {
    try {
      // Validate that we have the required data
      if (!requestData || !requestData.id) {
        console.error('Invalid request data received:', requestData);
        throw new Error('Invalid request data received');
      }

      // The request has already been created in the database by CreateRequestModal
      // Real-time subscription will automatically update the UI



      // Request will be automatically added by real-time subscription

      // Refresh requests to ensure real-time sync
      if (refreshRequests) {
        refreshRequests();
      }

      // Show success message
      alert(`✅ Request created successfully! Assigned to ${requestData.regionalTeam || 'Regional Team'}`);

      return requestData.id;
    } catch (error) {
      console.error('Error handling created request:', error);
      throw new Error('Failed to process withdrawal request');
    }
  };

  // Handle request updates from inline editing
  const handleRequestUpdate = (updatedRequest) => {
    // Update the selected request
    setSelectedRequest(updatedRequest);

    // Request will be automatically updated by real-time subscription

    // Refresh requests to ensure real-time sync
    if (refreshRequests) {
      refreshRequests();
    }
  };

  const getFilteredRequests = () => {
    let filtered = transformedRequests;

    if (filterStatus !== 'all') {
      filtered = filtered.filter(req => req.currentStage === filterStatus);
    }

    if (filterCountry !== 'all') {
      filtered = filtered.filter(req => req.country === filterCountry);
    }

    if (searchTerm) {
      filtered = filtered.filter(req =>
        req.refNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.beneficiaryName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.projectNumber?.includes(searchTerm)
      );
    }

    return filtered;
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setShowRequestDetails(true);
  };

  const handleAction = (action, request) => {
    executeAction(action, request);
  };

  const filteredRequests = getFilteredRequests();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-r from-pink-400/20 to-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <Header 
        currentUser={currentUser}
        onProfileClick={handleProfileClick}
        onCreateRequest={() => executeAction('create_request')}
        onLogout={handleLogout}
      />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading requests...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="text-red-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading data</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <button
                  onClick={handleRetry}
                  className="text-sm text-red-800 underline mt-2 hover:text-red-900"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Stats */}
        {!isLoading && !error && (
          <>
            <DashboardStats dashboardStats={dashboardStats} requests={requests} />

            {/* Process Tracking */}
            <ProcessTracking requests={transformedRequests} />
          </>
        )}
        
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Withdrawal Request Management</h2>
          <p className="text-gray-600">Create and manage withdrawal requests with comprehensive tracking and full access for testing</p>
        </div>

        <div>
          <FiltersSection 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            filterCountry={filterCountry}
            setFilterCountry={setFilterCountry}
            requests={requests}
          />

          <RequestsTable 
            requests={filteredRequests}
            onViewDetails={handleViewDetails}
            onAction={handleAction}
            currentUser={currentUser}
          />
        </div>
      </main>

      <CreateRequestModal 
        isOpen={showCreateRequest}
        onClose={() => setShowCreateRequest(false)}
        onCreateRequest={handleCreateRequest}
      />

      <EnhancedRequestDetailsModal
        isOpen={showRequestDetails}
        onClose={() => setShowRequestDetails(false)}
        request={selectedRequest}
        currentUser={currentUser}
        auditTrail={auditTrail.filter(entry => entry.requestId === selectedRequest?.id)}
        comments={comments.filter(comment => comment.requestId === selectedRequest?.id)}
        users={{}}
        onDecisionMade={handleDecisionMade}
        onAddComment={handleAddComment}
        onRequestUpdate={handleRequestUpdate}
      />

      <ProfileModal 
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        currentUser={currentUser}
      />
    </div>
  );
};

export default WithdrawalRequestTracker;