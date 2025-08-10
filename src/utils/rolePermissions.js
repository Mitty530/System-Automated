// ADFD Role-based permission system based on system_directory.txt
// Implements proper role-based access control for production use

export const USER_ROLES = {
  ADMIN: 'admin',
  ARCHIVE_TEAM: 'archive_team',
  OPERATIONS_TEAM: 'operations_team', 
  CORE_BANKING: 'core_banking',
  LOAN_ADMINISTRATOR: 'loan_administrator',
  OBSERVER: 'observer'
};

export const PERMISSIONS = {
  CREATE_REQUEST: 'create_request',
  SUBMIT_REQUEST: 'submit_request',
  VIEW_REQUEST: 'view_request',
  EDIT_REQUEST: 'edit_request',
  APPROVE_REQUEST: 'approve_request',
  REJECT_REQUEST: 'reject_request',
  DISBURSE_REQUEST: 'disburse_request',
  DELETE_REQUEST: 'delete_request',
  VIEW_DASHBOARD: 'view_dashboard',
  MANAGE_USERS: 'manage_users',
  VIEW_AUDIT_LOG: 'view_audit_log',
  EXPORT_DATA: 'export_data'
};

// Role-based permissions based on system_directory.txt
export const ROLE_PERMISSIONS = {
  [USER_ROLES.ADMIN]: Object.values(PERMISSIONS), // Full access
  [USER_ROLES.ARCHIVE_TEAM]: [
    PERMISSIONS.CREATE_REQUEST,
    PERMISSIONS.SUBMIT_REQUEST,
    PERMISSIONS.VIEW_REQUEST,
    PERMISSIONS.VIEW_DASHBOARD
  ],
  [USER_ROLES.OPERATIONS_TEAM]: [
    PERMISSIONS.VIEW_REQUEST,
    PERMISSIONS.APPROVE_REQUEST,
    PERMISSIONS.REJECT_REQUEST,
    PERMISSIONS.VIEW_DASHBOARD
  ],
  [USER_ROLES.CORE_BANKING]: [
    PERMISSIONS.VIEW_REQUEST,
    PERMISSIONS.DISBURSE_REQUEST,
    PERMISSIONS.VIEW_DASHBOARD
  ],
  [USER_ROLES.LOAN_ADMINISTRATOR]: Object.values(PERMISSIONS), // Full access
  [USER_ROLES.OBSERVER]: [
    PERMISSIONS.VIEW_REQUEST,
    PERMISSIONS.VIEW_DASHBOARD
  ]
};

// Check if user has specific permission
export const hasPermission = (userRole, permission) => {
  if (!userRole || !permission) return false;
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return rolePermissions.includes(permission);
};

// Check if user can perform action based on role and request stage
export const canPerformAction = (userRole, action, requestStage = null, requestCreatedBy = null, currentUserId = null) => {
  if (!userRole || !action) return false;

  // Admin and Loan Administrator can do everything
  if (userRole === USER_ROLES.ADMIN || userRole === USER_ROLES.LOAN_ADMINISTRATOR) {
    return true;
  }

  // Role-specific action permissions with stage validation
  switch (action) {
    case 'create':
      return userRole === USER_ROLES.ARCHIVE_TEAM;

    case 'submit':
      return userRole === USER_ROLES.ARCHIVE_TEAM &&
             (!requestStage || requestStage === 'draft' || requestStage === 'submitted');

    case 'approve':
      return userRole === USER_ROLES.OPERATIONS_TEAM &&
             requestStage === 'under_operations_review';

    case 'reject':
      return userRole === USER_ROLES.OPERATIONS_TEAM &&
             requestStage === 'under_operations_review';

    case 'disburse':
      return userRole === USER_ROLES.CORE_BANKING &&
             requestStage === 'approved';

    case 'view':
      return true; // All users can view

    case 'edit':
      // Archive team can only edit their own requests before submission
      if (userRole === USER_ROLES.ARCHIVE_TEAM) {
        return (!requestStage || requestStage === 'draft') &&
               (!requestCreatedBy || !currentUserId || requestCreatedBy === currentUserId);
      }
      // Loan administrators can edit anytime
      return userRole === USER_ROLES.LOAN_ADMINISTRATOR;

    case 'delete':
      // Only admins can delete
      return userRole === USER_ROLES.ADMIN;

    default:
      return false;
  }
};

// Get role display name
export const getRoleDisplayName = (role) => {
  const roleNames = {
    [USER_ROLES.ADMIN]: 'System Administrator',
    [USER_ROLES.ARCHIVE_TEAM]: 'Archive Team',
    [USER_ROLES.OPERATIONS_TEAM]: 'Operations Team',
    [USER_ROLES.CORE_BANKING]: 'Core Banking Team',
    [USER_ROLES.LOAN_ADMINISTRATOR]: 'Loan Administrator',
    [USER_ROLES.OBSERVER]: 'Observer'
  };
  return roleNames[role] || 'User';
};

