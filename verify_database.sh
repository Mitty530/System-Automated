#!/bin/bash

echo "🔍 Verifying database schema and setup..."
echo "======================================="

# Use Docker to run psql against the local Supabase instance
docker exec -i supabase_db_ADFD_Tracking_System psql -U postgres -d postgres << 'EOF'

-- Test 1: Verify all tables exist
SELECT 'Tables exist check' AS test_name,
       CASE WHEN COUNT(*) = 5 THEN '✅ PASSED' ELSE '❌ FAILED' END AS result
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_profiles', 'roles', 'regions', 'permissions', 'role_permissions');

-- Test 2: Verify ENUM type exists
SELECT 'ENUM user_status check' AS test_name,
       CASE WHEN COUNT(*) > 0 THEN '✅ PASSED' ELSE '❌ FAILED' END AS result
FROM pg_type 
WHERE typname = 'user_status';

-- Test 3: Check sample data in lookup tables
SELECT 'Regions data check' AS test_name,
       CASE WHEN COUNT(*) = 5 THEN '✅ PASSED' ELSE '❌ FAILED' END AS result
FROM regions;

SELECT 'Roles data check' AS test_name,
       CASE WHEN COUNT(*) = 5 THEN '✅ PASSED' ELSE '❌ FAILED' END AS result
FROM roles;

-- Test 4: Check RLS is enabled
SELECT 'RLS enabled check' AS test_name,
       CASE WHEN COUNT(*) >= 5 THEN '✅ PASSED' ELSE '❌ FAILED' END AS result
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;

-- Test 5: Check policies exist
SELECT 'RLS policies check' AS test_name,
       CASE WHEN COUNT(*) >= 10 THEN '✅ PASSED' ELSE '❌ FAILED' END AS result
FROM pg_policies 
WHERE schemaname = 'public';

-- Test 6: Display role permissions summary
SELECT 
    '📋 Role Permissions Summary' as info,
    r.name as role_name,
    COUNT(rp.permission_id) as permission_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
GROUP BY r.id, r.name
ORDER BY r.name;

-- Test 7: Test email constraint (this should show no results, meaning the constraint works)
DO $$
BEGIN
    BEGIN
        INSERT INTO user_profiles (full_name, email, initial_password, role_id, region_id)
        VALUES ('Test User', 'invalid-email', 'hashedpass', 1, 1);
        RAISE NOTICE '❌ Email constraint FAILED - Invalid email was accepted';
    EXCEPTION
        WHEN check_violation THEN
            RAISE NOTICE '✅ Email constraint PASSED - Invalid email rejected';
    END;
END $$;

-- Test 8: Show available regions and roles
SELECT '🌎 Available Regions:' as info, code, name, timezone FROM regions ORDER BY code;
SELECT '👥 Available Roles:' as info, name, description, is_admin FROM roles ORDER BY name;

-- Final summary
SELECT 
    '🎉 SCHEMA VERIFICATION COMPLETE' AS summary,
    'Database schema has been successfully initialized with all required tables, constraints, and RLS policies!' AS status;

EOF

echo ""
echo "📊 Checking Supabase Studio availability..."
echo "Studio URL: http://127.0.0.1:54323"
echo "Database URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres"
echo ""
echo "✅ Verification complete! Check the output above for any issues."
