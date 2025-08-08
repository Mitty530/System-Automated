// Workflow actions component for handling request approvals and rejections
import React, { useState } from 'react';
import { Check, X, MessageSquare, ArrowRight, Clock } from 'lucide-react';
import Button from './ui/Button';
import { progressWorkflow, canUserPerformAction } from '../utils/workflowManager';
import { formatWorkflowStage } from '../utils/workflowFormatters';
import { canPerformWorkflowAction } from '../utils/rolePermissions';

const WorkflowActions = ({ 
  request, 
  currentUser, 
  onWorkflowUpdate,
  className = '' 
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [comments, setComments] = useState('');

  // Check if user can perform actions on this request using enhanced permission system
  const currentStage = request?.current_stage || request?.currentStage;

  const canApprove = canPerformWorkflowAction(
    currentUser?.role,
    'approve',
    currentStage,
    request
  );

  const canReject = canPerformWorkflowAction(
    currentUser?.role,
    'reject',
    currentStage,
    request
  );

  const handleAction = (action) => {
    setPendingAction(action);
    setShowCommentModal(true);
    setComments('');
  };

  const executeAction = async () => {
    if (!pendingAction) return;

    setIsProcessing(true);
    try {
      const updatedRequest = await progressWorkflow(
        request.id,
        pendingAction,
        comments,
        currentUser.id
      );

      // Notify parent component
      if (onWorkflowUpdate) {
        onWorkflowUpdate(updatedRequest);
      }

      // Close modal
      setShowCommentModal(false);
      setPendingAction(null);
      setComments('');

    } catch (error) {
      console.error('Error executing workflow action:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const cancelAction = () => {
    setShowCommentModal(false);
    setPendingAction(null);
    setComments('');
  };

  if (!canApprove && !canReject) {
    return (
      <div className={`flex items-center text-gray-500 text-sm ${className}`}>
        <Clock className="w-4 h-4 mr-2" />
        <span>Waiting for {formatWorkflowStage(request.currentStage)}</span>
      </div>
    );
  }

  return (
    <>
      <div className={`flex items-center space-x-3 ${className}`}>
        {canApprove && (
          <Button
            onClick={() => handleAction('approve')}
            variant="success"
            size="sm"
            disabled={isProcessing}
          >
            <Check className="w-4 h-4" />
            <span>Approve</span>
          </Button>
        )}

        {canReject && (
          <Button
            onClick={() => handleAction('reject')}
            variant="danger"
            size="sm"
            disabled={isProcessing}
          >
            <X className="w-4 h-4" />
            <span>Reject</span>
          </Button>
        )}

        <div className="text-sm text-gray-600">
          Current: {formatWorkflowStage(currentStage)}
        </div>
      </div>

      {/* Comment Modal */}
      {showCommentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center mb-4">
              {pendingAction === 'approve' ? (
                <Check className="w-6 h-6 text-green-600 mr-3" />
              ) : (
                <X className="w-6 h-6 text-red-600 mr-3" />
              )}
              <h3 className="text-lg font-semibold">
                {pendingAction === 'approve' ? 'Approve Request' : 'Reject Request'}
              </h3>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Request: {request.beneficiaryName} - {request.country}
              </p>
              <p className="text-sm text-gray-600">
                Amount: {request.currency} {request.amount?.toLocaleString()}
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comments {pendingAction === 'reject' && <span className="text-red-500">*</span>}
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder={
                  pendingAction === 'approve' 
                    ? 'Optional comments for approval...' 
                    : 'Please provide reason for rejection...'
                }
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                required={pendingAction === 'reject'}
              />
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                onClick={cancelAction}
                variant="secondary"
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                onClick={executeAction}
                variant={pendingAction === 'approve' ? 'success' : 'danger'}
                disabled={isProcessing || (pendingAction === 'reject' && !comments.trim())}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    {pendingAction === 'approve' ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Approve & Forward
                      </>
                    ) : (
                      <>
                        <X className="w-4 h-4 mr-2" />
                        Reject Request
                      </>
                    )}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WorkflowActions;
