import { supabase } from './supabase';

// Database Types
export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  department: string;
  region?: string;
  regional_countries?: string[];
  can_create_requests: boolean;
  can_approve_reject: boolean;
  can_disburse: boolean;
  view_only_access: boolean;
  is_active: boolean;
  avatar_url?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface WithdrawalRequest {
  id: number;
  project_number: string;
  country: string;
  region: string;
  ref_number: string;
  beneficiary_name: string;
  amount: number;
  currency: string;
  value_date: string;
  status: string;
  current_stage: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: string;
  created_by: string;
  beneficiary_bank?: string;
  bank_account?: string;
  iban?: string;
  swift_code?: string;
  agreement_date?: string;
  processing_days: number;
  sla_deadline?: string;
  is_overdue: boolean;
  requires_extension: boolean;
  total_pending_amount?: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface AuditLog {
  id: number;
  request_id?: number;
  user_id: string;
  action_type: 'create' | 'approve' | 'reject' | 'disburse' | 'comment' | 'assign' | 'login' | 'logout' | 'view' | 'navigate' | 'update';
  action_details: string;
  previous_stage?: string;
  new_stage?: string;
  previous_status?: string;
  new_status?: string;
  amount_involved?: number;
  regional_context?: string;
  metadata?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  page_url?: string;
  created_at: string;
  processing_context?: Record<string, any>;
}

export interface UserSession {
  id: string;
  user_id: string;
  session_token: string;
  ip_address?: string;
  user_agent?: string;
  login_at: string;
  logout_at?: string;
  last_activity: string;
  is_active: boolean;
  remember_me: boolean;
}

// Database Operations
export class DatabaseService {
  // User Profile Operations
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data;
  }

  static async createUserProfile(profile: Partial<UserProfile>): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert(profile)
      .select()
      .single();

    if (error) {
      console.error('Error creating user profile:', error);
      return null;
    }

    return data;
  }

  static async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user profile:', error);
      return null;
    }

    return data;
  }

  // Withdrawal Request Operations
  static async getWithdrawalRequests(filters?: {
    status?: string;
    region?: string;
    assigned_to?: string;
    created_by?: string;
  }): Promise<WithdrawalRequest[]> {
    let query = supabase.from('withdrawal_requests').select('*');

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.region) {
      query = query.eq('region', filters.region);
    }
    if (filters?.assigned_to) {
      query = query.eq('assigned_to', filters.assigned_to);
    }
    if (filters?.created_by) {
      query = query.eq('created_by', filters.created_by);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching withdrawal requests:', error);
      return [];
    }

    return data || [];
  }

  static async createWithdrawalRequest(request: Partial<WithdrawalRequest>): Promise<WithdrawalRequest | null> {
    const { data, error } = await supabase
      .from('withdrawal_requests')
      .insert(request)
      .select()
      .single();

    if (error) {
      console.error('Error creating withdrawal request:', error);
      return null;
    }

    return data;
  }

  static async updateWithdrawalRequest(id: number, updates: Partial<WithdrawalRequest>): Promise<WithdrawalRequest | null> {
    const { data, error } = await supabase
      .from('withdrawal_requests')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating withdrawal request:', error);
      return null;
    }

    return data;
  }

  // User Session Operations
  static async createUserSession(session: Partial<UserSession>): Promise<UserSession | null> {
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .insert(session)
        .select()
        .single();

      if (error) {
        console.warn('Error creating user session (database may not be set up):', error.message);
        return null;
      }

      return data;
    } catch (error) {
      console.warn('Database operation failed, continuing without session tracking');
      return null;
    }
  }

  static async updateUserSession(sessionId: string, updates: Partial<UserSession>): Promise<UserSession | null> {
    const { data, error } = await supabase
      .from('user_sessions')
      .update({ ...updates, last_activity: new Date().toISOString() })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user session:', error);
      return null;
    }

    return data;
  }

  static async endUserSession(sessionId: string): Promise<boolean> {
    const { error } = await supabase
      .from('user_sessions')
      .update({ 
        logout_at: new Date().toISOString(),
        is_active: false 
      })
      .eq('id', sessionId);

    if (error) {
      console.error('Error ending user session:', error);
      return false;
    }

    return true;
  }

  // Real-time Subscriptions
  static subscribeToWithdrawalRequests(callback: (payload: any) => void) {
    return supabase
      .channel('withdrawal_requests_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'withdrawal_requests' }, 
        callback
      )
      .subscribe();
  }

  static subscribeToAuditLogs(callback: (payload: any) => void) {
    return supabase
      .channel('audit_logs_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'audit_logs' }, 
        callback
      )
      .subscribe();
  }
}
