// Workflow management system for ADFD withdrawal requests
import { supabase } from '../lib/supabase.js';
import { getRegionForCountry } from './regionalMapping.js';
import { logWorkflowProgress, logRequestCreation } from '../services/auditService.js';
import { sendWorkflowNotification, NOTIFICATION_TYPES } from '../services/notificationService.js';

// 5-stage workflow: Archive Team → Loan Admin → Operations Teams → Core Banking → Disbursed
export const WORKFLOW_STAGES = {
  SUBMITTED: 'submitted',                    // Archive Team creates request
  UNDER_LOAN_REVIEW: 'under_loan_review',   // Loan Administrator reviews
  UNDER_OPERATIONS_REVIEW: 'under_operations_review', // Operations Teams review
  RETURNED_FOR_MODIFICATION: 'returned_for_modification', // Operations rejected, back to loan admin
  APPROVED: 'approved',                      // Core Banking approves
  DISBURSED: 'disbursed'                    // Automatically disbursed after core banking approval
};

export const USER_ROLES = {
  ADMIN: 'admin',
  ARCHIVE_TEAM: 'archive_team',
  LOAN_ADMINISTRATOR: 'loan_administrator',
  OPERATIONS_TEAM: 'operations_team',
  CORE_BANKING: 'core_banking'
};

/**
 * Get the next workflow stage based on current stage and decision
 * @param {string} currentStage - Current workflow stage
 * @param {string} decision - Decision made (approve/reject)
 * @returns {string} - Next workflow stage
 */
export const getNextWorkflowStage = (currentStage, decision) => {
  // Handle rejections - specific logic for operations team rejection
  if (decision === 'reject') {
    if (currentStage === WORKFLOW_STAGES.UNDER_OPERATIONS_REVIEW) {
      return WORKFLOW_STAGES.RETURNED_FOR_MODIFICATION; // Operations reject → back to loan admin
    }
    return currentStage; // Other rejections stay in current stage
  }

  // 5-stage workflow progression for approvals
  const stageFlow = {
    [WORKFLOW_STAGES.SUBMITTED]: WORKFLOW_STAGES.UNDER_LOAN_REVIEW,           // Archive → Loan Admin
    [WORKFLOW_STAGES.UNDER_LOAN_REVIEW]: WORKFLOW_STAGES.UNDER_OPERATIONS_REVIEW, // Loan Admin → Operations
    [WORKFLOW_STAGES.RETURNED_FOR_MODIFICATION]: WORKFLOW_STAGES.UNDER_OPERATIONS_REVIEW, // Fixed → Operations
    [WORKFLOW_STAGES.UNDER_OPERATIONS_REVIEW]: WORKFLOW_STAGES.APPROVED,     // Operations → Core Banking
    [WORKFLOW_STAGES.APPROVED]: WORKFLOW_STAGES.DISBURSED                    // Core Banking → Disbursed (auto)
  };

  return stageFlow[currentStage] || currentStage;
};

/**
 * Get the appropriate user to assign request to based on stage and region
 * @param {string} stage - Workflow stage
 * @param {string} region - Regional assignment
 * @returns {Promise<string>} - User ID to assign to
 */
