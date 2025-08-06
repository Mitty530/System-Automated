import { WorkflowStage, DecisionType, UserRole, CommentType } from '../data/enums.js';

export const formatWorkflowStage = (stage) => {
  const stageNames = {
    [WorkflowStage.INITIAL_REVIEW]: 'Initial Review',
    [WorkflowStage.TECHNICAL_REVIEW]: 'Technical Review', 
    [WorkflowStage.CORE_BANKING]: 'Core Banking',
    [WorkflowStage.DISBURSED]: 'Disbursed'
  };
  return stageNames[stage] || stage;
};

export const formatDecisionType = (decision) => {
  const decisionNames = {
    [DecisionType.APPROVE]: 'Approve',
    [DecisionType.REJECT]: 'Reject',
    [DecisionType.DISBURSED]: 'Disbursed', 
    [DecisionType.SEND_TO_OPERATIONS]: 'Send to Operations',
    [DecisionType.SEND_TO_LOAN_ADMIN]: 'Send to Loan Admin'
  };
  return decisionNames[decision] || decision;
};

export const formatUserRole = (role) => {
  const roleNames = {
    [UserRole.ARCHIVE_TEAM]: 'Archive Team',
    [UserRole.LOAN_ADMIN]: 'Loan Administrator',
    [UserRole.OPERATIONS_TEAM]: 'Operations Team', 
    [UserRole.CORE_BANKING]: 'Core Banking'
  };
  return roleNames[role] || role;
};

export const formatTimeAgo = (timestamp) => {
  const now = new Date();
  const past = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
};