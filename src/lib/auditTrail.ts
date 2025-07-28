import { supabase } from './supabase';
import { AuditLog } from './database';

// Audit Trail Service for comprehensive logging
export class AuditTrailService {
  private static sessionId: string | null = null;
  private static currentUserId: string | null = null;

  // Initialize audit trail for user session
  static initialize(userId: string, sessionId: string) {
    this.currentUserId = userId;
    this.sessionId = sessionId;
    
    // Log session start
    this.logUserActivity('login', 'User logged into the system', {
      session_id: sessionId,
      login_timestamp: new Date().toISOString()
    });

    // Set up page visibility change listener
    this.setupPageVisibilityListener();
    
    // Set up beforeunload listener for logout tracking
    this.setupBeforeUnloadListener();
  }

  // Core audit logging method
  static async logAuditEvent(auditData: Partial<AuditLog>): Promise<boolean> {
    // In development mode, just log to console instead of database
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Audit Event:', auditData.action_type, '-', auditData.action_details);
      return true;
    }

    try {
      const auditEntry: Partial<AuditLog> = {
        ...auditData,
        user_id: this.currentUserId || auditData.user_id,
        session_id: this.sessionId || auditData.session_id,
        ip_address: await this.getClientIP(),
        user_agent: navigator.userAgent,
        page_url: window.location.href,
        created_at: new Date().toISOString(),
        metadata: {
          ...auditData.metadata,
          timestamp: Date.now(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          screen_resolution: `${window.screen.width}x${window.screen.height}`,
          viewport_size: `${window.innerWidth}x${window.innerHeight}`
        }
      };

      const { error } = await supabase
        .from('audit_logs')
        .insert(auditEntry);

      if (error) {
        // Check if it's a database setup issue
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          console.warn('⚠️ Database tables not set up yet. Please run the schema from database/schema.sql');
        } else {
          console.warn('⚠️ Audit logging error:', error.message);
        }
        // Don't fail the application if audit logging fails
        return true;
      }

      return true;
    } catch (error) {
      console.error('Audit trail error:', error);
      return false;
    }
  }

  // User Activity Logging
  static async logUserActivity(
    actionType: AuditLog['action_type'], 
    actionDetails: string, 
    metadata?: Record<string, any>
  ): Promise<boolean> {
    return this.logAuditEvent({
      action_type: actionType,
      action_details: actionDetails,
      metadata
    });
  }

  // Navigation Tracking
  static async logNavigation(fromPath: string, toPath: string, metadata?: Record<string, any>): Promise<boolean> {
    return this.logAuditEvent({
      action_type: 'navigate',
      action_details: `Navigation from ${fromPath} to ${toPath}`,
      metadata: {
        ...metadata,
        from_path: fromPath,
        to_path: toPath,
        navigation_type: 'route_change'
      }
    });
  }

  // Request-specific Logging
  static async logRequestAction(
    requestId: number,
    actionType: AuditLog['action_type'],
    actionDetails: string,
    previousStage?: string,
    newStage?: string,
    previousStatus?: string,
    newStatus?: string,
    amountInvolved?: number,
    metadata?: Record<string, any>
  ): Promise<boolean> {
    return this.logAuditEvent({
      request_id: requestId,
      action_type: actionType,
      action_details: actionDetails,
      previous_stage: previousStage,
      new_stage: newStage,
      previous_status: previousStatus,
      new_status: newStatus,
      amount_involved: amountInvolved,
      metadata
    });
  }

  // Data Access Logging
  static async logDataAccess(
    dataType: string,
    accessType: 'view' | 'create' | 'update' | 'delete',
    recordId?: string | number,
    metadata?: Record<string, any>
  ): Promise<boolean> {
    // Map access types to valid audit action types
    const actionTypeMap: Record<string, AuditLog['action_type']> = {
      'view': 'view',
      'create': 'create',
      'update': 'update',
      'delete': 'update' // Map delete to update since it's not in our enum
    };

    return this.logAuditEvent({
      action_type: actionTypeMap[accessType] || 'view',
      action_details: `${accessType.toUpperCase()} access to ${dataType}${recordId ? ` (ID: ${recordId})` : ''}`,
      metadata: {
        ...metadata,
        data_type: dataType,
        access_type: accessType,
        record_id: recordId
      }
    });
  }

  // Security Event Logging
  static async logSecurityEvent(
    eventType: 'unauthorized_access' | 'permission_denied' | 'suspicious_activity' | 'password_change',
    details: string,
    metadata?: Record<string, any>
  ): Promise<boolean> {
    return this.logAuditEvent({
      action_type: 'view', // Using 'view' as base type for security events
      action_details: `SECURITY EVENT: ${eventType} - ${details}`,
      metadata: {
        ...metadata,
        security_event: true,
        event_type: eventType,
        severity: 'high'
      }
    });
  }

  // Error Logging
  static async logError(
    errorType: string,
    errorMessage: string,
    stackTrace?: string,
    metadata?: Record<string, any>
  ): Promise<boolean> {
    return this.logAuditEvent({
      action_type: 'view', // Using 'view' as base type for error events
      action_details: `ERROR: ${errorType} - ${errorMessage}`,
      metadata: {
        ...metadata,
        error_event: true,
        error_type: errorType,
        error_message: errorMessage,
        stack_trace: stackTrace,
        severity: 'error'
      }
    });
  }

  // Performance Logging
  static async logPerformanceMetric(
    metricName: string,
    value: number,
    unit: string,
    metadata?: Record<string, any>
  ): Promise<boolean> {
    return this.logAuditEvent({
      action_type: 'view', // Using 'view' as base type for performance events
      action_details: `PERFORMANCE: ${metricName} = ${value}${unit}`,
      metadata: {
        ...metadata,
        performance_metric: true,
        metric_name: metricName,
        metric_value: value,
        metric_unit: unit
      }
    });
  }

  // Session Management
  static async logSessionEnd(reason: 'logout' | 'timeout' | 'forced'): Promise<boolean> {
    const result = await this.logUserActivity('logout', `Session ended: ${reason}`, {
      session_end_reason: reason,
      session_duration: this.getSessionDuration()
    });

    // Clear session data
    this.currentUserId = null;
    this.sessionId = null;

    return result;
  }

  // Utility Methods
  private static async getClientIP(): Promise<string> {
    try {
      // In production, this would be handled by the backend
      // For now, we'll use a placeholder
      return 'client-ip-placeholder';
    } catch {
      return 'unknown';
    }
  }

  private static getSessionDuration(): number {
    // Calculate session duration in minutes
    const sessionStart = localStorage.getItem('adfd-session-start');
    if (sessionStart) {
      return Math.floor((Date.now() - parseInt(sessionStart)) / 60000);
    }
    return 0;
  }

  private static setupPageVisibilityListener(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.logUserActivity('view', 'Page became hidden/inactive');
      } else {
        this.logUserActivity('view', 'Page became visible/active');
      }
    });
  }

  private static setupBeforeUnloadListener(): void {
    window.addEventListener('beforeunload', () => {
      // Use sendBeacon for reliable logging on page unload
      if (navigator.sendBeacon && this.currentUserId) {
        const auditData = {
          user_id: this.currentUserId,
          action_type: 'logout' as const,
          action_details: 'Page unload detected',
          session_id: this.sessionId,
          created_at: new Date().toISOString()
        };

        try {
          navigator.sendBeacon(
            `${process.env.REACT_APP_SUPABASE_URL}/rest/v1/audit_logs`,
            JSON.stringify(auditData)
          );
        } catch (error) {
          // Silently fail on page unload
          console.warn('Failed to send beacon on page unload');
        }
      }
    });
  }

  // Batch Logging for Performance
  private static auditQueue: Partial<AuditLog>[] = [];
  private static batchTimeout: NodeJS.Timeout | null = null;

  static queueAuditEvent(auditData: Partial<AuditLog>): void {
    this.auditQueue.push(auditData);

    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    this.batchTimeout = setTimeout(() => {
      this.flushAuditQueue();
    }, 5000); // Flush every 5 seconds
  }

  private static async flushAuditQueue(): Promise<void> {
    if (this.auditQueue.length === 0) return;

    const batch = [...this.auditQueue];
    this.auditQueue = [];

    try {
      const { error } = await supabase
        .from('audit_logs')
        .insert(batch);

      if (error) {
        console.error('Batch audit logging error:', error);
        // Re-queue failed items
        this.auditQueue.unshift(...batch);
      }
    } catch (error) {
      console.error('Batch audit flush error:', error);
      // Re-queue failed items
      this.auditQueue.unshift(...batch);
    }
  }
}
