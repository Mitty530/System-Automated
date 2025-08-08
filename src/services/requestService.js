// Service for handling withdrawal request data operations
import { supabase } from '../lib/supabase.js';

/**
 * Fetch all withdrawal requests with user and document information
 * @param {object} filters - Filter options
 * @returns {Promise<array>} - Array of requests
 */
export const fetchRequests = async (filters = {}) => {
  try {
    let query = supabase
      .from('withdrawal_requests')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.stage && filters.stage !== 'all') {
      query = query.eq('current_stage', filters.stage);
    }

    if (filters.country) {
      query = query.eq('country', filters.country);
    }

    if (filters.region) {
      query = query.eq('region', filters.region);
    }

    if (filters.assignedTo) {
      query = query.eq('assigned_to', filters.assignedTo);
    }

    if (filters.createdBy) {
      query = query.eq('created_by', filters.createdBy);
    }

    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }

    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching requests:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchRequests:', error);
    throw error;
  }
};

/**
 * Fetch a single request by ID with full details
 * @param {number} requestId - Request ID
 * @returns {Promise<object>} - Request details
 */
export const fetchRequestById = async (requestId) => {
  try {
    const { data, error } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (error) {
      console.error('Error fetching request:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in fetchRequestById:', error);
    throw error;
  }
};

/**
 * Get dashboard statistics
 * @param {string} userId - User ID for filtering (optional)
 * @returns {Promise<object>} - Dashboard stats
 */
export const getDashboardStats = async (userId = null) => {
  try {
    let query = supabase.from('withdrawal_requests').select('current_stage, amount, currency');

    // If userId provided, filter by assigned or created requests
    if (userId) {
      query = query.or(`assigned_to.eq.${userId},created_by.eq.${userId}`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }

    const stats = {
      totalRequests: data.length,
      pendingReview: data.filter(r => r.current_stage === 'under_loan_review').length,
      operationsReview: data.filter(r => r.current_stage === 'under_operations_review').length,
      returnedForModification: data.filter(r => r.current_stage === 'returned_for_modification').length,
      approved: data.filter(r => r.current_stage === 'approved').length,
      disbursed: data.filter(r => r.current_stage === 'disbursed').length,
      totalAmount: data.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0),
      averageAmount: data.length > 0 ? data.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0) / data.length : 0
    };

    return stats;
  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    throw error;
  }
};

/**
 * Get requests assigned to a specific user
 * @param {string} userId - User ID
 * @returns {Promise<array>} - Array of assigned requests
 */
export const getAssignedRequests = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('assigned_to', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching assigned requests:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAssignedRequests:', error);
    throw error;
  }
};

/**
 * Get requests created by a specific user
 * @param {string} userId - User ID
 * @returns {Promise<array>} - Array of created requests
 */
export const getCreatedRequests = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching created requests:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getCreatedRequests:', error);
    throw error;
  }
};

/**
 * Update request status and stage
 * @param {number} requestId - Request ID
 * @param {object} updates - Updates to apply
 * @returns {Promise<object>} - Updated request
 */
