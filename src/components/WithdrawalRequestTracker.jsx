import React, { useState } from 'react';
import Header from './Header';
import DashboardStats from './DashboardStats';
import ProcessTracking from './ProcessTracking';
import FiltersSection from './FiltersSection';
import RequestsTable from './RequestsTable';
import CreateRequestModal from './CreateRequestModal';
import EnhancedRequestDetailsModal from './EnhancedRequestDetailsModal';
import ProfileModal from './ProfileModal';
import { mockQuery } from '../data/appMockData';
import { mockQuery as workflowMockQuery } from '../data/withdrawalMockData';
import { DecisionType, CommentType, WorkflowStage } from '../data/enums';

const WithdrawalRequestTracker = ({ currentUser, onLogout }) => {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showCreateRequest, setShowCreateRequest] = useState(false);
  const [showRequestDetails, setShowRequestDetails] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [requests, setRequests] = useState(mockQuery.requests);
  const [auditTrail, setAuditTrail] = useState(workflowMockQuery.auditTrail);
  const [comments, setComments] = useState(workflowMockQuery.comments);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCountry, setFilterCountry] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

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
          setRequests(prev => prev.filter(req => req.id !== request.id));
          alert('✅ Request deleted successfully!');
        }
        break;
      default:
        console.log('Invalid action requested.');
    }
  };

  const updateRequestStatus = (requestId, newStatus, newStage) => {
    setRequests(prev => prev.map(req => 
      req.id === requestId 
        ? { ...req, status: newStatus, currentStage: newStage, updatedAt: new Date().toISOString() }
        : req
    ));
  };

  const handleDecisionMade = (decision, comment) => {
    console.log('Decision made:', decision, 'Comment:', comment);
    
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

    // Update request status based on decision
    const updatedRequests = requests.map(req => {
      if (req.id === selectedRequest.id) {
        let newStage = req.currentStage;
        let newStatus = req.status;
        let newAssignedTo = req.assignedTo;

        switch (decision) {
          case DecisionType.APPROVE:
            if (req.currentStage === WorkflowStage.INITIAL_REVIEW) {
              newStage = WorkflowStage.TECHNICAL_REVIEW;
              newAssignedTo = 3; // Operations team
              newStatus = 'Approved by Loan Admin, forwarded to Operations team';
            } else if (req.currentStage === WorkflowStage.TECHNICAL_REVIEW) {
              newStage = WorkflowStage.CORE_BANKING;
              newAssignedTo = 4; // Core banking
              newStatus = 'Approved by Operations, forwarded to Core Banking';
            }
            break;
          
          case DecisionType.REJECT:
            newStatus = `Rejected: ${comment}`;
            break;
          
          case DecisionType.DISBURSED:
            newStage = WorkflowStage.DISBURSED;
            newStatus = 'Funds successfully disbursed';
            break;
          
          case DecisionType.SEND_TO_OPERATIONS:
            newStage = WorkflowStage.TECHNICAL_REVIEW;
            newAssignedTo = 3;
            newStatus = 'Sent to Operations team for review';
            break;
          
          case DecisionType.SEND_TO_LOAN_ADMIN:
            newStage = WorkflowStage.INITIAL_REVIEW;
            newAssignedTo = 2;
            newStatus = `Returned to Loan Admin: ${comment}`;
            break;
        }

        return {
          ...req,
          currentStage: newStage,
          status: newStatus,
          assignedTo: newAssignedTo,
          updatedAt: new Date().toISOString()
        };
      }
      return req;
    });

    setRequests(updatedRequests);
    
    // Update selected request
    const updatedRequest = updatedRequests.find(req => req.id === selectedRequest.id);
    setSelectedRequest(updatedRequest);
    
    alert(`Decision "${decision}" has been recorded successfully!`);
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

  const handleCreateRequest = async (formData) => {
    try {
      // Convert form data to request format
      const amount = parseFloat(formData.requestedAmount.replace(/[,\s]/g, ''));
      
      const newRequest = {
        id: Date.now(),
        projectNumber: formData.projectNumber,
        refNumber: formData.referenceNumber,
        beneficiaryName: formData.beneficiaryName,
        country: formData.country,
        amount: amount,
        currency: formData.currency,
        valueDate: formData.date,
        currentStage: 'initial_review',
        status: `New request - ${formData.beneficiaryName} - Pending initial review`,
        priority: 'medium',
        assignedTo: 2, // Default to admin
        createdBy: currentUser?.id || 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        processingDays: 0,
        // Include additional data from form
        projectDetails: formData.projectDetails,
        referenceDocumentation: formData.referenceDocumentation,
        documents: formData.documents || []
      };

      // Add to requests list
      setRequests(prev => [newRequest, ...prev]);
      
      alert('✅ Request created successfully!');
      return newRequest.id;
    } catch (error) {
      console.error('Error creating request:', error);
      throw new Error('Failed to create withdrawal request');
    }
  };

  const getFilteredRequests = () => {
    let filtered = requests;

    if (filterStatus !== 'all') {
      filtered = filtered.filter(req => req.currentStage === filterStatus);
    }

    if (filterCountry !== 'all') {
      filtered = filtered.filter(req => req.country === filterCountry);
    }

    if (searchTerm) {
      filtered = filtered.filter(req => 
        req.refNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.beneficiaryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.projectNumber.includes(searchTerm)
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
        {/* Dashboard Stats */}
        <DashboardStats requests={requests} />
        
        {/* Process Tracking */}
        <ProcessTracking requests={requests} />
        
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
        users={mockQuery.users}
        onDecisionMade={handleDecisionMade}
        onAddComment={handleAddComment}
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