// Get role color for UI display
export const getRoleColor = (role) => {
  const colors = {
    [USER_ROLES.ADMIN]: 'bg-purple-100 text-purple-800',
    [USER_ROLES.ARCHIVE_TEAM]: 'bg-blue-100 text-blue-800',
    [USER_ROLES.OPERATIONS_TEAM]: 'bg-green-100 text-green-800',
    [USER_ROLES.CORE_BANKING]: 'bg-orange-100 text-orange-800',
    [USER_ROLES.LOAN_ADMINISTRATOR]: 'bg-gray-100 text-gray-800',
    [USER_ROLES.OBSERVER]: 'bg-yellow-100 text-yellow-800'
  };
  return colors[role] || 'bg-gray-100 text-gray-800';
};

// Get available actions based on user role and request stage
export const getAvailableActions = (userRole) => {
  if (!userRole) return [];

  const actions = [];

  // Admin and Loan Administrator can do everything
  if (userRole === USER_ROLES.ADMIN || userRole === USER_ROLES.LOAN_ADMINISTRATOR) {
    return ['create', 'submit', 'approve', 'reject', 'disburse', 'edit', 'delete', 'view'];
  }

  // Role-specific available actions
  switch (userRole) {
    case USER_ROLES.ARCHIVE_TEAM:
      actions.push('create', 'submit', 'view');
      break;

    case USER_ROLES.OPERATIONS_TEAM:
      actions.push('approve', 'reject', 'view');
      break;

    case USER_ROLES.CORE_BANKING:
      actions.push('disburse', 'view');
      break;

    case USER_ROLES.OBSERVER:
      actions.push('view');
      break;

    default:
      actions.push('view');
  }

  return actions;
};

// Check if user can perform workflow action based on current stage
export const canPerformWorkflowAction = (userRole, action, currentStage) => {
  if (!userRole || !action || !currentStage) return false;

  // Admin and Loan Administrator can do everything
  if (userRole === USER_ROLES.ADMIN || userRole === USER_ROLES.LOAN_ADMINISTRATOR) {
    return true;
  }

  // Workflow-specific permission checks
  switch (currentStage) {
    case 'submitted':
      // Only loan administrators can act on submitted requests
      return userRole === USER_ROLES.LOAN_ADMINISTRATOR && (action === 'approve' || action === 'reject' || action === 'edit');

    case 'under_loan_review':
      // Only loan administrators can act on requests under loan review
      return userRole === USER_ROLES.LOAN_ADMINISTRATOR && (action === 'approve' || action === 'reject' || action === 'edit');

    case 'under_operations_review':
      // Only operations team can approve/reject, loan admins can still edit
      if (userRole === USER_ROLES.OPERATIONS_TEAM) {
        return action === 'approve' || action === 'reject';
      }
      return userRole === USER_ROLES.LOAN_ADMINISTRATOR && action === 'edit';

    case 'returned_for_modification':
      // Only loan administrators can act on returned requests
      return userRole === USER_ROLES.LOAN_ADMINISTRATOR && (action === 'approve' || action === 'reject' || action === 'edit');

    case 'approved':
      // Core banking stage - only core banking can approve to disburse
      if (userRole === USER_ROLES.CORE_BANKING) {
        return action === 'approve' || action === 'view';
      }
      return userRole === USER_ROLES.LOAN_ADMINISTRATOR && action === 'edit';

    case 'disbursed':
      // Disbursed requests - only viewing allowed
      return action === 'view';

    default:
      return false;
  }
};

// Get allowed actions for user based on request stage
export const getAllowedActionsForStage = (userRole, currentStage) => {
  if (!userRole || !currentStage) return ['view'];

  const actions = ['view']; // Everyone can view

  // Admin has full access to all stages and actions
  if (userRole === USER_ROLES.ADMIN) {
    switch (currentStage) {
      case 'submitted':
      case 'under_loan_review':
      case 'returned_for_modification':
        actions.push('approve', 'reject', 'edit');
        break;
      case 'under_operations_review':
        actions.push('approve', 'reject', 'edit'); // Admin can do everything
        break;
      case 'approved':
        actions.push('approve', 'edit'); // Admin can approve at core banking stage
        break;
      case 'disbursed':
        actions.push('edit'); // Admin can even edit disbursed requests
        break;
    }
    return actions;
  }

  // Loan Administrator has limited access
  if (userRole === USER_ROLES.LOAN_ADMINISTRATOR) {
    switch (currentStage) {
      case 'submitted':
      case 'under_loan_review':
      case 'returned_for_modification':
        actions.push('approve', 'reject', 'edit');
        break;
      case 'under_operations_review':
        actions.push('approve', 'reject', 'edit'); // Loan admin can do everything
        break;
      case 'approved':
        actions.push('approve', 'edit'); // Loan admin can approve at core banking stage
        break;
      case 'disbursed':
        actions.push('edit'); // Loan admin can edit disbursed requests
        break;
    }
    return actions;
  }

  // Role-specific actions based on stage
  switch (currentStage) {
    case 'under_operations_review':
      if (userRole === USER_ROLES.OPERATIONS_TEAM) {
        actions.push('approve', 'reject');
      }
      break;

    case 'approved':
      // Core banking stage - core banking can approve to disburse
      if (userRole === USER_ROLES.CORE_BANKING) {
        actions.push('approve');
      }
      break;

    case 'disbursed':
      // Disbursed requests - only viewing allowed for all roles
      break;

    default:
      // Other roles can only view at other stages
      break;
  }

  return actions;
};