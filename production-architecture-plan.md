# Abu Dhabi Fund Withdrawal Request Tracker - Production Architecture Plan

## Executive Summary

This document outlines the production implementation plan for the Abu Dhabi Fund Withdrawal Request Tracker system, transitioning from the current HTML simulation to a comprehensive, enterprise-grade system that manages the complete lifecycle of fund disbursement requests with strict role-based access controls, intelligent automation, and real-time tracking capabilities.

## System Overview

### Business Context
The Abu Dhabi Fund Withdrawal Request Tracker manages a **4-stage sequential workflow** for fund disbursement requests:
1. **Initial Review** → 2. **Technical Review** → 3. **Core Banking** → 4. **Disbursed**

### Core Workflow Logic
- **Archive Team** creates requests → Auto-assigned to regional Operations Team
- **Operations Team** approves/rejects → Approved requests move to Core Banking  
- **Core Banking Team** processes disbursements → Request marked as complete

### Production Requirements
- **User Base**: 10 confirmed users across 4 regional teams plus observers
  - 2 Archive Team members
  - 2 Observer roles (Loan Administrator + Head of Operations)
  - 3 Regional Operations leads
  - 3 Core Banking team members
- **Security**: Banking-grade security with zero permission exceptions
- **Regional Operations**: 3 distinct geographic regions with exclusive access controls
- **Observer Roles**: View-only access for oversight and monitoring
- **AI-Powered OCR**: Intelligent document processing with auto-assignment
- **Real-time Tracking**: Live status updates and urgent action alerts

## 1. User Roles & Strict Access Controls

### Database Schema for Roles
```sql
-- Enhanced user roles with regional assignments
public.user_profiles
├── id (uuid, references auth.users.id)
├── full_name (text)
├── role (text) -- 'archive_team', 'loan_administrator', 'head_of_operations', 'operations_team', 'core_banking'
├── region (text) -- 'north_africa', 'central_africa', 'south_east_asia', 'central_asia', 'global'
├── regional_countries (text[]) -- Array of assigned countries
├── can_create_requests (boolean, default false)
├── can_approve_reject (boolean, default false)
├── can_disburse (boolean, default false)
├── view_only_access (boolean, default false)
├── is_active (boolean, default true)
├── avatar_url (text)
├── created_by (uuid, references auth.users.id)
├── created_at (timestamp)
└── updated_at (timestamp)
```

### Role Definitions & Permissions

#### 🏛️ Archive Team
- **EXCLUSIVE PERMISSION**: Create new withdrawal requests only
- **CANNOT**: Approve, reject, or disburse any requests
- **OCR ACCESS**: Full access to AI-powered document upload and processing
- **REGIONAL SCOPE**: Global access for request creation

#### 👀 Loan Administrator (Fatima Al Hammadi - falhamadi@adfd.ae)
- **VIEW-ONLY ACCESS**: All requests across all regions and stages
- **CANNOT**: Perform any workflow actions (create, approve, reject, disburse)
- **COMMENTING**: Can add comments for tracking and coordination purposes
- **REPORTING**: Access to all analytics and audit trails
- **OBSERVER ROLE**: Oversight and monitoring without workflow interference

#### 👁️ Head of Operations (Adel Al Hosani - aalhousani@adfd.ae)
- **VIEW-ONLY ACCESS**: All requests across all regions and stages
- **CANNOT**: Perform any workflow actions (create, approve, reject, disburse)
- **COMMENTING**: Can add comments for operational coordination
- **ANALYTICS ACCESS**: Full access to operational metrics and performance data
- **OBSERVER ROLE**: Strategic oversight and operational monitoring

#### ⚖️ Operations Teams (Regional Exclusive Access)

**North Africa Team** - Ahmed Operations
- **COUNTRIES**: Egypt, Libya, Tunisia, Algeria, Morocco, Sudan
- **PERMISSIONS**: Approve/reject requests ONLY in Technical Review stage
- **RESTRICTIONS**: Cannot access requests from other regions

**Central Africa Team** - Fatima Operations  
- **COUNTRIES**: Chad, CAR, DRC, Cameroon, Nigeria, Kenya
- **PERMISSIONS**: Approve/reject requests ONLY in Technical Review stage
- **RESTRICTIONS**: Cannot access requests from other regions

**South East Asia Team** - Chen Operations
- **COUNTRIES**: Malaysia, Indonesia, Thailand, Vietnam, Philippines, Singapore
- **PERMISSIONS**: Approve/reject requests ONLY in Technical Review stage
- **RESTRICTIONS**: Cannot access requests from other regions

**Central Asia Team** - Amira Operations
- **COUNTRIES**: Kazakhstan, Uzbekistan, Kyrgyzstan, Tajikistan, Afghanistan, Pakistan
- **PERMISSIONS**: Approve/reject requests ONLY in Technical Review stage
- **RESTRICTIONS**: Cannot access requests from other regions

#### 🏦 Core Banking Team (Multi-Member Team)
- **Team Members**:
  - Ahmed Siddique (asiddique@adfd.ae)
  - Yazan Jamous (yjamous@adfd.ae)
  - Ameer Hamza (ahmotiwala@adfd.ae)
- **EXCLUSIVE PERMISSION**: Process disbursements for approved requests only
- **STAGE ACCESS**: Only requests in "Core Banking" stage
- **CANNOT**: Create, approve, or reject requests
- **FINAL AUTHORITY**: Complete disbursement processing and mark as complete
- **LOAD BALANCING**: Requests distributed among team members for efficient processing

