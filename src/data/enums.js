// Workflow stages and decision types for the enhanced request details system
export const WorkflowStage = {
  INITIAL_REVIEW: 'initial_review',
  TECHNICAL_REVIEW: 'technical_review', 
  CORE_BANKING: 'core_banking',
  DISBURSED: 'disbursed'
};

export const DecisionType = {
  APPROVE: 'approve',
  REJECT: 'reject',
  DISBURSED: 'disbursed',
  SEND_TO_OPERATIONS: 'send_to_operations',
  SEND_TO_LOAN_ADMIN: 'send_to_loan_admin'
};

export const UserRole = {
  ARCHIVE_TEAM: 'archive_team',
  LOAN_ADMIN: 'loan_admin', 
  OPERATIONS_TEAM: 'operations_team',
  CORE_BANKING: 'core_banking'
};

export const CommentType = {
  DECISION: 'decision',
  GENERAL: 'general',
  SYSTEM: 'system'
};

export const NotificationType = {
  NEW_REQUEST: 'new_request',
  DECISION_MADE: 'decision_made',
  RETURNED_FOR_REVISION: 'returned_for_revision',
  READY_FOR_REVIEW: 'ready_for_review'
};