export const getAssigneeForStage = async (stage, region = null) => {
  try {
    console.log(`Finding assignee for stage: ${stage}, region: ${region}`);

    // Production logic: Find appropriate user based on role and region
    let roleQuery = supabase
      .from('user_profiles')
      .select('id, full_name, email, role, regional_assignment')
      .eq('is_active', true);

    switch (stage) {
      case WORKFLOW_STAGES.SUBMITTED:
        roleQuery = roleQuery.eq('role', USER_ROLES.ARCHIVE_TEAM);
        break;
      case WORKFLOW_STAGES.UNDER_LOAN_REVIEW:
      case WORKFLOW_STAGES.RETURNED_FOR_MODIFICATION:
        roleQuery = roleQuery.eq('role', USER_ROLES.LOAN_ADMINISTRATOR);
        break;
      case WORKFLOW_STAGES.UNDER_OPERATIONS_REVIEW:
        roleQuery = roleQuery
          .eq('role', USER_ROLES.OPERATIONS_TEAM)
          .eq('region', region);
        break;
      case WORKFLOW_STAGES.APPROVED:
        roleQuery = roleQuery.eq('role', USER_ROLES.CORE_BANKING);
        break;
      case WORKFLOW_STAGES.DISBURSED:
        // No assignment needed for disbursed stage
        return null;
      default:
        console.warn(`Unknown stage for assignment: ${stage}`);
        return null;
    }

    const { data: users, error } = await roleQuery.limit(1);

    if (error) {
      console.error('Error finding assignee:', error);
      throw new Error(`Database error finding assignee: ${error.message}`);
    }

    if (users && users.length > 0) {
      console.log(`Found assignee: ${users[0].full_name} (${users[0].email})`);
      return users[0].id;
    }

    // For disbursed stage, never assign anyone
    if (stage === WORKFLOW_STAGES.DISBURSED) {
      console.log('Disbursed stage - no assignee needed');
      return null;
    }

    // Fallback for development: try to find admin user
    console.warn(`No users found for stage ${stage} and region ${region}, falling back to admin`);
    const { data: adminUsers, error: adminError } = await supabase
      .from('user_profiles')
      .select('id, full_name, email')
      .eq('role', 'admin')
      .eq('is_active', true)
      .limit(1);

    if (!adminError && adminUsers && adminUsers.length > 0) {
      return adminUsers[0].id;
    }

    // Final fallback: any active user (but not for disbursed stage)
    if (stage !== WORKFLOW_STAGES.DISBURSED) {
      const { data: anyUser, error: anyUserError } = await supabase
        .from('user_profiles')
        .select('id, full_name, email')
        .eq('is_active', true)
        .limit(1);

      if (!anyUserError && anyUser && anyUser.length > 0) {
        return anyUser[0].id;
      }
    }

    console.error('No active users found in user_profiles table');
    return null;


  } catch (error) {
    console.error('Error in getAssigneeForStage:', error);
    return null;
  }
};

/**
 * Progress a request to the next workflow stage
 * @param {number} requestId - Request ID
 * @param {string} decision - Decision made (approve/reject)
 * @param {string} comments - Comments for the decision
 * @param {string} userId - User making the decision
 * @returns {Promise<object>} - Updated request data
 */
export const progressWorkflow = async (requestId, decision, comments, userId) => {
  try {
    // Validate input parameters
    if (!requestId) {
      throw new Error('Request ID is required');
    }
    if (!decision) {
      throw new Error('Decision is required');
    }
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Get current request data
    const { data: request, error: fetchError } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError) {
      console.error('Error fetching request:', fetchError);
      throw new Error(`Failed to fetch request: ${fetchError.message}`);
    }

    if (!request) {
      throw new Error('Request not found');
    }

    // Validate required request properties
    if (!request.current_stage) {
      throw new Error('Request is missing current stage information');
    }

    const currentStage = request.current_stage;
    const nextStage = getNextWorkflowStage(currentStage, decision);
    const region = request.region;

    // Get next assignee (except for disbursed stage which has no assignee)
    let nextAssignee = null;
    if (nextStage !== WORKFLOW_STAGES.DISBURSED) {
      nextAssignee = await getAssigneeForStage(nextStage, region);

      if (!nextAssignee && nextStage !== WORKFLOW_STAGES.DISBURSED) {
        throw new Error(`No assignee found for stage ${nextStage} in region ${region}`);
      }
    } else {
      // Explicitly set to null for disbursed stage
      nextAssignee = null;
    }

    // Update request with new stage and assignee
    const updateData = {
      current_stage: nextStage,
      assigned_to: nextAssignee,
      decision_type: decision,
      comment: comments,
      updated_at: new Date().toISOString()
    };

    // Update status based on stage and decision
    if (decision === 'reject') {
      updateData.status = `Rejected at ${formatStageName(currentStage)} - ${comments}`;
      updateData.rejection_reason = comments;
    } else {
      // Create descriptive status messages for approvals
      switch (nextStage) {
        case WORKFLOW_STAGES.UNDER_LOAN_REVIEW:
          updateData.status = `Submitted by Archive Team - Awaiting loan administrator review`;
          break;
        case WORKFLOW_STAGES.UNDER_OPERATIONS_REVIEW:
          updateData.status = `Approved by Loan Administrator - Awaiting regional operations team review`;
          break;
        case WORKFLOW_STAGES.APPROVED:
          updateData.status = `Approved by Operations Team - Awaiting core banking approval`;
          break;
        case WORKFLOW_STAGES.DISBURSED:
          updateData.status = `Approved by Core Banking - Funds disbursed successfully`;
          updateData.completed_at = new Date().toISOString();
          break;
        default:
          updateData.status = `${formatStageName(nextStage)} - Pending review`;
      }
    }

    // Add stage-specific fields
    const stageFields = getStageSpecificFields(currentStage, userId, comments);
    Object.assign(updateData, stageFields);

    // Use the secure function to update the request
    const { data: updatedRequestData, error: updateError } = await supabase
      .rpc('update_withdrawal_request_secure', {
        request_id: requestId,
        user_id: userId,
        update_data: updateData
      });

    if (updateError) {
      console.error('Error updating request:', updateError);
      throw new Error(`Failed to update request: ${updateError.message}`);
    }

    if (!updatedRequestData) {
      throw new Error('No data returned from update operation');
    }

    const updatedRequest = updatedRequestData;

    if (!updatedRequest) {
      throw new Error('No data returned after update');
    }

    // Log workflow progression
    await logWorkflowProgress(
      requestId,
      currentStage,
      nextStage,
      decision,
      comments
    );

    return {
      success: true,
      request: updatedRequest,
      previousStage: currentStage,
      newStage: nextStage
    };
  } catch (error) {
    console.error('Error progressing workflow:', error);
    return {
      success: false,
      error: error.message,
      request: null
    };
  }
};