### Regional Country Mapping
```sql
public.regional_mappings
├── id (bigint, primary key)
├── country (text, unique)
├── region (text)
├── operations_team_lead (uuid, references auth.users.id)
├── auto_assignment_active (boolean, default true)
├── processing_priority (integer, default 1)
├── created_at (timestamp)
└── updated_at (timestamp)

-- Updated Regional Mapping for Real ADFD Structure
INSERT INTO regional_mappings (country, region) VALUES
-- Europe & Latin America (Ali Al Derie)
('Spain', 'europe_latin_america'),
('Portugal', 'europe_latin_america'),
('Italy', 'europe_latin_america'),
('France', 'europe_latin_america'),
('Germany', 'europe_latin_america'),
('United Kingdom', 'europe_latin_america'),
('Brazil', 'europe_latin_america'),
('Argentina', 'europe_latin_america'),
('Chile', 'europe_latin_america'),
('Colombia', 'europe_latin_america'),
('Mexico', 'europe_latin_america'),
('Peru', 'europe_latin_america'),

-- Africa (Ahmed Al Kalbani)
('Egypt', 'africa'),
('Libya', 'africa'),
('Tunisia', 'africa'),
('Algeria', 'africa'),
('Morocco', 'africa'),
('Sudan', 'africa'),
('Chad', 'africa'),
('Central African Republic', 'africa'),
('Democratic Republic of Congo', 'africa'),
('Cameroon', 'africa'),
('Nigeria', 'africa'),
('Kenya', 'africa'),
('Ethiopia', 'africa'),
('Ghana', 'africa'),
('Senegal', 'africa'),

-- Asia (Abdulla Al Mansoori)
('Malaysia', 'asia'),
('Indonesia', 'asia'),
('Thailand', 'asia'),
('Vietnam', 'asia'),
('Philippines', 'asia'),
('Singapore', 'asia'),
('Kazakhstan', 'asia'),
('Uzbekistan', 'asia'),
('Kyrgyzstan', 'asia'),
('Tajikistan', 'asia'),
('Afghanistan', 'asia'),
('Pakistan', 'asia'),
('India', 'asia'),
('Bangladesh', 'asia');
```

## 2. Enhanced Database Architecture

### Core Business Schema
```sql
public.withdrawal_requests
├── id (bigint, primary key)
├── project_number (text, unique, not null)
├── country (text, not null)
├── region (text, not null) -- Auto-populated from country mapping
├── ref_number (text, unique, not null)
├── beneficiary_name (text, not null)
├── amount (decimal(15,2), not null)
├── currency (text, default 'USD', not null)
├── value_date (date, not null)
├── status (text, not null)
├── current_stage (text, not null) -- 'initial_review', 'technical_review', 'core_banking', 'disbursed'
├── priority (text, default 'medium') -- 'low', 'medium', 'high', 'urgent'
├── assigned_to (uuid, references auth.users.id) -- Auto-assigned based on region
├── created_by (uuid, references auth.users.id, not null)
├── beneficiary_bank (text)
├── bank_account (text)
├── iban (text)
├── swift_code (text)
├── agreement_date (date)
├── processing_days (integer, default 0)
├── sla_deadline (timestamp) -- Calculated based on priority
├── is_overdue (boolean, default false)
├── requires_extension (boolean, default false)
├── total_pending_amount (decimal(15,2)) -- For urgent alerts
├── created_at (timestamp, default now())
├── updated_at (timestamp, default now())
└── completed_at (timestamp)
```

### AI-Powered OCR Integration
```sql
public.ocr_extractions
├── id (bigint, primary key)
├── document_id (bigint, references documents.id)
├── extraction_status (text) -- 'pending', 'processing', 'completed', 'failed'
├── raw_ocr_data (jsonb) -- Full OCR response
├── extracted_fields (jsonb) -- Structured form data
├── confidence_scores (jsonb) -- Field-level confidence
├── validation_errors (jsonb) -- Data validation issues
├── auto_assignment_result (jsonb) -- Regional assignment logic result
├── processing_time_ms (integer)
├── ocr_provider (text) -- 'openai', 'google_vision', 'aws_textract'
├── created_at (timestamp)
└── updated_at (timestamp)
```

### Advanced Audit & Tracking
```sql
public.audit_logs
├── id (bigint, primary key)
├── request_id (bigint, references withdrawal_requests.id)
├── user_id (uuid, references auth.users.id)
├── action_type (text) -- 'create', 'approve', 'reject', 'disburse', 'comment', 'assign'
├── action_details (text, not null)
├── previous_stage (text)
├── new_stage (text)
├── previous_status (text)
├── new_status (text)
├── amount_involved (decimal(15,2))
├── regional_context (text)
├── metadata (jsonb)
├── ip_address (inet)
├── user_agent (text)
├── session_id (text)
├── created_at (timestamp, default now())
└── processing_context (jsonb) -- Additional business context
```

## 3. Critical Business Rules Implementation

### Regional Assignment Logic
```sql
-- Function for intelligent auto-assignment
CREATE OR REPLACE FUNCTION auto_assign_regional_team(country_name text)
RETURNS uuid AS $$
DECLARE
    team_lead_id uuid;
    target_region text;
BEGIN
    -- Get region from country mapping
    SELECT region INTO target_region 
    FROM regional_mappings 
    WHERE country = country_name AND auto_assignment_active = true;
    
    -- Get regional team lead
    SELECT id INTO team_lead_id
    FROM user_profiles 
    WHERE role = 'operations_team' 
    AND region = target_region 
    AND is_active = true
    LIMIT 1;
    
    RETURN team_lead_id;
END;
$$ LANGUAGE plpgsql;
```