export const updateRequest = async (requestId, updates) => {
  try {
    const { data, error } = await supabase
      .from('withdrawal_requests')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .select()
      .single();

    if (error) {
      console.error('Error updating request:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in updateRequest:', error);
    throw error;
  }
};

/**
 * Get regional distribution of requests
 * @returns {Promise<object>} - Regional statistics
 */
export const getRegionalStats = async () => {
  try {
    const { data, error } = await supabase
      .from('withdrawal_requests')
      .select('region, current_stage, amount');

    if (error) {
      console.error('Error fetching regional stats:', error);
      throw error;
    }

    const regionalStats = {};
    
    data.forEach(request => {
      const region = request.region;
      if (!regionalStats[region]) {
        regionalStats[region] = {
          total: 0,
          pending: 0,
          approved: 0,
          disbursed: 0,
          totalAmount: 0
        };
      }

      regionalStats[region].total++;
      regionalStats[region].totalAmount += parseFloat(request.amount) || 0;

      switch (request.current_stage) {
        case 'under_loan_review':
        case 'under_operations_review':
        case 'returned_for_modification':
          regionalStats[region].pending++;
          break;
        case 'approved':
          regionalStats[region].approved++;
          break;
        case 'disbursed':
          regionalStats[region].disbursed++;
          break;
      }
    });

    return regionalStats;
  } catch (error) {
    console.error('Error in getRegionalStats:', error);
    throw error;
  }
};

/**
 * Search requests by text
 * @param {string} searchTerm - Search term
 * @param {object} filters - Additional filters
 * @returns {Promise<array>} - Matching requests
 */
export const searchRequests = async (searchTerm, filters = {}) => {
  try {
    let query = supabase
      .from('withdrawal_requests')
      .select('*');

    // Apply text search
    if (searchTerm) {
      query = query.or(`
        beneficiary_name.ilike.%${searchTerm}%,
        project_number.ilike.%${searchTerm}%,
        ref_number.ilike.%${searchTerm}%,
        country.ilike.%${searchTerm}%
      `);
    }

    // Apply additional filters
    Object.keys(filters).forEach(key => {
      if (filters[key] && filters[key] !== 'all') {
        query = query.eq(key, filters[key]);
      }
    });

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error searching requests:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in searchRequests:', error);
    throw error;
  }
};

/**
 * Get complete request details with comments, decisions, and documents
 * @param {number} requestId - Request ID
 * @returns {Promise<object>} - Complete request details
 */
export const getRequestDetails = async (requestId) => {
  try {
    // Get the main request data
    const { data: request, error: requestError } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (requestError) {
      console.error('Error fetching request:', requestError);
      throw requestError;
    }

    if (!request) {
      throw new Error('Request not found');
    }

    // Get comments for this request (handle gracefully if table doesn't exist)
    let comments = [];
    try {
      const { data: commentsData, error: commentsError } = await supabase
        .from('request_comments')
        .select(`
          *,
          user_profiles (
            full_name,
            role
          )
        `)
        .eq('request_id', requestId)
        .order('created_at', { ascending: true });

      if (!commentsError) {
        comments = commentsData || [];
      } else {
        console.warn('Could not fetch comments:', commentsError);
      }
    } catch (err) {
      console.warn('Comments table may not exist:', err);
    }

    // Get decisions for this request (handle gracefully if table doesn't exist)
    let decisions = [];
    try {
      const { data: decisionsData, error: decisionsError } = await supabase
        .from('request_decisions')
        .select(`
          *,
          user_profiles (
            full_name,
            role
          )
        `)
        .eq('request_id', requestId)
        .order('created_at', { ascending: true });

      if (!decisionsError) {
        decisions = decisionsData || [];
      } else {
        console.warn('Could not fetch decisions:', decisionsError);
      }
    } catch (err) {
      console.warn('Decisions table may not exist:', err);
    }

    // Get documents for this request (handle gracefully if table doesn't exist)
    let documents = [];
    try {
      const { data: documentsData, error: documentsError } = await supabase
        .from('request_documents')
        .select('*')
        .eq('request_id', requestId)
        .order('uploaded_at', { ascending: false });

      if (!documentsError && documentsData) {
        documents = documentsData || [];
        console.log('Documents fetched successfully:', documents);

        // Fetch user profiles for each document
        for (let doc of documents) {
          if (doc.uploaded_by) {
            try {
              const { data: userProfile } = await supabase
                .from('user_profiles')
                .select('full_name, role')
                .eq('id', doc.uploaded_by)
                .single();

              if (userProfile) {
                doc.user_profiles = userProfile;
              }
            } catch (userError) {
              console.warn('Could not fetch user profile for document:', doc.id, userError);
            }
          }
        }
      } else {
        console.error('Could not fetch documents:', documentsError);
      }
    } catch (err) {
      console.warn('Documents table may not exist:', err);
    }

    // Return complete request details
    const result = {
      ...request,
      comments,
      decisions,
      documents
    };

    console.log('Final request details result:', result);
    return result;

  } catch (error) {
    console.error('Error in getRequestDetails:', error);
    throw error;
  }
};

/**
 * Add a comment to a request
 * @param {number} requestId - Request ID
 * @param {string} userId - User ID who is adding the comment
 * @param {string} commentText - The comment text
 * @param {string} commentType - Type of comment ('general', 'decision', 'system')
 * @returns {Promise<object>} - The created comment
 */
export const addComment = async (requestId, userId, commentText, commentType = 'general') => {
  try {
    const { data, error } = await supabase
      .from('request_comments')
      .insert({
        request_id: requestId,
        user_id: userId,
        comment_text: commentText,
        comment_type: commentType
      })
      .select(`
        *,
        user_profiles!request_comments_user_id_fkey (
          full_name,
          role
        )
      `)
      .single();

    if (error) {
      console.error('Error adding comment:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in addComment:', error);
    throw error;
  }
};

/**
 * Get all comments for a request
 * @param {number} requestId - Request ID
 * @returns {Promise<array>} - Array of comments
 */
export const getRequestComments = async (requestId) => {
  try {
    const { data, error } = await supabase
      .from('request_comments')
      .select(`
        *,
        user_profiles!request_comments_user_id_fkey (
          full_name,
          role
        )
      `)
      .eq('request_id', requestId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getRequestComments:', error);
    throw error;
  }
};

/**
 * Record a workflow decision and update request stage
 * @param {number} requestId - Request ID
 * @param {string} userId - User ID who made the decision
 * @param {string} decisionType - Type of decision ('approve', 'reject', etc.)
 * @param {string} comment - Comment explaining the decision
 * @param {string} fromStage - Current stage
 * @param {string} toStage - New stage after decision
 * @returns {Promise<object>} - Updated request with decision
 */
export const recordDecision = async (requestId, userId, decisionType, comment, fromStage, toStage) => {
  try {
    // Start a transaction-like operation
    // First, record the decision
    const { data: decision, error: decisionError } = await supabase
      .from('request_decisions')
      .insert({
        request_id: requestId,
        user_id: userId,
        decision_type: decisionType,
        comment: comment,
        from_stage: fromStage,
        to_stage: toStage
      })
      .select(`
        *,
        user_profiles!request_decisions_user_id_fkey (
          full_name,
          role
        )
      `)
      .single();

    if (decisionError) {
      console.error('Error recording decision:', decisionError);
      throw decisionError;
    }

    // Update the request stage and status with descriptive messages
    let statusText;
    if (decisionType === 'reject') {
      if (fromStage === 'under_operations_review') {
        statusText = `Operations team rejected - Returned to loan administrator for modifications`;
      } else {
        statusText = `Rejected at ${fromStage.replace('_', ' ')} stage`;
      }
    } else if (decisionType === 'approve') {
      switch (toStage) {
        case 'under_operations_review':
          statusText = `Loan administrator approved - Forwarded to operations team for review`;
          break;
        case 'approved':
          statusText = `Operations team approved - Ready for core banking disbursement`;
          break;
        case 'disbursed':
          statusText = `Core banking completed disbursement - Request fulfilled`;
          break;
        default:
          statusText = `Approved - ${toStage.replace('_', ' ')}`;
      }
    } else {
      statusText = `Updated - ${toStage.replace('_', ' ')}`;
    }

    const updateData = {
      current_stage: toStage,
      status: statusText,
      updated_at: new Date().toISOString()
    };

    // Add completion timestamp for disbursed requests
    if (toStage === 'disbursed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { data: updatedRequest, error: updateError } = await supabase
      .from('withdrawal_requests')
      .update(updateData)
      .eq('id', requestId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating request:', updateError);
      throw updateError;
    }

    // Also add a comment for this decision
    await addComment(requestId, userId, comment, 'decision');

    return {
      request: updatedRequest,
      decision: decision
    };

  } catch (error) {
    console.error('Error in recordDecision:', error);
    throw error;
  }
};

/**
 * Get all decisions for a request
 * @param {number} requestId - Request ID
 * @returns {Promise<array>} - Array of decisions
 */
export const getRequestDecisions = async (requestId) => {
  try {
    const { data, error } = await supabase
      .from('request_decisions')
      .select(`
        *,
        user_profiles!request_decisions_user_id_fkey (
          full_name,
          role
        )
      `)
      .eq('request_id', requestId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching decisions:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getRequestDecisions:', error);
    throw error;
  }
};
