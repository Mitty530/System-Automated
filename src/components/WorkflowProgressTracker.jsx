import React from 'react';
import { CheckCircle, Clock, AlertCircle, ArrowRight, User, Calendar } from 'lucide-react';
import Card from './ui/Card';
import Badge from './ui/Badge';
import { formatWorkflowStage, formatTimeAgo } from '../utils/workflowFormatters';
import { formatDateTime } from '../utils/formatters';
import { WorkflowStage } from '../data/enums';

const WorkflowProgressTracker = ({ 
  request, 
  auditEntries = [], 
  users = {} 
}) => {
  // Define the 5-stage workflow in order
  const workflowStages = [
    {
      stage: WorkflowStage.SUBMITTED,
      label: 'Archive Team',
      description: 'Request created by Archive Team'
    },
    {
      stage: WorkflowStage.UNDER_LOAN_REVIEW,
      label: 'Loan Administrator',
      description: 'Under review by Loan Administrator'
    },
    {
      stage: WorkflowStage.UNDER_OPERATIONS_REVIEW,
      label: 'Operations Team',
      description: 'Under review by Regional Operations Team'
    },
    {
      stage: WorkflowStage.APPROVED,
      label: 'Core Banking',
      description: 'Approved by Core Banking'
    },
    {
      stage: WorkflowStage.DISBURSED,
      label: 'Disbursed',
      description: 'Funds successfully disbursed'
    }
  ];

  const currentStage = request?.current_stage || request?.currentStage;
  const isRejected = currentStage === WorkflowStage.RETURNED_FOR_MODIFICATION;

  // Get stage status
  const getStageStatus = (stage) => {
    if (isRejected && stage === WorkflowStage.UNDER_OPERATIONS_REVIEW) {
      return 'rejected';
    }
    
    const stageIndex = workflowStages.findIndex(s => s.stage === stage);
    const currentIndex = workflowStages.findIndex(s => s.stage === currentStage);
    
    if (currentIndex === -1) return 'pending';
    
    if (stageIndex < currentIndex) return 'completed';
    if (stageIndex === currentIndex) return 'current';
    return 'pending';
  };

  // Get stage icon
  const getStageIcon = (stage, status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'current':
        return <Clock className="w-5 h-5 text-blue-600 animate-pulse" />;
      case 'rejected':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>;
    }
  };

  // Get stage colors
  const getStageColors = (status) => {
    switch (status) {
      case 'completed':
        return {
          dot: 'bg-green-600',
          line: 'bg-green-200',
          text: 'text-green-800',
          bg: 'bg-green-50'
        };
      case 'current':
        return {
          dot: 'bg-blue-600',
          line: 'bg-blue-200',
          text: 'text-blue-800',
          bg: 'bg-blue-50'
        };
      case 'rejected':
        return {
          dot: 'bg-red-600',
          line: 'bg-red-200',
          text: 'text-red-800',
          bg: 'bg-red-50'
        };
      default:
        return {
          dot: 'bg-gray-300',
          line: 'bg-gray-200',
          text: 'text-gray-600',
          bg: 'bg-gray-50'
        };
    }
  };

  // Get audit entry for stage
  const getAuditEntryForStage = (stage) => {
    return auditEntries.find(entry => 
      entry.to_stage === stage || 
      (stage === WorkflowStage.SUBMITTED && entry.from_stage === null)
    );
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-gray-900 flex items-center">
          <ArrowRight className="w-5 h-5 mr-2 text-blue-500" />
          Workflow Progress
        </h3>
        <Badge variant={isRejected ? 'urgent' : 'default'}>
          {isRejected ? 'Returned for Modification' : formatWorkflowStage(currentStage)}
        </Badge>
      </div>

      {/* Special handling for rejected requests */}
      {isRejected && (
        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <span className="font-medium text-orange-800">Request Returned for Modification</span>
          </div>
          <p className="text-sm text-orange-700">
            This request was rejected by the operations team and returned to the loan administrator for modifications.
          </p>
        </div>
      )}

      {/* Workflow stages */}
      <div className="space-y-4">
        {workflowStages.map((stageInfo, index) => {
          const status = getStageStatus(stageInfo.stage);
          const colors = getStageColors(status);
          const auditEntry = getAuditEntryForStage(stageInfo.stage);
          const isLast = index === workflowStages.length - 1;

          return (
            <div key={stageInfo.stage} className="relative">
              {/* Connecting line */}
              {!isLast && (
                <div className={`absolute left-6 top-12 w-0.5 h-8 ${colors.line}`}></div>
              )}

              <div className="flex items-start space-x-4">
                {/* Stage indicator */}
                <div className={`w-12 h-12 rounded-full ${colors.dot} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                  {getStageIcon(stageInfo.stage, status)}
                </div>

                {/* Stage content */}
                <div className="flex-1 min-w-0">
                  <div className={`p-4 rounded-lg ${colors.bg} border border-opacity-20`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className={`font-semibold ${colors.text}`}>
                        {stageInfo.label}
                      </h4>
                      {auditEntry && (
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(auditEntry.created_at)}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">
                      {stageInfo.description}
                    </p>

                    {/* Show audit details if available */}
                    {auditEntry && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center space-x-2 text-sm">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-700">
                            {auditEntry.user_profiles?.full_name || 'Unknown User'}
                          </span>
                          <Badge variant="default" className="text-xs">
                            {auditEntry.user_profiles?.role || 'User'}
                          </Badge>
                          <Calendar className="w-4 h-4 text-gray-400 ml-2" />
                          <span className="text-gray-500">
                            {formatDateTime(auditEntry.created_at)}
                          </span>
                        </div>
                        
                        {auditEntry.comment && (
                          <div className="mt-2 p-2 bg-white rounded border-l-4 border-blue-200">
                            <p className="text-sm text-gray-700 italic">
                              "{auditEntry.comment}"
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Current status summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-gray-700">Current Status:</span>
            <p className="text-sm text-gray-600 mt-1">
              {request?.status || 'Status not available'}
            </p>
          </div>
          {request?.assigned_to && users[request.assigned_to] && (
            <div className="text-right">
              <span className="text-sm font-medium text-gray-700">Assigned to:</span>
              <p className="text-sm text-gray-600 mt-1">
                {users[request.assigned_to].full_name}
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default WorkflowProgressTracker;
