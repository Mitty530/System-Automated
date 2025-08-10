// Notification service for ADFD system using Supabase built-in email
import { supabase } from '../lib/supabase.js';

/**
 * Notification types for different workflow events
 */
export const NOTIFICATION_TYPES = {
  REQUEST_SUBMITTED: 'request_submitted',
  REQUEST_APPROVED: 'request_approved',
  REQUEST_REJECTED: 'request_rejected',
  REQUEST_RETURNED: 'request_returned',
  REQUEST_DISBURSED: 'request_disbursed',
  SYSTEM_ALERT: 'system_alert',
  WEEKLY_REPORT: 'weekly_report'
};

/**
 * Get user notification preferences
 * @param {string} userId - User ID
 * @returns {Promise<object>} - User notification preferences
 */
export const getUserNotificationPreferences = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching notification preferences:', error);
      throw error;
    }

    // Return default preferences if none exist
    if (!data) {
      return {
        request_updates: true,
        system_alerts: true,
        weekly_reports: false,
        email_enabled: true
      };
    }

    return data;
  } catch (error) {
    console.error('Error in getUserNotificationPreferences:', error);
    // Return safe defaults on error
    return {
      request_updates: true,
      system_alerts: true,
      weekly_reports: false,
      email_enabled: true
    };
  }
};

/**
 * Update user notification preferences
 * @param {string} userId - User ID
 * @param {object} preferences - Notification preferences to update
 * @returns {Promise<object>} - Updated preferences
 */
