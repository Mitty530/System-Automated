import React from 'react';
import { ArrowRight, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import Card from './ui/Card';
import Badge from './ui/Badge';
import { WorkflowStage, UserRole } from '../data/enums';
import { formatWorkflowStage, formatUserRole } from '../utils/workflowFormatters';

const WorkflowStatusIndicator = ({ 
  currentStage, 
  assignedTo, 
  users = {} 
}) => {
  const workflowStages = [
    {
      stage: WorkflowStage.SUBMITTED,
      label: 'Submitted',
      description: 'Archive team created and submitted request',
      icon: <Clock className="w-4 h-4" />
    },
    {
      stage: WorkflowStage.UNDER_LOAN_REVIEW,
      label: 'Under Loan Review',
      description: 'Loan administrator reviewing request details',
      icon: <AlertCircle className="w-4 h-4" />
    },
    {
      stage: WorkflowStage.UNDER_OPERATIONS_REVIEW,
      label: 'Under Operations Review',
      description: 'Regional operations team reviewing for approval',
      icon: <Clock className="w-4 h-4" />
    },
    {
      stage: WorkflowStage.RETURNED_FOR_MODIFICATION,
      label: 'Returned for Modification',
      description: 'Returned to loan administrator for modifications',
      icon: <AlertCircle className="w-4 h-4" />
    },
    {
      stage: WorkflowStage.APPROVED,
      label: 'Approved',
      description: 'Request approved, ready for core banking processing',
      icon: <CheckCircle className="w-4 h-4" />
    },
    {
      stage: WorkflowStage.DISBURSED,
      label: 'Disbursed',
      description: 'Funds have been successfully disbursed',
      icon: <CheckCircle className="w-4 h-4" />
    }
  ];

  const getStageStatus = (stage) => {
    const currentIndex = workflowStages.findIndex(s => s.stage === currentStage);
    const stageIndex = workflowStages.findIndex(s => s.stage === stage);
    
    if (stageIndex < currentIndex) return 'completed';
    if (stageIndex === currentIndex) return 'current';
    return 'pending';
  };

  const getStageClasses = (status) => {
    switch (status) {
      case 'completed':
        return 'workflowstatusapproved';
      case 'current':
        return 'workflowstatusinprogress';
      case 'pending':
        return 'workflowstatuspending opacity-50';
      default:
        return 'workflowstatuspending';
    }
  };

  const assignedUser = users[assignedTo];
  const nextStageIndex = workflowStages.findIndex(s => s.stage === currentStage) + 1;
  const nextStage = nextStageIndex < workflowStages.length ? workflowStages[nextStageIndex] : null;

  return (
    <Card className="p-6">
      <h3 className="font-bold text-gray-900 mb-4 flex items-center">
        <ArrowRight className="w-5 h-5 mr-2 text-blue-500" />
        Workflow Progress
      </h3>
      
      {/* Current Status */}
      <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-blue-900">Current Stage</h4>
          <Badge variant="medium">
            {formatWorkflowStage(currentStage)}
          </Badge>
        </div>
        
        {assignedUser && (
          <div className="flex items-center space-x-2 text-sm text-blue-700">
            <span>Assigned to:</span>
            <span className="font-medium">{assignedUser.name}</span>
            <Badge variant="default" className="text-xs">
              {formatUserRole(assignedUser.role)}
            </Badge>
          </div>
        )}
      </div>

      {/* Workflow Timeline */}
      <div className="space-y-3">
        {workflowStages.map((stage, index) => {
          const status = getStageStatus(stage.stage);
          const isLast = index === workflowStages.length - 1;
          
          return (
            <div key={stage.stage} className="relative">
              {/* Connector line */}
              {!isLast && (
                <div className="absolute left-4 top-8 w-0.5 h-8 bg-gray-200"></div>
              )}
              
              <div className="flex items-start space-x-4">
                {/* Stage indicator */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0 ${getStageClasses(status)}`}>
                  {status === 'completed' ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    stage.icon
                  )}
                </div>
                
                {/* Stage content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h5 className={`font-medium ${status === 'current' ? 'text-blue-900' : status === 'completed' ? 'text-green-700' : 'text-gray-500'}`}>
                      {stage.label}
                    </h5>
                    {status === 'current' && (
                      <Badge variant="medium" className="text-xs">
                        In Progress
                      </Badge>
                    )}
                    {status === 'completed' && (
                      <Badge variant="success" className="text-xs">
                        Completed
                      </Badge>
                    )}
                  </div>
                  <p className={`text-sm ${status === 'current' ? 'text-blue-700' : status === 'completed' ? 'text-green-600' : 'text-gray-400'}`}>
                    {stage.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Next Steps */}
      {nextStage && (
        <div className="mt-6 p-4 bg-gray-50 rounded-xl">
          <h4 className="font-semibold text-gray-900 mb-2">Next Step</h4>
          <div className="flex items-center space-x-2 text-sm text-gray-700">
            <ArrowRight className="w-4 h-4 text-gray-400" />
            <span>{nextStage.label}: {nextStage.description}</span>
          </div>
        </div>
      )}
    </Card>
  );
};

export default WorkflowStatusIndicator;