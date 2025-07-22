-- Row-Level Security (RLS) Policies Migration
-- Implements comprehensive security policies for user authentication and regional data segregation

-- Enable RLS on core tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view and update their own profile
CREATE POLICY user_own_profile ON user_profiles
    FOR ALL
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Policy 2: Admin roles have broader access to all user profiles
CREATE POLICY admin_full_access ON user_profiles
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM roles r
            WHERE r.id = (
                SELECT role_id FROM user_profiles up 
                WHERE up.id = auth.uid()
            )
            AND r.is_admin = TRUE
        )
    );

-- Policy 3: Regional managers can access users in their region (SELECT only)
CREATE POLICY regional_manager_access ON user_profiles
    FOR SELECT
    TO authenticated
    USING (
        region_id = (
            SELECT region_id FROM user_profiles up 
            WHERE up.id = auth.uid()
        )
        AND EXISTS (
            SELECT 1 FROM roles r
            WHERE r.id = (
                SELECT role_id FROM user_profiles up2 
                WHERE up2.id = auth.uid()
            )
            AND r.name = 'manager'
        )
    );

-- Policy 4: Strict regional data segregation for non-admin users
CREATE POLICY regional_segregation ON user_profiles
    FOR SELECT
    TO authenticated
    USING (
        -- Same region access
        region_id = (
            SELECT region_id FROM user_profiles up 
            WHERE up.id = auth.uid()
        )
        OR 
        -- Admin bypass
        EXISTS (
            SELECT 1 FROM roles r
            WHERE r.id = (
                SELECT role_id FROM user_profiles up2 
                WHERE up2.id = auth.uid()
            )
            AND r.is_admin = TRUE
        )
    );

-- Policy 5: Super admin bypass for cross-regional access
CREATE POLICY super_admin_bypass ON user_profiles
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM roles r
            WHERE r.id = (
                SELECT role_id FROM user_profiles up 
                WHERE up.id = auth.uid()
            )
            AND r.name = 'super_admin'
        )
    );

-- Policy 6: Manager can update users in their region (limited UPDATE access)
CREATE POLICY regional_manager_update ON user_profiles
    FOR UPDATE
    TO authenticated
    USING (
        region_id = (
            SELECT region_id FROM user_profiles up 
            WHERE up.id = auth.uid()
        )
        AND EXISTS (
            SELECT 1 FROM roles r
            WHERE r.id = (
                SELECT role_id FROM user_profiles up2 
                WHERE up2.id = auth.uid()
            )
            AND r.name = 'manager'
        )
        -- Prevent managers from modifying their own role or admin accounts
        AND id != auth.uid()
        AND role_id NOT IN (
            SELECT id FROM roles WHERE is_admin = TRUE
        )
    )
    WITH CHECK (
        -- Managers can only assign non-admin roles and keep users in same region
        role_id NOT IN (SELECT id FROM roles WHERE is_admin = TRUE)
        AND region_id = (
            SELECT region_id FROM user_profiles up 
            WHERE up.id = auth.uid()
        )
    );

-- RLS Policies for role_permissions table
-- Policy 7: Only admins can manage role permissions
CREATE POLICY admin_role_permissions ON role_permissions
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM roles r
            WHERE r.id = (
                SELECT role_id FROM user_profiles up 
                WHERE up.id = auth.uid()
            )
            AND r.is_admin = TRUE
        )
    );

-- Policy 8: Users can read their own role permissions
CREATE POLICY user_read_own_permissions ON role_permissions
    FOR SELECT
    TO authenticated
    USING (
        role_id = (
            SELECT role_id FROM user_profiles up 
            WHERE up.id = auth.uid()
        )
    );

-- RLS Policies for lookup tables (roles, regions, permissions)
-- These are generally read-only for authenticated users, write access for admins only

-- Enable RLS on lookup tables
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

-- Policy 9: All authenticated users can read roles, regions, permissions
CREATE POLICY read_roles ON roles
    FOR SELECT
    TO authenticated
    USING (TRUE);

CREATE POLICY read_regions ON regions
    FOR SELECT
    TO authenticated
    USING (TRUE);