### Permission Validation System
```sql
-- Strict permission validation function
CREATE OR REPLACE FUNCTION validate_user_action(
    user_id uuid,
    action_type text,
    request_id bigint
) RETURNS boolean AS $$
DECLARE
    user_role text;
    user_region text;
    request_stage text;
    request_region text;
    request_assigned_to uuid;
BEGIN
    -- Get user details
    SELECT role, region INTO user_role, user_region
    FROM user_profiles WHERE id = user_id;
    
    -- Get request details
    SELECT current_stage, region, assigned_to 
    INTO request_stage, request_region, request_assigned_to
    FROM withdrawal_requests WHERE id = request_id;
    
    -- Archive team: can only create
    IF user_role = 'archive_team' AND action_type = 'create' THEN
        RETURN true;
    END IF;

    -- Loan administrator: view-only access
    IF user_role = 'loan_administrator' AND action_type = 'view' THEN
        RETURN true;
    END IF;

    -- Head of operations: view-only access
    IF user_role = 'head_of_operations' AND action_type = 'view' THEN
        RETURN true;
    END IF;
    
    -- Loan administrator: view only
    IF user_role = 'loan_administrator' AND action_type IN ('view', 'comment') THEN
        RETURN true;
    END IF;
    
    -- Operations team: approve/reject only in their region and technical_review stage
    IF user_role = 'operations_team' 
       AND action_type IN ('approve', 'reject')
       AND request_stage = 'technical_review'
       AND user_region = request_region
       AND request_assigned_to = user_id THEN
        RETURN true;
    END IF;
    
    -- Core banking: disburse only in core_banking stage
    IF user_role = 'core_banking' 
       AND action_type = 'disburse'
       AND request_stage = 'core_banking' THEN
        RETURN true;
    END IF;
    
    -- Default: deny access
    RETURN false;
END;
$$ LANGUAGE plpgsql;
```

### SLA and Priority Management
```sql
-- Function to calculate SLA deadlines based on priority
CREATE OR REPLACE FUNCTION calculate_sla_deadline(
    priority_level text,
    created_at timestamp
) RETURNS timestamp AS $$
BEGIN
    CASE priority_level
        WHEN 'urgent' THEN RETURN created_at + INTERVAL '1 day';
        WHEN 'high' THEN RETURN created_at + INTERVAL '3 days';
        WHEN 'medium' THEN RETURN created_at + INTERVAL '7 days';
        WHEN 'low' THEN RETURN created_at + INTERVAL '14 days';
        ELSE RETURN created_at + INTERVAL '7 days';
    END CASE;
END;
$$ LANGUAGE plpgsql;
```

## 4. AI-Powered OCR Intelligence

### OCR Service Architecture
```javascript
// Advanced OCR processing service
class AbuDhabiFundOCRService {
  constructor() {
    this.providers = {
      primary: 'openai_vision',
      fallback: 'google_cloud_vision',
      structured: 'aws_textract'
    };
  }

  async processWithdrawalDocument(fileBuffer, mimeType, filename) {
    const extraction = {
      // Core required fields
      projectNumber: null,
      country: null,
      refNumber: null,
      beneficiaryName: null,
      amount: null,
      currency: 'USD',
      valueDate: null,
      priority: 'medium',
      
      // Banking details
      beneficiaryBank: null,
      bankAccount: null,
      iban: null,
      swiftCode: null,
      agreementDate: null,
      
      // Metadata
      extractionConfidence: {},
      validationErrors: [],
      suggestedRegion: null,
      suggestedAssignment: null
    };

    try {
      // Primary OCR extraction
      const ocrResult = await this.callOCRProvider(fileBuffer, mimeType);
      
      // Parse and structure data
      extraction = await this.parseOCRResults(ocrResult);
      
      // Validate extracted data
      extraction.validationErrors = this.validateExtractedData(extraction);
      
      // Determine regional assignment
      extraction.suggestedRegion = this.determineRegion(extraction.country);
      extraction.suggestedAssignment = await this.getRegionalTeamLead(extraction.suggestedRegion);
      
      return extraction;
    } catch (error) {
      throw new OCRProcessingError(`Failed to process document: ${error.message}`);
    }
  }

  determineRegion(country) {
    const regionMapping = {
      // North Africa
      'Egypt': 'north_africa',
      'Libya': 'north_africa',
      'Tunisia': 'north_africa',
      'Algeria': 'north_africa',
      'Morocco': 'north_africa',
      'Sudan': 'north_africa',
      
      // Central Africa
      'Chad': 'central_africa',
      'Central African Republic': 'central_africa',
      'Democratic Republic of Congo': 'central_africa',
      'Cameroon': 'central_africa',
      'Nigeria': 'central_africa',
      'Kenya': 'central_africa',
      
      // South East Asia
      'Malaysia': 'south_east_asia',
      'Indonesia': 'south_east_asia',
      'Thailand': 'south_east_asia',
      'Vietnam': 'south_east_asia',
      'Philippines': 'south_east_asia',
      'Singapore': 'south_east_asia',
      
      // Central Asia
      'Kazakhstan': 'central_asia',
      'Uzbekistan': 'central_asia',
      'Kyrgyzstan': 'central_asia',
      'Tajikistan': 'central_asia',
      'Afghanistan': 'central_asia',
      'Pakistan': 'central_asia'
    };
    
    return regionMapping[country] || null;
  }
}
```

## 5. Real-Time Tracking & Visual System

### Dynamic Status Management
```sql
-- Status tracking with visual indicators
public.request_status_tracking
├── id (bigint, primary key)
├── request_id (bigint, references withdrawal_requests.id)
├── stage (text, not null)
├── status_code (text, not null) -- 'pending', 'in_progress', 'completed', 'urgent', 'overdue'
├── visual_indicator (text) -- '🟠', '🟡', '🟢', '✅', '🔴', '⚡'
├── priority_level (integer) -- 1=urgent, 2=high, 3=medium, 4=low
├── requires_attention (boolean, default false)
├── sla_status (text) -- 'on_time', 'approaching_deadline', 'overdue'
├── estimated_completion (timestamp)
├── actual_completion (timestamp)
├── processing_notes (text)
├── created_at (timestamp)
└── updated_at (timestamp)
```