/**
 * Get stage-specific fields for database update
 * @param {string} stage - Current stage
 * @param {string} userId - User ID
 * @param {string} comments - Comments
 * @returns {object} - Stage-specific fields
 */
const getStageSpecificFields = (stage, userId, comments) => {
  const timestamp = new Date().toISOString();
  
  switch (stage) {
    case WORKFLOW_STAGES.UNDER_LOAN_REVIEW:
    case WORKFLOW_STAGES.RETURNED_FOR_MODIFICATION:
      return {
        loan_admin_reviewed_by: userId,
        loan_admin_reviewed_at: timestamp,
        loan_admin_comments: comments
      };
    case WORKFLOW_STAGES.UNDER_OPERATIONS_REVIEW:
      return {
        regional_ops_reviewed_by: userId,
        regional_ops_reviewed_at: timestamp,
        regional_ops_comments: comments
      };
    case WORKFLOW_STAGES.APPROVED:
      return {
        core_banking_processed_by: userId,
        core_banking_processed_at: timestamp
      };
    default:
      return {};
  }
};

/**
 * Format stage name for display
 * @param {string} stage - Stage code
 * @returns {string} - Formatted stage name
 */
const formatStageName = (stage) => {
  const stageNames = {
    [WORKFLOW_STAGES.SUBMITTED]: 'Archive Team',
    [WORKFLOW_STAGES.UNDER_LOAN_REVIEW]: 'Loan Administrator',
    [WORKFLOW_STAGES.UNDER_OPERATIONS_REVIEW]: 'Operations Team',
    [WORKFLOW_STAGES.APPROVED]: 'Core Banking',
    [WORKFLOW_STAGES.DISBURSED]: 'Disbursed'
  };
  return stageNames[stage] || stage;
};

/**
 * Check if user can perform action on request
 * @param {string} userRole - User's role
 * @param {string} action - Action to perform
 * @param {string} requestStage - Current request stage
 * @returns {boolean} - True if user can perform action
 */
export const canUserPerformAction = (userRole, action, requestStage) => {
  // Admin can do everything
  if (userRole === USER_ROLES.ADMIN) {
    return true;
  }

  // Define role permissions by stage
  const stagePermissions = {
    [WORKFLOW_STAGES.SUBMITTED]: [USER_ROLES.ARCHIVE_TEAM, USER_ROLES.LOAN_ADMINISTRATOR, USER_ROLES.ADMIN],
    [WORKFLOW_STAGES.UNDER_LOAN_REVIEW]: [USER_ROLES.LOAN_ADMINISTRATOR, USER_ROLES.ADMIN],
    [WORKFLOW_STAGES.UNDER_OPERATIONS_REVIEW]: [USER_ROLES.OPERATIONS_TEAM, USER_ROLES.LOAN_ADMINISTRATOR, USER_ROLES.ADMIN],
    [WORKFLOW_STAGES.RETURNED_FOR_MODIFICATION]: [USER_ROLES.LOAN_ADMINISTRATOR, USER_ROLES.ADMIN],
    [WORKFLOW_STAGES.APPROVED]: [USER_ROLES.CORE_BANKING, USER_ROLES.LOAN_ADMINISTRATOR, USER_ROLES.ADMIN],
    [WORKFLOW_STAGES.DISBURSED]: [USER_ROLES.LOAN_ADMINISTRATOR, USER_ROLES.ADMIN] // Only view access
  };

  const allowedRoles = stagePermissions[requestStage] || [];
  return allowedRoles.includes(userRole);
};

/**
 * Create initial request with proper workflow setup
 * @param {object} requestData - Request data from form
 * @param {string} userId - Creating user ID
 * @returns {Promise<object>} - Created request
 */
