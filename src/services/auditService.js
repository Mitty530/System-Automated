// Audit service for tracking user actions and movements
import { supabase } from '../lib/supabase.js';

/**
 * Log user action to audit trail
 * @param {object} auditData - Audit data
 * @returns {Promise<boolean>} - Success status
 */
export const logUserAction = async (auditData) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.warn('Cannot log audit action: User not authenticated');
      return false;
    }

    // Get additional context
    const sessionId = sessionStorage.getItem('session_id') || generateSessionId();
    const userAgent = navigator.userAgent;
    
    // Store session ID for tracking
    if (!sessionStorage.getItem('session_id')) {
      sessionStorage.setItem('session_id', sessionId);
    }

    const auditEntry = {
      user_id: user.id,
      action_type: auditData.actionType,
      action_description: auditData.description,
      resource_type: auditData.resourceType || null,
      resource_id: auditData.resourceId || null,
      old_values: auditData.oldValues || null,
      new_values: auditData.newValues || null,
      user_agent: userAgent,
      session_id: sessionId,
      created_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('audit_trail')
      .insert(auditEntry);

    if (error) {
      console.error('Error logging audit action:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in logUserAction:', error);
    return false;
  }
};

/**
 * Generate a unique session ID
 * @returns {string} - Session ID
 */
const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

/**
 * Log login action
 * @param {string} email - User email
 */
export const logLogin = async (email) => {
  await logUserAction({
    actionType: 'login',
    description: `User logged in: ${email}`,
    resourceType: 'authentication'
  });
};

/**
 * Log logout action
 */
export const logLogout = async () => {
  await logUserAction({
    actionType: 'logout',
    description: 'User logged out',
    resourceType: 'authentication'
  });
};

/**
 * Log request creation
 * @param {object} requestData - Request data
 */
export const logRequestCreation = async (requestData) => {
  await logUserAction({
    actionType: 'create',
    description: `Created withdrawal request: ${requestData.project_number}`,
    resourceType: 'withdrawal_request',
    resourceId: requestData.id?.toString(),
    newValues: {
      project_number: requestData.project_number,
      beneficiary_name: requestData.beneficiary_name,
      amount: requestData.amount,
      currency: requestData.currency,
      country: requestData.country
    }
  });
};

/**
 * Log request update
 * @param {string} requestId - Request ID
 * @param {object} oldData - Old request data
 * @param {object} newData - New request data
 */
export const logRequestUpdate = async (requestId, oldData, newData) => {
  await logUserAction({
    actionType: 'update',
    description: `Updated withdrawal request: ${newData.project_number || requestId}`,
    resourceType: 'withdrawal_request',
    resourceId: requestId.toString(),
    oldValues: oldData,
    newValues: newData
  });
};

/**
 * Log workflow progression
 * @param {string} requestId - Request ID
 * @param {string} fromStage - Previous stage
 * @param {string} toStage - New stage
 * @param {string} decision - Decision made (approve/reject)
 * @param {string} comments - Comments
 */
export const logWorkflowProgress = async (requestId, fromStage, toStage, decision, comments) => {
  await logUserAction({
    actionType: 'workflow_progress',
    description: `${decision === 'approve' ? 'Approved' : 'Rejected'} request at ${fromStage} stage`,
    resourceType: 'withdrawal_request',
    resourceId: requestId.toString(),
    oldValues: { stage: fromStage },
    newValues: { 
      stage: toStage, 
      decision: decision,
      comments: comments 
    }
  });
};

/**
 * Log file upload
 * @param {string} requestId - Request ID
 * @param {string} fileName - File name
 * @param {number} fileSize - File size
 */
export const logFileUpload = async (requestId, fileName, fileSize) => {
  await logUserAction({
    actionType: 'upload',
    description: `Uploaded file: ${fileName}`,
    resourceType: 'request_document',
    resourceId: requestId?.toString(),
    newValues: {
      file_name: fileName,
      file_size: fileSize
    }
  });
};

/**
 * Log file download
 * @param {string} requestId - Request ID
 * @param {string} fileName - File name
 */
export const logFileDownload = async (requestId, fileName) => {
  await logUserAction({
    actionType: 'download',
    description: `Downloaded file: ${fileName}`,
    resourceType: 'request_document',
    resourceId: requestId?.toString(),
    newValues: {
      file_name: fileName
    }
  });
};

/**
 * Log page view
 * @param {string} pageName - Page name
 * @param {object} additionalData - Additional data
 */
export const logPageView = async (pageName, additionalData = {}) => {
  await logUserAction({
    actionType: 'view',
    description: `Viewed page: ${pageName}`,
    resourceType: 'page',
    resourceId: pageName,
    newValues: additionalData
  });
};

/**
 * Log search action
 * @param {string} searchTerm - Search term
 * @param {object} filters - Applied filters
 * @param {number} resultCount - Number of results
 */
export const logSearch = async (searchTerm, filters = {}, resultCount = 0) => {
  await logUserAction({
    actionType: 'search',
    description: `Searched for: "${searchTerm}"`,
    resourceType: 'search',
    newValues: {
      search_term: searchTerm,
      filters: filters,
      result_count: resultCount
    }
  });
};

/**
 * Log filter application
 * @param {object} filters - Applied filters
 * @param {number} resultCount - Number of results after filtering
 */
export const logFilter = async (filters, resultCount = 0) => {
  await logUserAction({
    actionType: 'filter',
    description: `Applied filters: ${Object.keys(filters).join(', ')}`,
    resourceType: 'filter',
    newValues: {
      filters: filters,
      result_count: resultCount
    }
  });
};

/**
 * Log user assignment
 * @param {string} requestId - Request ID
 * @param {string} fromUserId - Previous assignee
 * @param {string} toUserId - New assignee
 */
export const logUserAssignment = async (requestId, fromUserId, toUserId) => {
  await logUserAction({
    actionType: 'assign',
    description: `Reassigned request to different user`,
    resourceType: 'withdrawal_request',
    resourceId: requestId.toString(),
    oldValues: { assigned_to: fromUserId },
    newValues: { assigned_to: toUserId }
  });
};

/**
 * Get audit trail for a specific resource
 * @param {string} resourceType - Resource type
 * @param {string} resourceId - Resource ID
 * @returns {Promise<array>} - Audit trail entries
 */
export const getAuditTrail = async (resourceType, resourceId) => {
  try {
    const { data, error } = await supabase
      .from('audit_trail')
      .select(`
        *,
        user_profile:user_profiles!user_id(full_name, email)
      `)
      .eq('resource_type', resourceType)
      .eq('resource_id', resourceId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching audit trail:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAuditTrail:', error);
    return [];
  }
};