### Priority-Based Visual Hierarchy
```javascript
// Frontend status indicator system
const StatusIndicators = {
  INITIAL_REVIEW: {
    icon: '🟠',
    color: 'orange',
    label: 'Initial Review',
    description: 'Awaiting initial documentation review'
  },
  TECHNICAL_REVIEW: {
    icon: '🟡', 
    color: 'yellow',
    label: 'Technical Review',
    description: 'Operations team evaluation required'
  },
  CORE_BANKING: {
    icon: '🟢',
    color: 'emerald',
    label: 'Core Banking',
    description: 'Ready for disbursement processing',
    urgent: true,
    animation: 'pulse'
  },
  DISBURSED: {
    icon: '✅',
    color: 'green', 
    label: 'Disbursed',
    description: 'Request completed successfully'
  },
  OVERDUE: {
    icon: '🔴',
    color: 'red',
    label: 'Overdue',
    description: 'SLA deadline exceeded',
    urgent: true,
    animation: 'bounce'
  }
};
```

## 6. Advanced Dashboard Features

### Intelligent Dashboard Components
```javascript
// Dashboard analytics and KPIs
const DashboardMetrics = {
  // Live Statistics
  totalRequests: 'SELECT COUNT(*) FROM withdrawal_requests',
  pendingActions: `
    SELECT COUNT(*) FROM withdrawal_requests 
    WHERE current_stage IN ('technical_review', 'core_banking')
  `,
  averageProcessingTime: `
    SELECT AVG(EXTRACT(days FROM completed_at - created_at)) 
    FROM withdrawal_requests 
    WHERE completed_at IS NOT NULL
  `,
  
  // Regional Workload Distribution
  regionalWorkload: `
    SELECT region, COUNT(*) as pending_count,
           SUM(amount) as total_amount
    FROM withdrawal_requests 
    WHERE current_stage = 'technical_review'
    GROUP BY region
  `,
  
  // Urgent Action Alerts
  urgentAlerts: `
    SELECT * FROM withdrawal_requests 
    WHERE (priority = 'urgent' OR current_stage = 'core_banking')
    AND current_stage != 'disbursed'
    ORDER BY priority DESC, created_at ASC
  `,
  
  // Amount Tracking by Stage
  amountsByStage: `
    SELECT current_stage, 
           COUNT(*) as request_count,
           SUM(amount) as total_amount,
           currency
    FROM withdrawal_requests 
    WHERE current_stage != 'disbursed'
    GROUP BY current_stage, currency
  `
};
```

### Search & Filtering System
```sql
-- Advanced search function
CREATE OR REPLACE FUNCTION search_withdrawal_requests(
    search_term text DEFAULT NULL,
    stage_filter text DEFAULT NULL,
    priority_filter text DEFAULT NULL,
    region_filter text DEFAULT NULL,
    country_filter text DEFAULT NULL,
    date_from date DEFAULT NULL,
    date_to date DEFAULT NULL,
    amount_min decimal DEFAULT NULL,
    amount_max decimal DEFAULT NULL,
    currency_filter text DEFAULT NULL,
    user_id uuid DEFAULT NULL
) RETURNS TABLE (
    id bigint,
    project_number text,
    beneficiary_name text,
    amount decimal,
    currency text,
    current_stage text,
    priority text,
    region text,
    country text,
    created_at timestamp
) AS $$
BEGIN
    RETURN QUERY
    SELECT wr.id, wr.project_number, wr.beneficiary_name, 
           wr.amount, wr.currency, wr.current_stage,
           wr.priority, wr.region, wr.country, wr.created_at
    FROM withdrawal_requests wr
    JOIN user_profiles up ON up.id = user_id
    WHERE 
        -- Permission-based filtering
        (up.role = 'loan_administrator' OR 
         up.role = 'archive_team' OR
         (up.role = 'operations_team' AND wr.region = up.region) OR
         (up.role = 'core_banking' AND wr.current_stage = 'core_banking'))
        
        -- Search term filtering
        AND (search_term IS NULL OR 
             wr.ref_number ILIKE '%' || search_term || '%' OR
             wr.beneficiary_name ILIKE '%' || search_term || '%' OR
             wr.project_number ILIKE '%' || search_term || '%')
        
        -- Stage filtering
        AND (stage_filter IS NULL OR wr.current_stage = stage_filter)
        
        -- Priority filtering  
        AND (priority_filter IS NULL OR wr.priority = priority_filter)
        
        -- Region filtering
        AND (region_filter IS NULL OR wr.region = region_filter)
        
        -- Country filtering
        AND (country_filter IS NULL OR wr.country = country_filter)
        
        -- Date range filtering
        AND (date_from IS NULL OR wr.value_date >= date_from)
        AND (date_to IS NULL OR wr.value_date <= date_to)
        
        -- Amount range filtering
        AND (amount_min IS NULL OR wr.amount >= amount_min)
        AND (amount_max IS NULL OR wr.amount <= amount_max)
        
        -- Currency filtering
        AND (currency_filter IS NULL OR wr.currency = currency_filter)
    
    ORDER BY 
        CASE wr.priority 
            WHEN 'urgent' THEN 1
            WHEN 'high' THEN 2  
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
        END,
        wr.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 7. Security & Compliance Implementation

### Banking-Grade Security
```sql
-- Row Level Security policies
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Archive team: can view own created requests
CREATE POLICY archive_team_policy ON withdrawal_requests
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() 
        AND role = 'archive_team'
        AND (created_by = auth.uid() OR current_stage = 'initial_review')
    )
);

-- Operations team: regional access only
CREATE POLICY operations_team_policy ON withdrawal_requests  
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles up
        WHERE up.id = auth.uid()
        AND up.role = 'operations_team' 
        AND up.region = withdrawal_requests.region
        AND withdrawal_requests.current_stage = 'technical_review'
        AND withdrawal_requests.assigned_to = auth.uid()
    )
);