export const createRequestWithWorkflow = async (requestData, userId) => {
  try {
    // Determine region from country
    const region = getRegionForCountry(requestData.country);
    if (!region) {
      throw new Error(`Unsupported country: ${requestData.country}`);
    }

    // Get initial assignee (loan administrator for when it moves to loan review)
    const initialAssignee = await getAssigneeForStage(WORKFLOW_STAGES.UNDER_LOAN_REVIEW, region);

    // Prepare request data - Start at SUBMITTED stage
    const dbRequestData = {
      project_number: requestData.projectNumber,
      ref_number: requestData.referenceNumber,
      country: requestData.country,
      region: region,
      beneficiary_name: requestData.beneficiaryName,
      amount: parseFloat(requestData.amount),
      currency: requestData.currency,
      value_date: requestData.date,
      project_details: requestData.projectDetails,
      reference_documentation: requestData.referenceDocumentation,
      current_stage: WORKFLOW_STAGES.SUBMITTED, // Start at SUBMITTED stage
      status: `New request created - Ready for submission to loan administrator`,
      priority: 'medium',
      assigned_to: initialAssignee, // Pre-assign to loan admin for next stage
      created_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      processing_days: 0
    };

    // Create the request
    const { data: newRequest, error: createError } = await supabase
      .from('withdrawal_requests')
      .insert(dbRequestData)
      .select()
      .single();

    if (createError) {
      console.error('Database insert error:', createError);
      throw createError;
    }

    // Log the request creation (don't fail if logging fails)
    try {
      await logRequestCreation(newRequest);
    } catch (auditError) {
      console.warn('Failed to log request creation:', auditError);
    }

    // Automatically progress to UNDER_LOAN_REVIEW stage
    const progressResult = await progressWorkflow(
      newRequest.id,
      'approve',
      'Request automatically submitted to loan administrator for review',
      userId
    );

    // Return the updated request with the correct stage
    if (progressResult && progressResult.success && progressResult.request) {
      return progressResult.request;
    } else {
      // If progression failed, return the original request
      console.warn('Workflow progression failed, returning original request');
      return newRequest;
    }
  } catch (error) {
    console.error('Error creating request with workflow:', error);
    throw error;
  }
};

/**
 * Handle specific workflow transitions with notifications and assignments
 * @param {number} requestId - Request ID
 * @param {string} action - Action being performed (approve/reject)
 * @param {string} comments - Comments for the action
 * @param {string} userId - User performing the action
 * @param {object} userRole - Role of the user performing the action
 * @returns {Promise<object>} - Result of the workflow transition
 */
