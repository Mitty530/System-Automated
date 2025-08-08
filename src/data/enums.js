// Workflow stages and decision types for the enhanced request details system
export const WorkflowStage = {
  SUBMITTED: 'submitted',
  UNDER_LOAN_REVIEW: 'under_loan_review',
  UNDER_OPERATIONS_REVIEW: 'under_operations_review',
  RETURNED_FOR_MODIFICATION: 'returned_for_modification',
  APPROVED: 'approved',
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
  ADMIN: 'admin',
  ARCHIVE_TEAM: 'archive_team',
  LOAN_ADMINISTRATOR: 'loan_administrator',
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