-- Core banking: approved requests only
CREATE POLICY core_banking_policy ON withdrawal_requests
FOR ALL TO authenticated  
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid()
        AND role = 'core_banking'
        AND withdrawal_requests.current_stage = 'core_banking'
    )
);

-- Loan administrator: view all
CREATE POLICY loan_admin_policy ON withdrawal_requests
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid()
        AND role = 'loan_administrator'
    )
);
```

### Financial Controls & Validation
```sql
-- Amount verification and currency handling
CREATE OR REPLACE FUNCTION validate_financial_data(
    amount decimal,
    currency text,
    beneficiary_bank text,
    iban text
) RETURNS jsonb AS $$
DECLARE
    validation_result jsonb := '{}';
    errors text[] := '{}';
BEGIN
    -- Amount validation
    IF amount <= 0 THEN
        errors := array_append(errors, 'Amount must be greater than zero');
    END IF;
    
    IF amount > 10000000 THEN -- 10M limit
        errors := array_append(errors, 'Amount exceeds maximum limit of 10,000,000');
    END IF;
    
    -- Currency validation
    IF currency NOT IN ('USD', 'EUR', 'AED', 'SAR', 'EGP') THEN
        errors := array_append(errors, 'Unsupported currency');
    END IF;
    
    -- IBAN validation (basic format check)
    IF iban IS NOT NULL AND LENGTH(iban) < 15 THEN
        errors := array_append(errors, 'Invalid IBAN format');
    END IF;
    
    -- Bank validation
    IF beneficiary_bank IS NULL OR LENGTH(beneficiary_bank) < 3 THEN
        errors := array_append(errors, 'Beneficiary bank is required');
    END IF;
    
    validation_result := jsonb_build_object(
        'is_valid', array_length(errors, 1) IS NULL,
        'errors', errors,
        'validated_at', now()
    );
    
    RETURN validation_result;
END;
$$ LANGUAGE plpgsql;
```

## 8. Performance & User Experience

### Responsive Design Principles
```javascript
// Mobile-first responsive breakpoints
const breakpoints = {
  mobile: '320px',
  tablet: '768px', 
  desktop: '1024px',
  wide: '1440px'
};

// Progressive disclosure for complex data
const RequestDetailView = {
  summary: ['project_number', 'beneficiary_name', 'amount', 'status'],
  financial: ['currency', 'value_date', 'beneficiary_bank', 'iban'],
  processing: ['current_stage', 'assigned_to', 'processing_days', 'priority'],
  audit: ['created_by', 'created_at', 'updated_at', 'audit_trail']
};
```

### Real-time Notifications System
```sql
-- Notification preferences and delivery
public.notification_settings
├── id (bigint, primary key)
├── user_id (uuid, references auth.users.id)
├── notification_type (text) -- 'status_change', 'assignment', 'urgent_alert', 'sla_warning'
├── delivery_method (text) -- 'in_app', 'email', 'both'
├── is_enabled (boolean, default true)
├── frequency (text) -- 'immediate', 'hourly', 'daily'
├── created_at (timestamp)
└── updated_at (timestamp)

-- Real-time notification queue
public.notification_queue
├── id (bigint, primary key)
├── recipient_id (uuid, references auth.users.id)
├── request_id (bigint, references withdrawal_requests.id)
├── notification_type (text)
├── title (text)
├── message (text)
├── priority (text) -- 'low', 'medium', 'high', 'urgent'
├── is_read (boolean, default false)
├── delivered_at (timestamp)
├── created_at (timestamp)
└── metadata (jsonb)
```

## 9. Success Metrics & KPIs

### Business Performance Indicators
```sql
-- Comprehensive analytics views
CREATE VIEW request_performance_metrics AS
SELECT 
    DATE_TRUNC('week', created_at) as week,
    region,
    COUNT(*) as total_requests,
    COUNT(CASE WHEN current_stage = 'disbursed' THEN 1 END) as completed_requests,
    AVG(CASE WHEN completed_at IS NOT NULL 
        THEN EXTRACT(days FROM completed_at - created_at) END) as avg_processing_days,
    SUM(amount) as total_amount_processed,
    COUNT(CASE WHEN is_overdue THEN 1 END) as overdue_requests,
    COUNT(CASE WHEN priority = 'urgent' THEN 1 END) as urgent_requests
FROM withdrawal_requests
GROUP BY DATE_TRUNC('week', created_at), region
ORDER BY week DESC, region;

-- Regional efficiency tracking
CREATE VIEW regional_efficiency AS
SELECT 
    region,
    COUNT(*) as total_assigned,
    COUNT(CASE WHEN current_stage != 'technical_review' THEN 1 END) as processed,
    ROUND(
        COUNT(CASE WHEN current_stage != 'technical_review' THEN 1 END)::decimal / 
        COUNT(*)::decimal * 100, 2
    ) as processing_rate,
    AVG(processing_days) as avg_processing_time
