// Workflow management system for ADFD withdrawal requests
import { supabase } from '../lib/supabase.js';
import { getRegionForCountry } from './regionalMapping.js';
import { logWorkflowProgress } from '../services/auditService.js';

export const WORKFLOW_STAGES = {
  INITIAL_REVIEW: 'initial_review',
  TECHNICAL_REVIEW: 'technical_review', 
  REGIONAL_APPROVAL: 'regional_approval',
  CORE_BANKING: 'core_banking',
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
  if (decision === 'reject') {
    return currentStage; // Stay in same stage when rejected
  }

  const stageFlow = {
    [WORKFLOW_STAGES.INITIAL_REVIEW]: WORKFLOW_STAGES.TECHNICAL_REVIEW,
    [WORKFLOW_STAGES.TECHNICAL_REVIEW]: WORKFLOW_STAGES.REGIONAL_APPROVAL,
    [WORKFLOW_STAGES.REGIONAL_APPROVAL]: WORKFLOW_STAGES.CORE_BANKING,
    [WORKFLOW_STAGES.CORE_BANKING]: WORKFLOW_STAGES.DISBURSED
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

    // For testing, try to find any admin user
    const { data: adminUsers, error: adminError } = await supabase
      .from('user_profiles')
      .select('id, full_name, email')
      .eq('role', 'admin')
      .limit(1);

    if (adminError) {
      console.error('Error finding admin user:', adminError);
    }

    if (adminUsers && adminUsers.length > 0) {
      console.log('Assigning to admin user:', adminUsers[0]);
      return adminUsers[0].id;
    }

    // Fallback: try to find any user
    const { data: anyUser, error: anyUserError } = await supabase
      .from('user_profiles')
      .select('id, full_name, email')
      .limit(1);

    if (anyUserError) {
      console.error('Error finding any user:', anyUserError);
      return null;
    }

    if (anyUser && anyUser.length > 0) {
      console.log('Assigning to fallback user:', anyUser[0]);
      return anyUser[0].id;
    }

    console.error('No users found in user_profiles table');
    return null;

    /* Production logic (commented out for testing):
    let roleQuery = supabase.from('user_profiles').select('id');

    switch (stage) {
      case WORKFLOW_STAGES.INITIAL_REVIEW:
        roleQuery = roleQuery.eq('role', USER_ROLES.ARCHIVE_TEAM);
        break;
      case WORKFLOW_STAGES.TECHNICAL_REVIEW:
        roleQuery = roleQuery.eq('role', USER_ROLES.LOAN_ADMINISTRATOR);
        break;
      case WORKFLOW_STAGES.REGIONAL_APPROVAL:
        roleQuery = roleQuery
          .eq('role', USER_ROLES.OPERATIONS_TEAM)
          .eq('regional_assignment', region);
        break;
      case WORKFLOW_STAGES.CORE_BANKING:
        roleQuery = roleQuery.eq('role', USER_ROLES.CORE_BANKING);
        break;
      default:
        return null;
    }

    const { data: users, error } = await roleQuery.limit(1);
    if (error || !users || users.length === 0) {
      console.error('Error finding assignee:', error);
      return null;
    }

    return users[0].id;
    */
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
      updateData.status = `Rejected at ${formatStageName(currentStage)} - ${comments}`;
      updateData.rejection_reason = comments;
    } else {
      updateData.status = `${formatStageName(nextStage)} - Pending review`;
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
    case WORKFLOW_STAGES.TECHNICAL_REVIEW:
      return {
        loan_admin_reviewed_by: userId,
        loan_admin_reviewed_at: timestamp,
        loan_admin_comments: comments
      };
    case WORKFLOW_STAGES.REGIONAL_APPROVAL:
      return {
        regional_ops_reviewed_by: userId,
        regional_ops_reviewed_at: timestamp,
        regional_ops_comments: comments
      };
    case WORKFLOW_STAGES.CORE_BANKING:
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
    [WORKFLOW_STAGES.INITIAL_REVIEW]: 'Initial Review',
    [WORKFLOW_STAGES.TECHNICAL_REVIEW]: 'Technical Review',
    [WORKFLOW_STAGES.REGIONAL_APPROVAL]: 'Regional Approval',
    [WORKFLOW_STAGES.CORE_BANKING]: 'Core Banking',
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
    [WORKFLOW_STAGES.INITIAL_REVIEW]: [USER_ROLES.ARCHIVE_TEAM, USER_ROLES.LOAN_ADMINISTRATOR],
    [WORKFLOW_STAGES.TECHNICAL_REVIEW]: [USER_ROLES.LOAN_ADMINISTRATOR],
    [WORKFLOW_STAGES.REGIONAL_APPROVAL]: [USER_ROLES.OPERATIONS_TEAM, USER_ROLES.LOAN_ADMINISTRATOR],
    [WORKFLOW_STAGES.CORE_BANKING]: [USER_ROLES.CORE_BANKING, USER_ROLES.LOAN_ADMINISTRATOR]
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

    // Get initial assignee (loan administrator for technical review)
    console.log('Getting assignee for stage:', WORKFLOW_STAGES.TECHNICAL_REVIEW);
    const initialAssignee = await getAssigneeForStage(WORKFLOW_STAGES.TECHNICAL_REVIEW, region);
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
      current_stage: WORKFLOW_STAGES.TECHNICAL_REVIEW, // Skip initial_review, go directly to loan admin
      status: `New request - ${requestData.beneficiaryName} - Pending technical review`,
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
    return newRequest;
  } catch (error) {
    console.error('Error creating request with workflow:', error);
    throw error;
  }
};