CREATE POLICY read_permissions ON permissions
    FOR SELECT
    TO authenticated
    USING (TRUE);

-- Policy 10: Only admins can modify lookup tables
CREATE POLICY admin_modify_roles ON roles
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM roles r
            WHERE r.id = (
                SELECT role_id FROM user_profiles up 
                WHERE up.id = auth.uid()
            )
            AND r.is_admin = TRUE
        )
    );

CREATE POLICY admin_modify_regions ON regions
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM roles r
            WHERE r.id = (
                SELECT role_id FROM user_profiles up 
                WHERE up.id = auth.uid()
            )
            AND r.is_admin = TRUE
        )
    );

CREATE POLICY admin_modify_permissions ON permissions
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM roles r
            WHERE r.id = (
                SELECT role_id FROM user_profiles up 
                WHERE up.id = auth.uid()
            )
            AND r.is_admin = TRUE
        )
    );

-- Policy 11: Viewers have read-only access (explicit)
CREATE POLICY viewer_read_only ON user_profiles
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM roles r
            WHERE r.id = (
                SELECT role_id FROM user_profiles up 
                WHERE up.id = auth.uid()
            )
            AND r.name = 'viewer'
        )
        AND (
            -- Same region for viewers
            region_id = (
                SELECT region_id FROM user_profiles up 
                WHERE up.id = auth.uid()
            )
            OR 
            -- Admin viewers can see all
            EXISTS (
                SELECT 1 FROM roles r2
                WHERE r2.id = (
                    SELECT role_id FROM user_profiles up2 
                    WHERE up2.id = auth.uid()
                )
                AND r2.is_admin = TRUE
            )
        )
    );

-- Create policy priorities (ensure most restrictive policies are evaluated last)
-- Note: PostgreSQL evaluates policies in creation order for OR logic
-- The most permissive policies should be created first for proper access

-- Add comments for policy documentation
COMMENT ON POLICY user_own_profile ON user_profiles IS 'Users can manage their own profile data';
COMMENT ON POLICY admin_full_access ON user_profiles IS 'Admins have full access to all user profiles';
COMMENT ON POLICY regional_manager_access ON user_profiles IS 'Regional managers can view users in their region';
COMMENT ON POLICY regional_segregation ON user_profiles IS 'Enforce regional data isolation for non-admin users';
COMMENT ON POLICY super_admin_bypass ON user_profiles IS 'Super admins can access all data across regions';
COMMENT ON POLICY regional_manager_update ON user_profiles IS 'Managers can update non-admin users in their region';

-- Security validation function to help debug RLS
CREATE OR REPLACE FUNCTION check_user_access(target_user_id UUID)
RETURNS TABLE (
    can_select BOOLEAN,
    can_update BOOLEAN,
    can_delete BOOLEAN,
    user_role TEXT,
    user_region TEXT,
    target_region TEXT
) AS $$
DECLARE
    current_user_id UUID := auth.uid();
    current_role TEXT;
    current_region TEXT;
    target_region TEXT;
BEGIN
    -- Get current user's role and region
    SELECT r.name, reg.code INTO current_role, current_region
    FROM user_profiles up
    JOIN roles r ON up.role_id = r.id
    JOIN regions reg ON up.region_id = reg.id
    WHERE up.id = current_user_id;
    
    -- Get target user's region
    SELECT reg.code INTO target_region
    FROM user_profiles up
    JOIN regions reg ON up.region_id = reg.id
    WHERE up.id = target_user_id;
    
    RETURN QUERY
    SELECT 
        -- Can select check
        (current_user_id = target_user_id 
         OR current_role IN ('admin', 'super_admin')
         OR (current_role = 'manager' AND current_region = target_region)
         OR (current_role = 'viewer' AND current_region = target_region)) as can_select,
        
        -- Can update check
        (current_user_id = target_user_id
         OR current_role IN ('admin', 'super_admin')
         OR (current_role = 'manager' AND current_region = target_region AND current_user_id != target_user_id)) as can_update,
         
        -- Can delete check (typically admin only)
        (current_role IN ('admin', 'super_admin')) as can_delete,
        
        current_role as user_role,
        current_region as user_region,
        target_region as target_region;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
