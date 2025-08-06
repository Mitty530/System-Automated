import React, { useState } from 'react';
import { FileText, Download, Eye, Calendar, DollarSign, Globe, Building, X, MessageCircle, Clock, CheckCircle } from 'lucide-react';
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

const EnhancedRequestDetailsModal = ({ 
  isOpen, 
  onClose, 
  request,
  currentUser,
  auditTrail = [],
  comments = [],
  users = {},
  onDecisionMade,
  onAddComment,
  initialTab = 'details'
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);

  if (!request) return null;

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
            <p className="text-blue-100">{request.refNumber} • {request.beneficiaryName}</p>
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
      
      {/* Tab Navigation */}
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
              {tab.id === 'comments' && comments.length > 0 && (
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  {comments.length}
                </span>
              )}
              {tab.id === 'audit' && auditTrail.length > 0 && (
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  {auditTrail.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      
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
                      <div className="text-lg font-semibold text-gray-900 font-mono">{request.projectNumber}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 font-medium">Reference Number</span>
                      <div className="text-lg font-semibold text-gray-900 font-mono">{request.refNumber}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 font-medium">Country</span>
                      <div className="text-lg font-semibold text-gray-900 flex items-center">
                        <Globe className="w-4 h-4 mr-2 text-gray-500" />
                        {request.country}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 font-medium">Beneficiary</span>
                      <div className="text-lg font-semibold text-gray-900 flex items-center">
                        <Building className="w-4 h-4 mr-2 text-gray-500" />
                        {request.beneficiaryName}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <span className="text-sm text-gray-600 font-medium">Amount</span>
                      <div className="text-lg font-semibold text-gray-900 flex items-center">
                        <DollarSign className="w-4 h-4 mr-2 text-gray-500" />
                        {formatCurrency(request.amount, request.currency)}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 font-medium">Value Date</span>
                      <div className="text-lg font-semibold text-gray-900 flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                        {formatDate(request.valueDate)}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 font-medium">Priority</span>
                      <div className="mt-1">
                        <Badge variant={getPriorityBadgeVariant(request.priority)}>
                          {request.priority}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 font-medium">Status</span>
                      <div className="flex items-center mt-1">
                        <StatusIcon stage={request.currentStage} />
                        <Badge variant={getStatusBadgeVariant(request.currentStage)} className="ml-2">
                          {formatWorkflowStage(request.currentStage)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Status Description */}
                <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                  <span className="text-sm text-gray-600 font-medium">Current Status:</span>
                  <div className="text-sm text-gray-800 mt-1">{request.status}</div>
                </div>
              </Card>

              {/* Project Details */}
              {request.projectDetails && (
                <Card className="p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Project Details</h3>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="text-sm text-gray-800 whitespace-pre-wrap">{request.projectDetails}</div>
                  </div>
                </Card>
              )}

              {/* Reference Documentation */}
              {request.referenceDocumentation && (
                <Card className="p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Reference Documentation</h3>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="text-sm text-gray-800 whitespace-pre-wrap">{request.referenceDocumentation}</div>
                  </div>
                </Card>
              )}

              {/* Documents */}
              <Card className="p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-blue-500" />
                  Supporting Documents
                  {request.documents && request.documents.length > 0 && (
                    <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {request.documents.length}
                    </span>
                  )}
                </h3>
                {request.documents && request.documents.length > 0 ? (
                  <div className="space-y-3">
                    {request.documents.map((doc, index) => (
                      <div key={doc.id || index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                            <FileText className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{doc.name}</div>
                            <div className="text-xs text-gray-500">
                              {doc.size ? formatFileSize(doc.size) : 'Unknown size'}
                              {doc.uploadedAt && (
                                <span className="ml-2">• Uploaded {formatDate(doc.uploadedAt)}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            title="View document"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            title="Download document"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
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
                    <span className="text-sm text-gray-600">{formatDate(request.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-200">
                    <span className="text-sm font-medium text-gray-700">Last Updated</span>
                    <span className="text-sm text-gray-600">{formatDate(request.updatedAt)}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm font-medium text-gray-700">Processing Days</span>
                    <span className="text-sm text-gray-600">{request.processingDays} days</span>
                  </div>
                </div>
              </Card>
            </>
          )}

          {/* Workflow Tab */}
          {activeTab === 'workflow' && (
            <>
              <WorkflowStatusIndicator 
                currentStage={request.currentStage}
                assignedTo={request.assignedTo}
                users={users}
              />
              <DecisionActionPanel 
                request={request}
                currentUser={currentUser}
                onDecision={onDecisionMade}
              />
            </>
          )}

          {/* Audit Trail Tab */}
          {activeTab === 'audit' && (
            <AuditTrailSection auditEntries={auditTrail} />
          )}

          {/* Comments Tab */}
          {activeTab === 'comments' && (
            <CommentsSection 
              comments={comments}
              onAddComment={onAddComment}
              currentUser={currentUser}
            />
          )}
        </div>

        {/* Action Footer */}
        <div className="bg-white px-8 py-4 flex justify-between items-center border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Request ID: {request.id}
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
      </div>
    </Modal>
  );
};

export default EnhancedRequestDetailsModal;