export const handleWorkflowTransition = async (requestId, action, comments, userId, userRole) => {
  try {
    // Get current request data
    const { data: request, error: fetchError } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch request: ${fetchError.message}`);
    }

    if (!request) {
      throw new Error('Request not found');
    }

    // Validate required request properties
    if (!request.current_stage) {
      throw new Error('Request is missing current stage information');
    }

    const currentStage = request.current_stage;
    const nextStage = getNextWorkflowStage(currentStage, action);
    const region = request.region;

    // Validate user can perform this action
    if (!canUserPerformAction(userRole, action, currentStage)) {
      throw new Error('User not authorized to perform this action at current stage');
    }

    // Get next assignee based on workflow logic
    let nextAssignee = null;
    if (action === 'approve') {
      // Don't assign anyone for disbursed stage (final stage)
      if (nextStage !== WORKFLOW_STAGES.DISBURSED) {
        nextAssignee = await getAssigneeForStage(nextStage, region);
        if (!nextAssignee && nextStage !== WORKFLOW_STAGES.DISBURSED) {
          throw new Error(`No assignee found for stage ${nextStage} in region ${region}`);
        }
      } else {
        // Explicitly set to null for disbursed stage
        nextAssignee = null;
      }
    }
    // For rejections, request stays with current assignee

    // Prepare update data
    const updateData = {
      current_stage: nextStage,
      assigned_to: nextAssignee,
      decision_type: action,
      comment: comments,
      updated_at: new Date().toISOString()
    };

    // Create detailed status messages
    if (action === 'reject') {
      if (currentStage === WORKFLOW_STAGES.UNDER_OPERATIONS_REVIEW) {
        updateData.status = `Operations team rejected - Returned to loan administrator for modifications: ${comments}`;
      } else {
        updateData.status = `Rejected at ${formatStageName(currentStage)}: ${comments}`;
      }
      updateData.rejection_reason = comments;
    } else {
      switch (nextStage) {
        case WORKFLOW_STAGES.UNDER_OPERATIONS_REVIEW:
          updateData.status = `Loan administrator approved - Forwarded to ${region} operations team for review`;
          break;
        case WORKFLOW_STAGES.APPROVED:
          updateData.status = `${region} operations team approved - Forwarded to core banking for final approval`;
          break;
        case WORKFLOW_STAGES.DISBURSED:
          updateData.status = `Core banking approved - Funds disbursed successfully`;
          updateData.completed_at = new Date().toISOString();
          break;
        default:
          updateData.status = `${formatStageName(nextStage)} - Pending review`;
      }
    }

    // Add stage-specific tracking fields
    const stageFields = getStageSpecificFields(currentStage, userId, comments);
    Object.assign(updateData, stageFields);

    // Update the request using the secure function
    const { data: updatedRequestData, error: updateError } = await supabase
      .rpc('update_withdrawal_request_secure', {
        request_id: requestId,
        user_id: userId,
        update_data: updateData
      });

    if (updateError) {
      throw new Error(`Failed to process workflow transition: ${updateError.message}`);
    }

    if (!updatedRequestData) {
      throw new Error('No data returned from workflow transition');
    }

    const updatedRequest = updatedRequestData;

    // Log the workflow progression
    await logWorkflowProgress(
      requestId,
      currentStage,
      nextStage,
      action,
      comments
    );

    // Send notifications to relevant users
    try {
      await sendWorkflowNotifications({
        requestId,
        requestData: updatedRequest,
        previousStage: currentStage,
        newStage: nextStage,
        action,
        comments,
        actionBy: userId,
        assignedTo: nextAssignee
      });
    } catch (notificationError) {
      console.error('Error sending workflow notifications:', notificationError);
      // Don't fail the workflow transition if notification fails
    }

    return {
      success: true,
      request: updatedRequest,
      previousStage: currentStage,
      newStage: nextStage,
      assignedTo: nextAssignee
    };

  } catch (error) {
    console.error('Error in workflow transition:', error);
    throw error;
  }
};

/**
 * Send workflow notifications to relevant users
 * @param {object} notificationData - Notification data
 * @returns {Promise<void>}
 */
const sendWorkflowNotifications = async (notificationData) => {
  try {
    const {
      requestId,
      requestData,
      previousStage,
      newStage,
      action,
      comments,
      actionBy,
      assignedTo
    } = notificationData;

    // Determine notification type based on action and stage
    let notificationType;
    let recipientUserId;

    if (action === 'approve') {
      switch (newStage) {
        case WORKFLOW_STAGES.UNDER_LOAN_REVIEW:
          notificationType = NOTIFICATION_TYPES.REQUEST_SUBMITTED;
          recipientUserId = assignedTo; // Loan administrator
          break;
        case WORKFLOW_STAGES.UNDER_OPERATIONS_REVIEW:
          notificationType = NOTIFICATION_TYPES.REQUEST_APPROVED;
          recipientUserId = assignedTo; // Regional operations team
          break;
        case WORKFLOW_STAGES.APPROVED:
          notificationType = NOTIFICATION_TYPES.REQUEST_APPROVED;
          recipientUserId = assignedTo; // Core banking team
          break;
        case WORKFLOW_STAGES.DISBURSED:
          notificationType = NOTIFICATION_TYPES.REQUEST_DISBURSED;
          recipientUserId = requestData.created_by; // Original requester
          break;
      }
    } else if (action === 'reject') {
      notificationType = NOTIFICATION_TYPES.REQUEST_REJECTED;
      // Rejections go back to the original requester
      recipientUserId = requestData.created_by;
    }

    // Send notification if we have a recipient
    if (recipientUserId && notificationType) {
      await sendWorkflowNotification({
        requestId,
        recipientUserId,
        notificationType,
        requestData,
        previousStage,
        newStage,
        comments,
        actionBy
      });
    }

    // Also notify the requester for major status changes
    if (requestData.created_by !== recipientUserId &&
        [NOTIFICATION_TYPES.REQUEST_APPROVED, NOTIFICATION_TYPES.REQUEST_REJECTED, NOTIFICATION_TYPES.REQUEST_DISBURSED].includes(notificationType)) {

      await sendWorkflowNotification({
        requestId,
        recipientUserId: requestData.created_by,
        notificationType,
        requestData,
        previousStage,
        newStage,
        comments,
        actionBy
      });
    }

  } catch (error) {
    console.error('Error sending workflow notifications:', error);
    // Don't throw error to avoid breaking the workflow
  }
};