FROM withdrawal_requests
WHERE assigned_to IS NOT NULL
GROUP BY region;
```

### System Health Monitoring
```javascript
// Application performance metrics
const SystemMetrics = {
  // Processing speed targets
  targetProcessingTimes: {
    urgent: 1, // 1 day
    high: 3,   // 3 days  
    medium: 7, // 7 days
    low: 14    // 14 days
  },
  
  // Error rate thresholds
  errorRateThresholds: {
    ocr_failure: 0.05,      // 5% max OCR failure rate
    permission_violations: 0, // Zero tolerance
    data_validation: 0.02    // 2% max validation errors
  },
  
  // User satisfaction targets
  satisfactionTargets: {
    user_adoption: 0.95,     // 95% user adoption
    task_completion: 0.98,   // 98% task completion rate
    response_time: 2000,     // 2 second max response time
    uptime: 0.999           // 99.9% uptime SLA
  }
};
```

## 10. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- **Database Setup**: Complete schema implementation with RLS
- **Authentication**: Supabase Auth with role-based profiles
- **Basic UI**: Landing page and authentication flows
- **Regional Mapping**: Country-to-region assignment logic

### Phase 2: Core Workflow (Week 3-4)  
- **Request Creation**: Archive team functionality with basic OCR
- **Regional Assignment**: Automatic assignment based on country
- **Operations Interface**: Regional team approval/rejection workflows
- **Basic Dashboard**: Essential KPIs and request listing

### Phase 3: Advanced Features (Week 5-6)
- **Enhanced OCR**: AI-powered extraction with multiple providers
- **Real-time Updates**: Live status tracking and notifications  
- **Advanced Search**: Multi-parameter filtering and sorting
- **Audit System**: Comprehensive action logging

### Phase 4: Banking Integration (Week 7-8)
- **Core Banking Workflow**: Disbursement processing interface
- **Financial Validation**: Amount verification and currency handling
- **Document Management**: Secure file storage and versioning
- **Compliance Features**: Regulatory reporting and controls

### Phase 5: Optimization & Launch (Week 9-10)
- **Performance Tuning**: Query optimization and caching
- **Security Audit**: Penetration testing and vulnerability assessment
- **User Training**: Role-specific training materials and sessions
- **Production Deployment**: Go-live with monitoring and support

## Personnel Directory

### Complete Team Roster with Contact Information

#### System Administrator
| Name | Position | Email |
|------|----------|-------|
| Mitty | System Administrator | Mamadouourydiallo819@gmail.com |

#### Archive Team
| Name | Position | Email |
|------|----------|-------|
| Ahmed Al Zaabi | Archive Team Member | aalzaabi@adfd.ae |
| Meera Al Mehairi | Archive Team Member | mkalmheiri@adfd.ae |

#### Observer Roles
| Name | Position | Email |
|------|----------|-------|
| Fatima Al Hammadi | Loan Administrator | falhamadi@adfd.ae |
| Adel Al Hosani | Head of Operations | aalhousani@adfd.ae |

#### Regional Operations Teams
| Name | Position | Email | Region |
|------|----------|-------|---------|
| Ali Al Derie | Europe & Latin America Operations Lead | aalderei@adfd.ae | Europe & Latin America |
| Ahmed Al Kalbani | Africa Operations Lead | aalkalbani@adfd.ae | Africa |
| Abdulla Al Mansoori | Asia Operations Lead | amalmansoori@adfd.ae | Asia |

#### Core Banking Team
| Name | Position | Email |
|------|----------|-------|
| Ahmed Siddique | Core Banking Team Member | asiddique@adfd.ae |
| Yazan Jamous | Core Banking Team Member | yjamous@adfd.ae |
| Ameer Hamza | Core Banking Team Member | ahmotiwala@adfd.ae |

### Summary
- **Total Personnel**: 11 confirmed users
- **System Administrator**: 1 admin (Mitty)
- **Archive Team**: 2 members
- **Observer Roles**: 2 members (Loan Administrator + Head of Operations)
- **Regional Operations**: 3 leads (covering Europe & Latin America, Africa, and Asia)
- **Core Banking**: 3 team members

## Conclusion

This comprehensive architecture plan transforms the Abu Dhabi Fund Withdrawal Request Tracker into a production-ready, enterprise-grade system that embodies strict role-based access controls, intelligent automation, and real-time tracking capabilities.

The solution maintains the gold standard for financial request processing by combining cutting-edge AI-powered OCR automation with bulletproof security and an intuitive user experience, specifically designed for the unique requirements of the Abu Dhabi Fund's multi-regional operations workflow.

The modular, scalable architecture ensures the system can grow with the organization while maintaining the strict security and compliance requirements essential for financial institutions.

// Updated Auto-Assignment Logic for Real ADFD Teams
const realADFDTeamMapping = {
  // Archive Team
  archive: [
    { name: 'Ahmed Al Zaabi', email: 'aalzaabi@adfd.ae', id: 'archive_001' },
    { name: 'Meera Al Mehairi', email: 'mkalmheiri@adfd.ae', id: 'archive_002' }
  ],
  
  // Regional Operations
  operations: {
    'europe_latin_america': {
      lead: 'Ali Al Derie',
      email: 'aalderei@adfd.ae',
      id: 'ops_europe_latam',
      countries: ['Spain', 'Portugal', 'Italy', 'France', 'Germany', 'UK', 'Brazil', 'Argentina', 'Chile', 'Colombia', 'Mexico', 'Peru']
    },
    'africa': {
      lead: 'Ahmed Al Kalbani', 
      email: 'aalkalbani@adfd.ae',
      id: 'ops_africa',
      countries: ['Egypt', 'Libya', 'Tunisia', 'Algeria', 'Morocco', 'Sudan', 'Chad', 'CAR', 'DRC', 'Cameroon', 'Nigeria', 'Kenya', 'Ethiopia', 'Ghana', 'Senegal']
    },
    'asia': {
      lead: 'Abdulla Al Mansoori',
      email: 'amalmansoori@adfd.ae', 
      id: 'ops_asia',
      countries: ['Malaysia', 'Indonesia', 'Thailand', 'Vietnam', 'Philippines', 'Singapore', 'Kazakhstan', 'Uzbekistan', 'Kyrgyzstan', 'Tajikistan', 'Afghanistan', 'Pakistan', 'India', 'Bangladesh']
    }
  },
  
  // Loan Administrator (Observer Role)
  loan_administrator: {
    name: 'Fatima Al Hammadi',
    email: 'falhamadi@adfd.ae',
    id: 'loan_admin_001',
    role: 'observer',
    permissions: ['view_all', 'comment', 'reports'],
    regional_access: 'global'
  },

  // Head of Operations (Observer Role)
  head_of_operations: {
    name: 'Adel Al Hosani',
    email: 'aalhousani@adfd.ae',
    id: 'head_ops_001',
    role: 'observer',
    permissions: ['view_all', 'comment', 'analytics'],
    regional_access: 'global'
  },

  // Core Banking Team (Disbursement Authority)
  core_banking: [
    {
      name: 'Ahmed Siddique',
      email: 'asiddique@adfd.ae',
      id: 'core_banking_001',
      role: 'core_banking',
      permissions: ['disburse', 'view_assigned', 'comment']
    },
    {
      name: 'Yazan Jamous',
      email: 'yjamous@adfd.ae',
      id: 'core_banking_002',
      role: 'core_banking',
      permissions: ['disburse', 'view_assigned', 'comment']
    },
    {
      name: 'Ameer Hamza',
      email: 'ahmotiwala@adfd.ae',
      id: 'core_banking_003',
      role: 'core_banking',
      permissions: ['disburse', 'view_assigned', 'comment']
    }
  ]
};

// Integration with existing OCR service
class EnhancedADFDOCRService {
  constructor() {
    this.formParser = new ADFDFormOCRParser();
    this.ocrProvider = new FreeOCRService(); // Using free Tesseract.js
  }

  async processOfficialWithdrawalForm(file) {
    try {
      // Step 1: Extract raw text using OCR
      const rawText = await this.ocrProvider.extractText(file);
      
      // Step 2: Validate it's an official ADFD form
      if (!this.isOfficialADFDForm(rawText)) {
        throw new Error('Document does not appear to be an official ADFD withdrawal request form');
      }
      
      // Step 3: Parse using official form structure
      const parsedData = await this.formParser.parseOfficialWithdrawalForm(rawText);
      
      // Step 4: Validate required fields
      const validation = this.validateRequiredFields(parsedData);
      if (!validation.isValid) {
        throw new Error(`Missing required fields: ${validation.missingFields.join(', ')}`);
      }
      
      // Step 5: Auto-assign to regional operations team
      if (parsedData.region && parsedData.assignedTo) {
        parsedData.autoAssigned = true;
        parsedData.assignmentReason = `Auto-assigned to ${parsedData.region} operations team based on beneficiary location`;
      }
      
      return {
        success: true,
        extractedData: parsedData,
        confidence: this.calculateConfidence(parsedData),
        processingNotes: [
          'Official ADFD form detected',
          'All required fields extracted',
          parsedData.autoAssigned ? 'Auto-assigned to regional team' : 'Manual assignment required'
        ]
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        extractedData: null
      };
    }
  }

  isOfficialADFDForm(text) {
    const requiredElements = [
      /Abu Dhabi Fund for Development/i,
      /Al Buteen P\.O\. Box: 814/i,
      /Operations Department & Core Banking Department/i,
      /Withdrawal Request/i,
      /Beneficiary Name/i,
      /Beneficiary Bank/i
    ];
    
    return requiredElements.every(pattern => pattern.test(text));
  }

  validateRequiredFields(data) {
    const required = [
      'withdrawalRequestNo', 'projectNo', 'beneficiaryName', 
      'beneficiaryBankName', 'beneficiaryBankAccount', 'withdrawalAmount'
    ];
    
    const missing = required.filter(field => !data[field] || data[field].trim() === '');
    
    return {
      isValid: missing.length === 0,
      missingFields: missing
    };
  }

  calculateConfidence(data) {
    const totalFields = 15; // Total extractable fields
    const extractedFields = Object.values(data).filter(value => 
      value !== null && value !== undefined && value !== ''
    ).length;
    
    return Math.round((extractedFields / totalFields) * 100);
  }
}

// Abu Dhabi Fund Official Form OCR Parser
class ADFDFormOCRParser {
  constructor() {
    this.formStructure = {
      header: 'Abu Dhabi Fund for Development',
      address: 'Al Buteen P.O. Box: 814, Abu Dhabi, United Arab Emirates',
      recipient: 'Operations Department & Core Banking Department'
    };
  }

  async parseOfficialWithdrawalForm(extractedText) {
    const formData = {
      // Header Information
      withdrawalRequestNo: this.extractField(extractedText, /Withdrawal Request no\.?\s*([^\n\r,]+)/i),
      date: this.extractField(extractedText, /Date:\s*([^\n\r]+)/i),
      
      // Subject Line Data
      projectDetails: this.extractField(extractedText, /Withdrawal Request, For\s*([^,]+)/i),
      projectNo: this.extractField(extractedText, /Project No\s*\(([^)]+)\)/i),
      
      // Agreement Information
      agreementReference: this.extractField(extractedText, /Pursuant to the\s*([^.]+)/i),
      agreementDate: this.extractField(extractedText, /Signed on\s*([^.]+)/i),
      beneficiaryEntity: this.extractField(extractedText, /Between Abu Dhabi Fund for Development and\s*([^.]+)/i),
      
      // Financial Details
      withdrawalAmount: this.extractField(extractedText, /Said amount is required.*?(\d+(?:,\d{3})*(?:\.\d{2})?)/i),
      currency: this.detectCurrency(extractedText),
      
      // Banking Information
      beneficiaryName: this.extractField(extractedText, /Beneficiary Name\s*([^\n\r]+)/i),
      beneficiaryAddress: this.extractField(extractedText, /Beneficiary address\s*([^\n\r]+)/i),
      beneficiaryBankName: this.extractField(extractedText, /Beneficiary Bank Name\s*([^\n\r]+)/i),
      beneficiaryBankAddress: this.extractField(extractedText, /Beneficiary Bank address\s*([^\n\r]+)/i),
      beneficiaryBankAccount: this.extractField(extractedText, /Beneficiary Bank account\s*([0-9-]+)/i),
      beneficiaryBankIBAN: this.extractField(extractedText, /Beneficiary Bank IBAN\s*([A-Z0-9-]+)/i),
      beneficiaryBankSwift: this.extractField(extractedText, /Beneficiary Bank Swift code\s*([A-Z0-9]+)/i),
      
      // Correspondence Bank
      correspondenceBankName: this.extractField(extractedText, /Correspondence bank Name\s*([^\n\r]+)/i),
      correspondenceBankSwift: this.extractField(extractedText, /Correspondence bank Swift code\s*([A-Z0-9]+)/i),
      correspondenceBankAddress: this.extractField(extractedText, /Correspondence bank address\s*([^\n\r]+)/i),
      
      // Authorization
      authorizedRepresentative: this.extractAuthorizedRep(extractedText),
      
      // Auto-derived fields
      region: null, // Will be set based on beneficiary country
      assignedTo: null, // Will be auto-assigned to regional operations
      priority: this.determinePriority(extractedText),
      status: 'initial_review',
      currentStage: 'initial_review'
    };

    // Auto-detect country and assign region
    const country = this.detectCountryFromForm(formData);
    if (country) {
      formData.country = country;
      formData.region = this.getRegionFromCountry(country);
      formData.assignedTo = this.getRegionalOperationsLead(formData.region);
    }

    return formData;
  }

  extractField(text, pattern) {
    const match = text.match(pattern);
    return match ? match[1].trim().replace(/Click here to enter text\.?/gi, '') : null;
  }

  detectCurrency(text) {
    const currencyPatterns = [
      /USD|US\$|\$|United States Dollar/i,
      /EUR|€|Euro/i,
      /AED|Dirham/i,
      /GBP|£|Pound/i
    ];
    
    for (const pattern of currencyPatterns) {
      if (pattern.test(text)) {
        if (/USD|US\$|\$/i.test(text)) return 'USD';
        if (/EUR|€/i.test(text)) return 'EUR';
        if (/AED/i.test(text)) return 'AED';
        if (/GBP|£/i.test(text)) return 'GBP';
      }
    }
    return 'USD'; // Default
  }

  detectCountryFromForm(formData) {
    // Try to detect from beneficiary address, bank name, or IBAN
    const textToAnalyze = [
      formData.beneficiaryAddress,
      formData.beneficiaryBankName,
      formData.beneficiaryBankAddress,
      formData.beneficiaryBankIBAN
    ].filter(Boolean).join(' ');

    const countryPatterns = {
      // Africa
      'Egypt': /egypt|cairo|alexandria|EG\d{2}|NBEG|egyptian/i,
      'Nigeria': /nigeria|lagos|abuja|NG\d{2}|FBNB|nigerian/i,
      'Morocco': /morocco|casablanca|rabat|MA\d{2}|moroccan/i,
      'Kenya': /kenya|nairobi|KE\d{2}|kenyan/i,
      
      // Asia
      'Malaysia': /malaysia|kuala lumpur|MY\d{2}|MBBE|malaysian/i,
      'Indonesia': /indonesia|jakarta|ID\d{2}|indonesian/i,
      'Pakistan': /pakistan|karachi|lahore|PK\d{2}|pakistani/i,
      'Bangladesh': /bangladesh|dhaka|BD\d{2}|bangladeshi/i,
      
      // Europe & Latin America
      'Spain': /spain|madrid|barcelona|ES\d{2}|spanish/i,
      'Brazil': /brazil|sao paulo|rio|BR\d{2}|brazilian/i,
      'Argentina': /argentina|buenos aires|AR\d{2}|argentinian/i
    };

    for (const [country, pattern] of Object.entries(countryPatterns)) {
      if (pattern.test(textToAnalyze)) {
        return country;
      }
    }
    
    return null;
  }

  getRegionFromCountry(country) {
    const regionMapping = {
      // Africa
      'Egypt': 'africa', 'Nigeria': 'africa', 'Morocco': 'africa', 'Kenya': 'africa',
      'Libya': 'africa', 'Tunisia': 'africa', 'Algeria': 'africa', 'Sudan': 'africa',
      
      // Asia  
      'Malaysia': 'asia', 'Indonesia': 'asia', 'Pakistan': 'asia', 'Bangladesh': 'asia',
      'Thailand': 'asia', 'Vietnam': 'asia', 'Philippines': 'asia', 'Singapore': 'asia',
      
      // Europe & Latin America
      'Spain': 'europe_latin_america', 'Brazil': 'europe_latin_america', 
      'Argentina': 'europe_latin_america', 'Portugal': 'europe_latin_america'
    };
    
    return regionMapping[country] || null;
  }

  getRegionalOperationsLead(region) {
    const operationsLeads = {
      'africa': 'ops_africa', // Ahmed Al Kalbani
      'asia': 'ops_asia', // Abdulla Al Mansoori  
      'europe_latin_america': 'ops_europe_latam' // Ali Al Derie
    };
    
    return operationsLeads[region] || null;
  }

  determinePriority(text) {
    // Check for urgency indicators in the form
    if (/urgent|emergency|immediate/i.test(text)) return 'urgent';
    if (/high|priority|expedite/i.test(text)) return 'high';
    return 'medium';
  }

  extractAuthorizedRep(text) {
    // Extract authorized representative information
    const repSection = text.match(/Authorized representative(.*?)$/is);
    if (repSection) {
      const lines = repSection[1].split('\n').filter(line => 
        line.trim() && !line.includes('Click here to enter text')
      );
      return lines.slice(0, 2).map(line => line.trim()).join(', ');
    }
    return null;
  }
}