export const updateNotificationPreferences = async (userId, preferences) => {
  try {
    // First try to update existing preferences
    const { data: existingData, error: selectError } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      console.error('Error checking existing preferences:', selectError);
      throw selectError;
    }

    let data, error;

    if (existingData) {
      // Update existing preferences
      ({ data, error } = await supabase
        .from('notification_preferences')
        .update({
          ...preferences,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single());
    } else {
      // Insert new preferences
      ({ data, error } = await supabase
        .from('notification_preferences')
        .insert({
          user_id: userId,
          ...preferences,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single());
    }

    if (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in updateNotificationPreferences:', error);
    throw error;
  }
};

/**
 * Check if user should receive notification based on preferences
 * @param {string} userId - User ID
 * @param {string} notificationType - Type of notification
 * @returns {Promise<boolean>} - Whether to send notification
 */
export const shouldSendNotification = async (userId, notificationType) => {
  try {
    const preferences = await getUserNotificationPreferences(userId);
    
    if (!preferences.email_enabled) {
      return false;
    }

    switch (notificationType) {
      case NOTIFICATION_TYPES.REQUEST_SUBMITTED:
      case NOTIFICATION_TYPES.REQUEST_APPROVED:
      case NOTIFICATION_TYPES.REQUEST_REJECTED:
      case NOTIFICATION_TYPES.REQUEST_RETURNED:
      case NOTIFICATION_TYPES.REQUEST_DISBURSED:
        return preferences.request_updates;
      
      case NOTIFICATION_TYPES.SYSTEM_ALERT:
        return preferences.system_alerts;
      
      case NOTIFICATION_TYPES.WEEKLY_REPORT:
        return preferences.weekly_reports;
      
      default:
        return false;
    }
  } catch (error) {
    console.error('Error checking notification preferences:', error);
    // Default to sending important notifications on error
    return [
      NOTIFICATION_TYPES.REQUEST_SUBMITTED,
      NOTIFICATION_TYPES.REQUEST_APPROVED,
      NOTIFICATION_TYPES.SYSTEM_ALERT
    ].includes(notificationType);
  }
};

/**
 * Send email notification using Supabase Edge Function
 * @param {object} notificationData - Notification data
 * @returns {Promise<boolean>} - Success status
 */
export const sendEmailNotification = async (notificationData) => {
  try {
    const {
      userId,
      requestId,
      notificationType,
      recipientEmail,
      subject,
      htmlContent,
      textContent,
      metadata = {}
    } = notificationData;

    // Check if user should receive this notification
    const shouldSend = await shouldSendNotification(userId, notificationType);
    if (!shouldSend) {
      return false;
    }

    // Log notification attempt
    const { data: logEntry, error: logError } = await supabase
      .from('notification_logs')
      .insert({
        user_id: userId,
        request_id: requestId,
        notification_type: notificationType,
        email_subject: subject,
        email_body: htmlContent || textContent,
        recipient_email: recipientEmail,
        status: 'pending',
        metadata
      })
      .select()
      .single();

    if (logError) {
      console.error('Error logging notification:', logError);
    }

    // Call Supabase Edge Function to send email
    const { error } = await supabase.functions.invoke('send-notification-email', {
      body: {
        to: recipientEmail,
        subject,
        html: htmlContent,
        text: textContent,
        notificationType,
        requestId,
        metadata
      }
    });

    if (error) {
      console.error('Error sending email notification:', error);
      
      // Update log with error
      if (logEntry) {
        await supabase
          .from('notification_logs')
          .update({
            status: 'failed',
            error_message: error.message || 'Unknown error'
          })
          .eq('id', logEntry.id);
      }
      
      throw error;
    }

    // Update log with success
    if (logEntry) {
      await supabase
        .from('notification_logs')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('id', logEntry.id);
    }

    return true;

  } catch (error) {
    console.error('Error in sendEmailNotification:', error);
    return false;
  }
};

/**
 * Get user email from user profile
 * @param {string} userId - User ID
 * @returns {Promise<string>} - User email
 */
export const getUserEmail = async (userId) => {
  try {
    // First try to get from user_profiles table
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('email')
      .eq('id', userId)
      .single();

    if (!profileError && profile?.email) {
      return profile.email;
    }

    // Fallback to auth.users table
    const { data: { user }, error: authError } = await supabase.auth.admin.getUserById(userId);
    
    if (authError || !user?.email) {
      throw new Error('User email not found');
    }

    return user.email;
  } catch (error) {
    console.error('Error getting user email:', error);
    throw error;
  }
};

/**
 * Send workflow notification (both email and in-app)
 * @param {object} workflowData - Workflow notification data
 * @returns {Promise<boolean>} - Success status
 */
export const sendWorkflowNotification = async (workflowData) => {
  try {
    const {
      requestId,
      recipientUserId,
      notificationType,
      requestData,
      previousStage,
      newStage,
      comments,
      actionBy
    } = workflowData;

    // Get recipient email
    const recipientEmail = await getUserEmail(recipientUserId);

    // Generate email content based on notification type
    const emailContent = generateWorkflowEmailContent({
      notificationType,
      requestData,
      previousStage,
      newStage,
      comments,
      actionBy,
      recipientEmail
    });

    // Generate in-app notification content
    const inAppContent = generateInAppNotificationContent({
      notificationType,
      requestData,
      previousStage,
      newStage,
      comments,
      actionBy
    });

    // Send email notification
    const emailSuccess = await sendEmailNotification({
      userId: recipientUserId,
      requestId,
      notificationType,
      recipientEmail,
      subject: emailContent.subject,
      htmlContent: emailContent.html,
      textContent: emailContent.text,
      metadata: {
        previousStage,
        newStage,
        actionBy,
        timestamp: new Date().toISOString()
      }
    });

    // Send in-app notification
    const inAppSuccess = await sendInAppNotification({
      userId: recipientUserId,
      requestId,
      notificationType,
      title: inAppContent.title,
      message: inAppContent.message,
      actionUrl: inAppContent.actionUrl,
      priority: inAppContent.priority,
      metadata: {
        previousStage,
        newStage,
        actionBy,
        timestamp: new Date().toISOString()
      }
    });

    return emailSuccess || inAppSuccess; // Success if either notification type succeeds

  } catch (error) {
    console.error('Error sending workflow notification:', error);
    return false;
  }
};

/**
 * Generate email content for workflow notifications
 * @param {object} contentData - Data for generating email content
 * @returns {object} - Email content with subject, html, and text
 */
const generateWorkflowEmailContent = (contentData) => {
  const {
    notificationType,
    requestData,
    previousStage,
    newStage,
    comments
  } = contentData;

  const baseUrl = window.location.origin;
  const requestUrl = `${baseUrl}/dashboard?request=${requestData.id}`;

  let subject, html, text;

  switch (notificationType) {
    case NOTIFICATION_TYPES.REQUEST_SUBMITTED:
      subject = `New Withdrawal Request #${requestData.ref_number} - ${requestData.country}`;
      html = `
        <h2>New Withdrawal Request Submitted</h2>
        <p>A new withdrawal request has been submitted and requires your review.</p>
        <h3>Request Details:</h3>
        <ul>
          <li><strong>Reference:</strong> ${requestData.ref_number}</li>
          <li><strong>Project:</strong> ${requestData.project_number}</li>
          <li><strong>Country:</strong> ${requestData.country}</li>
          <li><strong>Beneficiary:</strong> ${requestData.beneficiary_name}</li>
          <li><strong>Amount:</strong> ${requestData.amount} ${requestData.currency}</li>
          <li><strong>Status:</strong> ${requestData.status}</li>
        </ul>
        <p><a href="${requestUrl}" style="background-color: #3B82F6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Review Request</a></p>
        <p>Please log in to the ADFD system to review and process this request.</p>
      `;
      text = `New Withdrawal Request Submitted\n\nReference: ${requestData.ref_number}\nProject: ${requestData.project_number}\nCountry: ${requestData.country}\nBeneficiary: ${requestData.beneficiary_name}\nAmount: ${requestData.amount} ${requestData.currency}\n\nPlease review: ${requestUrl}`;
      break;

    case NOTIFICATION_TYPES.REQUEST_APPROVED:
      subject = `Request Approved #${requestData.ref_number} - Action Required`;
      html = `
        <h2>Withdrawal Request Approved</h2>
        <p>A withdrawal request has been approved and forwarded to you for the next stage of processing.</p>
        <h3>Request Details:</h3>
        <ul>
          <li><strong>Reference:</strong> ${requestData.ref_number}</li>
          <li><strong>Project:</strong> ${requestData.project_number}</li>
          <li><strong>Country:</strong> ${requestData.country}</li>
          <li><strong>Amount:</strong> ${requestData.amount} ${requestData.currency}</li>
          <li><strong>Previous Stage:</strong> ${previousStage}</li>
          <li><strong>Current Stage:</strong> ${newStage}</li>
        </ul>
        ${comments ? `<p><strong>Comments:</strong> ${comments}</p>` : ''}
        <p><a href="${requestUrl}" style="background-color: #10B981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Process Request</a></p>
      `;
      text = `Request Approved #${requestData.ref_number}\n\nThe request has been approved and requires your action.\nReference: ${requestData.ref_number}\nAmount: ${requestData.amount} ${requestData.currency}\nCurrent Stage: ${newStage}\n\nProcess request: ${requestUrl}`;
      break;

    case NOTIFICATION_TYPES.REQUEST_REJECTED:
      subject = `Request Rejected #${requestData.ref_number} - Review Required`;
      html = `
        <h2>Withdrawal Request Rejected</h2>
        <p>A withdrawal request has been rejected and requires your attention.</p>
        <h3>Request Details:</h3>
        <ul>
          <li><strong>Reference:</strong> ${requestData.ref_number}</li>
          <li><strong>Project:</strong> ${requestData.project_number}</li>
          <li><strong>Country:</strong> ${requestData.country}</li>
          <li><strong>Amount:</strong> ${requestData.amount} ${requestData.currency}</li>
          <li><strong>Rejected at Stage:</strong> ${previousStage}</li>
        </ul>
        <p><strong>Rejection Reason:</strong> ${comments || 'No reason provided'}</p>
        <p><a href="${requestUrl}" style="background-color: #EF4444; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Review Request</a></p>
      `;
      text = `Request Rejected #${requestData.ref_number}\n\nReference: ${requestData.ref_number}\nRejected at: ${previousStage}\nReason: ${comments || 'No reason provided'}\n\nReview: ${requestUrl}`;
      break;

    case NOTIFICATION_TYPES.REQUEST_DISBURSED:
      subject = `Request Disbursed #${requestData.ref_number} - Completed`;
      html = `
        <h2>Withdrawal Request Completed</h2>
        <p>The withdrawal request has been successfully disbursed.</p>
        <h3>Request Details:</h3>
        <ul>
          <li><strong>Reference:</strong> ${requestData.ref_number}</li>
          <li><strong>Project:</strong> ${requestData.project_number}</li>
          <li><strong>Beneficiary:</strong> ${requestData.beneficiary_name}</li>
          <li><strong>Amount:</strong> ${requestData.amount} ${requestData.currency}</li>
          <li><strong>Disbursed:</strong> ${new Date().toLocaleDateString()}</li>
        </ul>
        <p><a href="${requestUrl}" style="background-color: #059669; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Request</a></p>
      `;
      text = `Request Disbursed #${requestData.ref_number}\n\nThe withdrawal request has been completed.\nReference: ${requestData.ref_number}\nAmount: ${requestData.amount} ${requestData.currency}\n\nView: ${requestUrl}`;
      break;

    default:
      subject = `ADFD System Notification`;
      html = `<p>You have a new notification from the ADFD system.</p><p><a href="${baseUrl}">View Dashboard</a></p>`;
      text = `You have a new notification from the ADFD system. View: ${baseUrl}`;
  }

  return { subject, html, text };
};

/**
 * Send in-app notification
 * @param {object} notificationData - In-app notification data
 * @returns {Promise<boolean>} - Success status
 */
export const sendInAppNotification = async (notificationData) => {
  try {
    const {
      userId,
      requestId,
      notificationType,
      title,
      message,
      actionUrl,
      priority = 'normal',
      metadata = {}
    } = notificationData;

    // Validate required fields
    if (!userId || !notificationType || !title || !message) {
      console.error('Missing required fields for in-app notification:', {
        userId: !!userId,
        notificationType: !!notificationType,
        title: !!title,
        message: !!message
      });
      return false;
    }

    // Check if user should receive this notification
    const shouldSend = await shouldSendNotification(userId, notificationType);
    if (!shouldSend) {
      return false;
    }

    // Prepare notification data for insertion
    const insertData = {
      user_id: userId,
      request_id: requestId || null,
      notification_type: notificationType,
      title: title.substring(0, 255), // Ensure title doesn't exceed length limits
      message: message.substring(0, 1000), // Ensure message doesn't exceed length limits
      action_url: actionUrl || null,
      priority,
      metadata: metadata || {},
      created_at: new Date().toISOString()
    };

    // Insert in-app notification with error handling
    const { error } = await supabase
      .from('in_app_notifications')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error sending in-app notification:', error);
      console.error('Error code:', error.code);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      console.error('Notification data:', notificationData);
      console.error('Insert data:', insertData);
      return false;
    }

    return true;

  } catch (error) {
    console.error('Error in sendInAppNotification:', error);
    console.error('Notification data:', notificationData);
    return false;
  }
};

/**
 * Generate in-app notification content
 * @param {object} contentData - Data for generating notification content
 * @returns {object} - Notification content with title, message, actionUrl, and priority
 */
const generateInAppNotificationContent = (contentData) => {
  const {
    notificationType,
    requestData,
    previousStage,
    newStage,
    comments
  } = contentData;

  const baseUrl = window.location.origin;
  const actionUrl = `${baseUrl}/dashboard?request=${requestData.id}`;

  let title, message, priority;

  switch (notificationType) {
    case NOTIFICATION_TYPES.REQUEST_SUBMITTED:
      title = `New Request: ${requestData.ref_number}`;
      message = `New withdrawal request from ${requestData.country} requires your review. Amount: ${requestData.amount} ${requestData.currency}`;
      priority = 'high';
      break;

    case NOTIFICATION_TYPES.REQUEST_APPROVED:
      title = `Request Approved: ${requestData.ref_number}`;
      message = `Request has been approved and forwarded to you for ${newStage.replace('_', ' ')}. Amount: ${requestData.amount} ${requestData.currency}`;
      priority = 'high';
      break;

    case NOTIFICATION_TYPES.REQUEST_REJECTED:
      title = `Request Rejected: ${requestData.ref_number}`;
      message = `Request has been rejected at ${previousStage.replace('_', ' ')} stage. ${comments ? `Reason: ${comments}` : ''}`;
      priority = 'urgent';
      break;

    case NOTIFICATION_TYPES.REQUEST_DISBURSED:
      title = `Request Completed: ${requestData.ref_number}`;
      message = `Your withdrawal request has been successfully disbursed. Amount: ${requestData.amount} ${requestData.currency}`;
      priority = 'normal';
      break;

    case NOTIFICATION_TYPES.SYSTEM_ALERT:
      title = 'System Alert';
      message = 'Important system notification requires your attention.';
      priority = 'urgent';
      break;

    default:
      title = 'ADFD Notification';
      message = 'You have a new notification from the ADFD system.';
      priority = 'normal';
  }

  return { title, message, actionUrl, priority };
};
