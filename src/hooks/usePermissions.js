import { useMemo } from 'react';
import { 
  hasPermission, 
  canPerformAction, 
  canPerformWorkflowAction,
  getAllowedActionsForStage,
  USER_ROLES 
} from '../utils/rolePermissions';

/**
 * Custom hook for permission management
 * @param {object} user - Current user object
 * @param {object} request - Current request object (optional)
 * @returns {object} Permission utilities
 */
export const usePermissions = (user, request = null) => {
  const userRole = user?.role;
  const currentStage = request?.current_stage || request?.currentStage;
  const requestCreatedBy = request?.created_by || request?.createdBy;
  const currentUserId = user?.id;

  // Memoized permission checks
  const permissions = useMemo(() => {
    if (!userRole) {
      return {
        canView: false,
        canCreate: false,
        canEdit: false,
        canApprove: false,
        canReject: false,
        canDisburse: false,
        canDelete: false,
        allowedActions: [],
        isAdmin: false,
        isLoanAdmin: false,
        isArchiveTeam: false,
        isOperationsTeam: false,
        isCoreBanking: false
      };
    }

    // Role checks
    const isAdmin = userRole === USER_ROLES.ADMIN;
    const isLoanAdmin = userRole === USER_ROLES.LOAN_ADMINISTRATOR;
    const isArchiveTeam = userRole === USER_ROLES.ARCHIVE_TEAM;
    const isOperationsTeam = userRole === USER_ROLES.OPERATIONS_TEAM;
    const isCoreBanking = userRole === USER_ROLES.CORE_BANKING;

    // Basic permission checks
    const canView = hasPermission(userRole, 'view_request');
    const canCreate = hasPermission(userRole, 'create_request');
    const canDelete = hasPermission(userRole, 'delete_request');

    // Context-aware permission checks
    const canEdit = canPerformAction(userRole, 'edit', currentStage, requestCreatedBy, currentUserId);
    const canApprove = currentStage ? canPerformWorkflowAction(userRole, 'approve', currentStage, request) : false;
    const canReject = currentStage ? canPerformWorkflowAction(userRole, 'reject', currentStage, request) : false;
    const canDisburse = currentStage ? canPerformWorkflowAction(userRole, 'disburse', currentStage, request) : false;

    // Get allowed actions for current stage
    const allowedActions = currentStage ? getAllowedActionsForStage(userRole, currentStage) : [];

    return {
      canView,
      canCreate,
      canEdit,
      canApprove,
      canReject,
      canDisburse,
      canDelete,
      allowedActions,
      isAdmin,
      isLoanAdmin,
      isArchiveTeam,
      isOperationsTeam,
      isCoreBanking
    };
  }, [userRole, currentStage, requestCreatedBy, currentUserId, request]);

  // Helper functions
  const checkPermission = (permission) => hasPermission(userRole, permission);
  
  const checkAction = (action, stage = currentStage) => 
    canPerformAction(userRole, action, stage, requestCreatedBy, currentUserId);
  
  const checkWorkflowAction = (action, stage = currentStage) => 
    canPerformWorkflowAction(userRole, action, stage, request);

  // Get actions available for a specific stage
  const getActionsForStage = (stage) => getAllowedActionsForStage(userRole, stage);

  // Check if user can perform any action on the request
  const hasAnyAction = permissions.allowedActions.length > 1; // More than just 'view'

  // Check if user is in a role that can act at current stage
  const canActAtCurrentStage = currentStage ? (
    (permissions.isLoanAdmin && ['submitted', 'under_loan_review', 'returned_for_modification'].includes(currentStage)) ||
    (permissions.isOperationsTeam && currentStage === 'under_operations_review') ||
    (permissions.isCoreBanking && currentStage === 'approved') ||
    permissions.isAdmin
  ) : false;

  return {
    ...permissions,
    checkPermission,
    checkAction,
    checkWorkflowAction,
    getActionsForStage,
    hasAnyAction,
    canActAtCurrentStage,
    userRole,
    currentStage
  };
};

/**
 * Hook for checking if user can access a specific feature
 * @param {string} requiredPermission - Required permission
 * @param {object} user - Current user
 * @returns {boolean} Whether user has access
 */
export const useHasPermission = (requiredPermission, user) => {
  return useMemo(() => {
    return hasPermission(user?.role, requiredPermission);
  }, [user?.role, requiredPermission]);
};

/**
 * Hook for checking if user can perform a specific action
 * @param {string} action - Action to check
 * @param {object} user - Current user
 * @param {object} request - Request context (optional)
 * @returns {boolean} Whether user can perform action
 */
export const useCanPerformAction = (action, user, request = null) => {
  return useMemo(() => {
    const currentStage = request?.current_stage || request?.currentStage;
    const requestCreatedBy = request?.created_by || request?.createdBy;
    const currentUserId = user?.id;
    
    return canPerformAction(user?.role, action, currentStage, requestCreatedBy, currentUserId);
  }, [action, user?.role, user?.id, request]);
};
