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
export const canPerformAction = (userRole, action) => {
  if (!userRole || !action) return false;

  // Admin and Loan Administrator can do everything
  if (userRole === USER_ROLES.ADMIN || userRole === USER_ROLES.LOAN_ADMINISTRATOR) {
    return true;
  }

  // Role-specific action permissions
  switch (action) {
    case 'create':
      return userRole === USER_ROLES.ARCHIVE_TEAM;

    case 'approve':
    case 'reject':
      return userRole === USER_ROLES.OPERATIONS_TEAM;

    case 'disburse':
      return userRole === USER_ROLES.CORE_BANKING;

    case 'view':
      return true; // All users can view

    case 'edit':
      // Only archive team can edit their own requests, admins can edit any
      return userRole === USER_ROLES.ARCHIVE_TEAM;

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
    return ['create', 'approve', 'reject', 'disburse', 'edit', 'delete', 'view'];
  }

  // Role-specific available actions
  switch (userRole) {
    case USER_ROLES.ARCHIVE_TEAM:
      actions.push('create', 'edit', 'view');
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