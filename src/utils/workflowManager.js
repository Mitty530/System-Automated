// Workflow management system for ADFD withdrawal requests
import { supabase } from '../lib/supabase.js';
import { getRegionForCountry } from './regionalMapping.js';
import { logWorkflowProgress, logRequestCreation, logRequestSubmission } from '../services/auditService.js';

export const WORKFLOW_STAGES = {
  SUBMITTED: 'submitted',
  UNDER_LOAN_REVIEW: 'under_loan_review',
  UNDER_OPERATIONS_REVIEW: 'under_operations_review',
  RETURNED_FOR_MODIFICATION: 'returned_for_modification',
  APPROVED: 'approved',
  DISBURSED: 'disbursed'
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
  // Handle rejections - operations team rejections go back to loan admin
  if (decision === 'reject') {
    if (currentStage === WORKFLOW_STAGES.UNDER_OPERATIONS_REVIEW) {
      return WORKFLOW_STAGES.RETURNED_FOR_MODIFICATION;
    }
    return currentStage; // Other rejections stay in same stage
  }

  const stageFlow = {
    [WORKFLOW_STAGES.SUBMITTED]: WORKFLOW_STAGES.UNDER_LOAN_REVIEW,
    [WORKFLOW_STAGES.UNDER_LOAN_REVIEW]: WORKFLOW_STAGES.UNDER_OPERATIONS_REVIEW,
    [WORKFLOW_STAGES.RETURNED_FOR_MODIFICATION]: WORKFLOW_STAGES.UNDER_OPERATIONS_REVIEW,
    [WORKFLOW_STAGES.UNDER_OPERATIONS_REVIEW]: WORKFLOW_STAGES.APPROVED,
    [WORKFLOW_STAGES.APPROVED]: WORKFLOW_STAGES.DISBURSED
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
    console.log(`Getting assignee for stage: ${stage}, region: ${region}`);

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
          .eq('regional_assignment', region);
        break;
      case WORKFLOW_STAGES.APPROVED:
        roleQuery = roleQuery.eq('role', USER_ROLES.CORE_BANKING);
        break;
      default:
        console.warn(`Unknown stage for assignment: ${stage}`);
        return null;
    }

    const { data: users, error } = await roleQuery.limit(1);

    if (error) {
      console.error('Error finding assignee:', error);
    }

    if (users && users.length > 0) {
      console.log('Assigning to user:', users[0]);
      return users[0].id;
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
      console.log('Assigning to admin user:', adminUsers[0]);
      return adminUsers[0].id;
    }

    // Final fallback: any active user
    const { data: anyUser, error: anyUserError } = await supabase
      .from('user_profiles')
      .select('id, full_name, email')
      .eq('is_active', true)
      .limit(1);

    if (!anyUserError && anyUser && anyUser.length > 0) {
      console.log('Assigning to fallback user:', anyUser[0]);
      return anyUser[0].id;
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
    // Get current request data
    const { data: request, error: fetchError } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError || !request) {
      throw new Error('Request not found');
    }

    const currentStage = request.current_stage;
    const nextStage = getNextWorkflowStage(currentStage, decision);
    const region = request.region;

    // Get next assignee
    const nextAssignee = await getAssigneeForStage(nextStage, region);

    // Update request with new stage and assignee
    const updateData = {
      current_stage: nextStage,
      assigned_to: nextAssignee,
      updated_at: new Date().toISOString()
    };

    // Update status based on stage and decision
    if (decision === 'reject') {
      if (currentStage === WORKFLOW_STAGES.UNDER_OPERATIONS_REVIEW) {
        updateData.status = `Returned to Loan Administrator for modifications - ${comments}`;
      } else {
        updateData.status = `Rejected at ${formatStageName(currentStage)} - ${comments}`;
      }
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
          updateData.status = `Approved by Operations Team - Ready for core banking disbursement`;
          break;
        case WORKFLOW_STAGES.DISBURSED:
          updateData.status = `Funds successfully disbursed by Core Banking`;
          break;
        default:
          updateData.status = `${formatStageName(nextStage)} - Pending review`;
      }
    }

    // Add stage-specific fields
    const stageFields = getStageSpecificFields(currentStage, userId, comments);
    Object.assign(updateData, stageFields);

    const { data: updatedRequest, error: updateError } = await supabase
      .from('withdrawal_requests')
      .update(updateData)
      .eq('id', requestId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Log workflow progression
    await logWorkflowProgress(
      requestId,
      currentStage,
      nextStage,
      decision,
      comments
    );

    return updatedRequest;
  } catch (error) {
    console.error('Error progressing workflow:', error);
    throw error;
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
        core_banking_processed_at: timestamp,
        completed_at: timestamp
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
    [WORKFLOW_STAGES.SUBMITTED]: 'Submitted',
    [WORKFLOW_STAGES.UNDER_LOAN_REVIEW]: 'Under Loan Review',
    [WORKFLOW_STAGES.UNDER_OPERATIONS_REVIEW]: 'Under Operations Review',
    [WORKFLOW_STAGES.RETURNED_FOR_MODIFICATION]: 'Returned for Modification',
    [WORKFLOW_STAGES.APPROVED]: 'Approved',
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
    [WORKFLOW_STAGES.APPROVED]: [USER_ROLES.CORE_BANKING, USER_ROLES.LOAN_ADMINISTRATOR, USER_ROLES.ADMIN]
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
    console.log('Creating request with workflow - Input data:', { requestData, userId });

    // Determine region from country
    const region = getRegionForCountry(requestData.country);
    console.log('Region determined:', region);
    if (!region) {
      throw new Error(`Unsupported country: ${requestData.country}`);
    }

    // Get initial assignee (loan administrator for loan review)
    console.log('Getting assignee for stage:', WORKFLOW_STAGES.UNDER_LOAN_REVIEW);
    const initialAssignee = await getAssigneeForStage(WORKFLOW_STAGES.UNDER_LOAN_REVIEW, region);
    console.log('Initial assignee:', initialAssignee);

    // Prepare request data
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
      current_stage: WORKFLOW_STAGES.UNDER_LOAN_REVIEW, // Archive team submits, goes to loan admin
      status: `New request submitted by Archive Team - Under loan administrator review`,
      priority: 'medium',
      assigned_to: initialAssignee,
      created_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      processing_days: 0
    };

    // Create the request
    console.log('Inserting request data:', dbRequestData);
    const { data: newRequest, error: createError } = await supabase
      .from('withdrawal_requests')
      .insert(dbRequestData)
      .select()
      .single();

    if (createError) {
      console.error('Database insert error:', createError);
      throw createError;
    }

    console.log('Request created successfully:', newRequest);

    // Log the request creation and submission
    await logRequestCreation(newRequest);
    await logRequestSubmission(newRequest);

    return newRequest;
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

    if (fetchError || !request) {
      throw new Error('Request not found');
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
      nextAssignee = await getAssigneeForStage(nextStage, region);
    } else if (action === 'reject' && currentStage === WORKFLOW_STAGES.UNDER_OPERATIONS_REVIEW) {
      // Operations team rejection goes back to loan administrator
      nextAssignee = await getAssigneeForStage(WORKFLOW_STAGES.RETURNED_FOR_MODIFICATION, region);
    }

    // Prepare update data
    const updateData = {
      current_stage: nextStage,
      assigned_to: nextAssignee,
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
          updateData.status = `${region} operations team approved - Ready for core banking disbursement`;
          break;
        case WORKFLOW_STAGES.DISBURSED:
          updateData.status = `Core banking completed disbursement - Request fulfilled`;
          updateData.completed_at = new Date().toISOString();
          break;
        default:
          updateData.status = `${formatStageName(nextStage)} - Pending review`;
      }
    }

    // Add stage-specific tracking fields
    const stageFields = getStageSpecificFields(currentStage, userId, comments);
    Object.assign(updateData, stageFields);

    // Update the request
    const { data: updatedRequest, error: updateError } = await supabase
      .from('withdrawal_requests')
      .update(updateData)
      .eq('id', requestId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Log the workflow progression
    await logWorkflowProgress(
      requestId,
      currentStage,
      nextStage,
      action,
      comments
    );

    // TODO: Send notifications to relevant users
    // This would be implemented in Phase 4 when notifications are added
    console.log(`Workflow transition completed: ${currentStage} → ${nextStage}`);
    console.log(`Assigned to: ${nextAssignee}`);

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
