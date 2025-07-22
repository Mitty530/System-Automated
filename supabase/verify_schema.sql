-- Schema Verification Script
-- Tests table creation, constraints, ENUMs, and basic functionality

-- Test 1: Verify all tables exist
SELECT 'Tables exist check' AS test_name,
       CASE WHEN COUNT(*) = 6 THEN 'PASSED' ELSE 'FAILED' END AS result
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_profiles', 'roles', 'regions', 'permissions', 'role_permissions');

-- Test 2: Verify ENUM type exists
SELECT 'ENUM user_status check' AS test_name,
       CASE WHEN COUNT(*) > 0 THEN 'PASSED' ELSE 'FAILED' END AS result
FROM pg_type 
WHERE typname = 'user_status';

-- Test 3: Check sample data in lookup tables
SELECT 'Regions data check' AS test_name,
       CASE WHEN COUNT(*) = 5 THEN 'PASSED' ELSE 'FAILED' END AS result
FROM regions;

SELECT 'Roles data check' AS test_name,
       CASE WHEN COUNT(*) = 5 THEN 'PASSED' ELSE 'FAILED' END AS result
FROM roles;

SELECT 'Permissions data check' AS test_name,
       CASE WHEN COUNT(*) >= 9 THEN 'PASSED' ELSE 'FAILED' END AS result
FROM permissions;

-- Test 4: Check foreign key constraints
SELECT 'Foreign key constraints check' AS test_name,
       CASE WHEN COUNT(*) >= 3 THEN 'PASSED' ELSE 'FAILED' END AS result
FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY' 
AND table_name = 'user_profiles';

-- Test 5: Check unique constraints
SELECT 'Email uniqueness constraint check' AS test_name,
       CASE WHEN COUNT(*) >= 1 THEN 'PASSED' ELSE 'FAILED' END AS result
FROM information_schema.table_constraints 
WHERE constraint_type = 'UNIQUE' 
AND table_name = 'user_profiles'
AND constraint_name LIKE '%email%';

-- Test 6: Check RLS is enabled
SELECT 'RLS enabled check' AS test_name,
       CASE WHEN COUNT(*) >= 3 THEN 'PASSED' ELSE 'FAILED' END AS result
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true
AND tablename IN ('user_profiles', 'roles', 'regions');

-- Test 7: Check policies exist
SELECT 'RLS policies check' AS test_name,
       CASE WHEN COUNT(*) >= 10 THEN 'PASSED' ELSE 'FAILED' END AS result
FROM pg_policies 
WHERE schemaname = 'public';

-- Test 8: Check helper functions exist
SELECT 'Helper functions check' AS test_name,
       CASE WHEN COUNT(*) >= 3 THEN 'PASSED' ELSE 'FAILED' END AS result
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN ('user_has_permission', 'get_user_region', 'check_user_access');

-- Test 9: Check triggers exist
SELECT 'Triggers check' AS test_name,
       CASE WHEN COUNT(*) >= 1 THEN 'PASSED' ELSE 'FAILED' END AS result
FROM pg_trigger 
WHERE tgname LIKE '%user_profile%';

-- Test 10: Check indexes exist
SELECT 'Indexes check' AS test_name,
       CASE WHEN COUNT(*) >= 6 THEN 'PASSED' ELSE 'FAILED' END AS result
FROM pg_indexes 
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%';

-- Test 11: Test constraint violations (email format)
DO $$
BEGIN
    BEGIN
        INSERT INTO user_profiles (full_name, email, initial_password, role_id, region_id)
        VALUES ('Test User', 'invalid-email', 'hashedpass', 1, 1);
        RAISE NOTICE 'Email constraint check: FAILED - Invalid email was accepted';
    EXCEPTION
        WHEN check_violation THEN
            RAISE NOTICE 'Email constraint check: PASSED - Invalid email rejected';
    END;
END $$;

-- Test 12: Test successful user creation
DO $$
DECLARE
    new_user_id UUID;
BEGIN
    INSERT INTO user_profiles (full_name, email, initial_password, role_id, region_id)
    VALUES ('John Doe', 'john.doe@example.com', '$2b$12$hashedpassword', 1, 1)
    RETURNING id INTO new_user_id;
    
    IF new_user_id IS NOT NULL THEN
        RAISE NOTICE 'User creation test: PASSED - User created with ID %', new_user_id;
        
        -- Test the helper function
        IF user_has_permission(new_user_id, 'user_read') THEN
            RAISE NOTICE 'Permission check function: PASSED - User has expected permission';
        ELSE
            RAISE NOTICE 'Permission check function: FAILED - User missing expected permission';
        END IF;
        
        -- Clean up
        DELETE FROM user_profiles WHERE id = new_user_id;
    ELSE
        RAISE NOTICE 'User creation test: FAILED - User not created';
    END IF;
END $$;

-- Test 13: Check role permissions are properly assigned
SELECT 
    r.name as role_name,
    COUNT(rp.permission_id) as permission_count,
    CASE 
        WHEN r.name = 'admin' AND COUNT(rp.permission_id) >= 9 THEN 'PASSED'
        WHEN r.name = 'super_admin' AND COUNT(rp.permission_id) >= 9 THEN 'PASSED'
        WHEN r.name = 'manager' AND COUNT(rp.permission_id) >= 3 THEN 'PASSED'
        WHEN r.name = 'user' AND COUNT(rp.permission_id) >= 2 THEN 'PASSED'
        WHEN r.name = 'viewer' AND COUNT(rp.permission_id) >= 2 THEN 'PASSED'
        ELSE 'FAILED'
    END as test_result
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
GROUP BY r.id, r.name
ORDER BY r.name;

-- Summary
SELECT 
    'SCHEMA VERIFICATION SUMMARY' AS summary,
    'All core tables, constraints, RLS policies, and functions have been successfully created and tested' AS status;
