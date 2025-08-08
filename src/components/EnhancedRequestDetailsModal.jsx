import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Download, Eye, Calendar, DollarSign, Globe, Building, X, MessageCircle, Clock, CheckCircle, Loader } from 'lucide-react';
import Modal from './ui/Modal';
import Card from './ui/Card';
import Button from './ui/Button';
import Badge from './ui/Badge';
import StatusIcon from './StatusIcon';
import DecisionActionPanel from './DecisionActionPanel';
import AuditTrailSection from './AuditTrailSection';
import CommentsSection from './CommentsSection';
import WorkflowStatusIndicator from './WorkflowStatusIndicator';
import { formatCurrency, formatDate, formatFileSize } from '../utils/formatters';
import { formatWorkflowStage } from '../utils/workflowFormatters';
import { getRequestDetails, addComment, recordDecision } from '../services/requestService';
import { supabase } from '../lib/supabase';

const EnhancedRequestDetailsModal = ({
  isOpen,
  onClose,
  request,
  currentUser,
  comments = [],
  users = {},
  onDecisionMade,
  onAddComment,
  initialTab = 'details'
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [requestDetails, setRequestDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Define loadRequestDetails function first
  const loadRequestDetails = useCallback(async () => {
    if (!request?.id) return;

    setLoading(true);
    setError(null);

    try {
      const details = await getRequestDetails(request.id);
      setRequestDetails(details);
    } catch (err) {
      console.error('Error loading request details:', err);
      setError('Failed to load request details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [request?.id]);

  // Load complete request details when modal opens
  useEffect(() => {
    if (isOpen && request?.id) {
      loadRequestDetails();
    }
  }, [isOpen, request?.id, loadRequestDetails]);

  // Handle adding comments
  const handleAddComment = async (commentText, commentType = 'general') => {
    if (!requestDetails?.id || !currentUser?.id) return;

    try {
      const newComment = await addComment(requestDetails.id, currentUser.id, commentText, commentType);

      // Update local state with new comment
      setRequestDetails(prev => ({
        ...prev,
        comments: [...(prev.comments || []), newComment]
      }));

      // Call parent callback if provided
      if (onAddComment) {
        onAddComment(newComment);
      }
    } catch (err) {
      console.error('Error adding comment:', err);
      alert('Failed to add comment. Please try again.');
    }
  };

  // Handle workflow decisions
  const handleDecisionMade = async (decisionType, comment) => {
    if (!requestDetails?.id || !currentUser?.id) return;

    try {
      const result = await recordDecision(
        requestDetails.id,
        currentUser.id,
        decisionType,
        comment,
        requestDetails.current_stage,
        getNextStage(decisionType, requestDetails.current_stage)
      );

      // Update local state with updated request
      setRequestDetails(prev => ({
        ...prev,
        ...result.request,
        decisions: [...(prev.decisions || []), result.decision]
      }));

      // Call parent callback if provided
      if (onDecisionMade) {
        onDecisionMade(decisionType, comment);
      }
    } catch (err) {
      console.error('Error recording decision:', err);
      alert('Failed to record decision. Please try again.');
    }
  };

  // Helper function to determine next stage based on decision
  const getNextStage = (decisionType, currentStage) => {
    const stageMap = {
      'approve': {
        'technical_review': 'regional_approval',
        'regional_approval': 'core_banking',
        'core_banking': 'disbursed'
      },
      'reject': {
        'technical_review': 'initial_review',
        'regional_approval': 'technical_review',
        'core_banking': 'regional_approval'
      },
      'send_to_operations': 'regional_approval',
      'send_to_loan_admin': 'technical_review',
      'disbursed': 'disbursed'
    };

    return stageMap[decisionType]?.[currentStage] || currentStage;
  };

  const handleDownloadDocument = async (doc) => {
    try {
      const filePath = doc.file_path;
      if (!filePath) {
        console.error('No file path available for document:', doc);
        return;
      }

      // Get signed URL for download
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(filePath, 60); // 60 seconds expiry

      if (error) {
        console.error('Error creating signed URL:', error);
        return;
      }

      // Create download link and trigger download
      const link = document.createElement('a');
      link.href = data.signedUrl;
      link.download = doc.file_name || doc.name || 'document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading document:', error);
    }
  };

  const handleViewDocument = async (doc) => {
    try {
      const filePath = doc.file_path;
      if (!filePath) {
        console.error('No file path available for document:', doc);
        return;
      }

      // Get signed URL for viewing
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(filePath, 60); // 60 seconds expiry

      if (error) {
        console.error('Error creating signed URL:', error);
        return;
      }

      // Open in new tab
      window.open(data.signedUrl, '_blank');
    } catch (error) {
      console.error('Error viewing document:', error);
    }
  };



  if (!request) return null;

  // Use requestDetails if loaded, otherwise fall back to request prop
  const displayRequest = requestDetails || request;
  const displayComments = requestDetails?.comments || comments;
  const displayDecisions = requestDetails?.decisions || [];

  const getPriorityBadgeVariant = (priority) => {
    switch (priority) {
      case 'urgent': return 'urgent';
      case 'high': return 'high';
      case 'medium': return 'medium';
      case 'low': return 'low';
      default: return 'default';
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'disbursed': return 'success';
      case 'core_banking': return 'warning';
      case 'technical_review': return 'medium';
      case 'initial_review': return 'default';
      default: return 'default';
    }
  };

  const tabs = [
    { id: 'details', label: 'Details', icon: <FileText className="w-4 h-4" /> },
    { id: 'workflow', label: 'Workflow', icon: <CheckCircle className="w-4 h-4" /> },
    { id: 'audit', label: 'Audit Trail', icon: <Clock className="w-4 h-4" /> },
    { id: 'comments', label: 'Comments', icon: <MessageCircle className="w-4 h-4" /> }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-t-3xl">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Request Details</h2>
            <p className="text-blue-100">{displayRequest.ref_number || displayRequest.refNumber} • {displayRequest.beneficiary_name || displayRequest.beneficiaryName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-white bg-white/20 hover:bg-white/30 p-3 rounded-2xl transition-all duration-200 flex items-center justify-center"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader className="w-6 h-6 animate-spin text-blue-500 mr-2" />
          <span className="text-gray-600">Loading request details...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mx-6 mt-4">
          <p>{error}</p>
          <button
            onClick={loadRequestDetails}
            className="mt-2 text-sm underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      {!loading && !error && (
        <>
          <div className="bg-white border-b border-gray-200">
            <div className="flex space-x-8 px-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {tab.id === 'comments' && displayComments.length > 0 && (
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      {displayComments.length}
                    </span>
                  )}
                  {tab.id === 'audit' && displayDecisions.length > 0 && (
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      {displayDecisions.length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="max-h-[80vh] overflow-y-auto">
            <div className="p-8 space-y-6">
          {/* Details Tab */}
          {activeTab === 'details' && (
            <>
              {/* Request Information */}
              <Card className="p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-blue-500" />
                  Request Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <span className="text-sm text-gray-600 font-medium">Project Number</span>
                      <div className="text-lg font-semibold text-gray-900 font-mono">{displayRequest.project_number || displayRequest.projectNumber}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 font-medium">Reference Number</span>
                      <div className="text-lg font-semibold text-gray-900 font-mono">{displayRequest.ref_number || displayRequest.refNumber}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 font-medium">Country</span>
                      <div className="text-lg font-semibold text-gray-900 flex items-center">
                        <Globe className="w-4 h-4 mr-2 text-gray-500" />
                        {displayRequest.country}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 font-medium">Beneficiary</span>
                      <div className="text-lg font-semibold text-gray-900 flex items-center">
                        <Building className="w-4 h-4 mr-2 text-gray-500" />
                        {displayRequest.beneficiary_name || displayRequest.beneficiaryName}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <span className="text-sm text-gray-600 font-medium">Amount</span>
                      <div className="text-lg font-semibold text-gray-900 flex items-center">
                        <DollarSign className="w-4 h-4 mr-2 text-gray-500" />
                        {formatCurrency(displayRequest.amount, displayRequest.currency)}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 font-medium">Value Date</span>
                      <div className="text-lg font-semibold text-gray-900 flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                        {formatDate(displayRequest.value_date || displayRequest.valueDate)}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 font-medium">Priority</span>
                      <div className="mt-1">
                        <Badge variant={getPriorityBadgeVariant(displayRequest.priority)}>
                          {displayRequest.priority}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 font-medium">Status</span>
                      <div className="flex items-center mt-1">
                        <StatusIcon stage={displayRequest.current_stage || displayRequest.currentStage} />
                        <Badge variant={getStatusBadgeVariant(displayRequest.current_stage || displayRequest.currentStage)} className="ml-2">
                          {formatWorkflowStage(displayRequest.current_stage || displayRequest.currentStage)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Description */}
                <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                  <span className="text-sm text-gray-600 font-medium">Current Status:</span>
                  <div className="text-sm text-gray-800 mt-1">{displayRequest.status}</div>
                </div>
              </Card>

              {/* Project Details */}
              {(displayRequest.project_details || displayRequest.projectDetails) && (
                <Card className="p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Project Details</h3>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="text-sm text-gray-800 whitespace-pre-wrap">{displayRequest.project_details || displayRequest.projectDetails}</div>
                  </div>
                </Card>
              )}

              {/* Reference Documentation */}
              {(displayRequest.reference_documentation || displayRequest.referenceDocumentation) && (
                <Card className="p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Reference Documentation</h3>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="text-sm text-gray-800 whitespace-pre-wrap">{displayRequest.reference_documentation || displayRequest.referenceDocumentation}</div>
                  </div>
                </Card>
              )}

              {/* Documents */}
              <Card className="p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-blue-500" />
                  Supporting Documents
                  {requestDetails?.documents && requestDetails.documents.length > 0 && (
                    <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {requestDetails.documents.length}
                    </span>
                  )}
                </h3>
                {requestDetails?.documents && requestDetails.documents.length > 0 ? (
                  <div className="space-y-3">
                    {requestDetails.documents.map((doc, index) => {
                      // Handle both old format and new database format
                      const fileName = doc.file_name || doc.original_filename || doc.filename || doc.name || 'Unknown file';
                      const fileSize = doc.file_size;
                      const uploadedAt = doc.uploaded_at || doc.created_at;
                      const uploadedBy = doc.user_profiles?.full_name || doc.uploaded_by_profile?.full_name || 'Unknown user';

                      return (
                        <div key={doc.id || index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                              <FileText className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{fileName}</div>
                              <div className="text-xs text-gray-500">
                                {fileSize ? formatFileSize(fileSize) : 'Unknown size'}
                                {uploadedAt && (
                                  <span className="ml-2">• Uploaded {formatDate(uploadedAt)}</span>
                                )}
                                {uploadedBy && uploadedBy !== 'Unknown user' && (
                                  <span className="ml-2">• by {uploadedBy}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              title="View document"
                              onClick={() => handleViewDocument(doc)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              title="Download document"
                              onClick={() => handleDownloadDocument(doc)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>No documents uploaded</p>
                  </div>
                )}
              </Card>

              {/* Request Timeline */}
              <Card className="p-6">
                <h3 className="font-bold text-gray-900 mb-4">Request Timeline</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-gray-200">
                    <span className="text-sm font-medium text-gray-700">Created</span>
                    <span className="text-sm text-gray-600">{formatDate(displayRequest.created_at || displayRequest.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-200">
                    <span className="text-sm font-medium text-gray-700">Last Updated</span>
                    <span className="text-sm text-gray-600">{formatDate(displayRequest.updated_at || displayRequest.updatedAt)}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm font-medium text-gray-700">Processing Days</span>
                    <span className="text-sm text-gray-600">{displayRequest.processing_days || displayRequest.processingDays || 0} days</span>
                  </div>
                </div>
              </Card>
            </>
          )}

          {/* Workflow Tab */}
          {activeTab === 'workflow' && (
            <>
              <WorkflowStatusIndicator
                currentStage={displayRequest.current_stage || displayRequest.currentStage}
                assignedTo={displayRequest.assigned_to || displayRequest.assignedTo}
                users={users}
              />
              <DecisionActionPanel
                request={displayRequest}
                currentUser={currentUser}
                onDecision={handleDecisionMade}
              />
            </>
          )}

          {/* Audit Trail Tab */}
          {activeTab === 'audit' && (
            <AuditTrailSection auditEntries={displayDecisions} />
          )}

          {/* Comments Tab */}
          {activeTab === 'comments' && (
            <CommentsSection
              comments={displayComments}
              onAddComment={handleAddComment}
              currentUser={currentUser}
            />
          )}
            </div>
          </div>
        </>
      )}

      {/* Action Footer */}
      <div className="bg-white px-8 py-4 flex justify-between items-center border-t border-gray-200">
        <div className="text-sm text-gray-600">
          Request ID: {requestDetails?.id || request?.id}
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={onClose}
            variant="secondary"
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default EnhancedRequestDetailsModal;