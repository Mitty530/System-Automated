-- Initial schema migration for ADFD Tracking System
-- Creates core tables with proper constraints, ENUMs, and lookup data

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create ENUM types first
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'pending', 'suspended');

-- Create regions lookup table
CREATE TABLE regions (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    timezone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create roles lookup table  
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create permissions table
CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    resource VARCHAR(100) NOT NULL, -- e.g., 'users', 'reports', 'settings'
    action VARCHAR(50) NOT NULL, -- e.g., 'create', 'read', 'update', 'delete'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create role_permissions junction table (Many-to-Many)
CREATE TABLE role_permissions (
    id SERIAL PRIMARY KEY,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
);

-- Create user_profiles table with proper constraints
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    initial_password VARCHAR(255) NOT NULL, -- Hashed password
    role_id INTEGER NOT NULL REFERENCES roles(id),
    region_id INTEGER NOT NULL REFERENCES regions(id),
    status user_status DEFAULT 'pending',
    permissions JSONB DEFAULT '{}',
    login_attempts INTEGER DEFAULT 0,
    last_login_at TIMESTAMP WITH TIME ZONE,
    updated_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add email uniqueness constraint (explicit for clarity)
ALTER TABLE user_profiles ADD CONSTRAINT unique_user_email UNIQUE (email);

-- Add check constraints
ALTER TABLE user_profiles ADD CONSTRAINT check_email_format 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE user_profiles ADD CONSTRAINT check_login_attempts_non_negative 
CHECK (login_attempts >= 0);

-- Insert sample regional data for Quandrox
INSERT INTO regions (code, name, description, timezone) VALUES
('NA', 'North America', 'United States and Canada', 'America/New_York'),
('EU', 'Europe', 'European Union countries', 'Europe/London'),
('APAC', 'Asia Pacific', 'Asia Pacific region', 'Asia/Singapore'),
('LATAM', 'Latin America', 'Central and South America', 'America/Mexico_City'),
('MEA', 'Middle East & Africa', 'Middle East and Africa', 'Asia/Dubai');

-- Insert initial roles
INSERT INTO roles (name, description, is_admin) VALUES
('user', 'Standard user with basic permissions', FALSE),
('admin', 'Administrator with elevated permissions', TRUE),
('super_admin', 'Super administrator with full system access', TRUE),
('manager', 'Regional manager with extended permissions', FALSE),
('viewer', 'Read-only access user', FALSE);

-- Insert sample permissions
INSERT INTO permissions (name, description, resource, action) VALUES
('user_read', 'Read user profiles', 'users', 'read'),
('user_create', 'Create new users', 'users', 'create'),
('user_update', 'Update user profiles', 'users', 'update'),
('user_delete', 'Delete user profiles', 'users', 'delete'),
('report_read', 'Read reports', 'reports', 'read'),
('report_create', 'Create reports', 'reports', 'create'),
('system_admin', 'Full system administration', 'system', 'admin'),
('region_manage', 'Manage regional data', 'regions', 'manage'),
('role_manage', 'Manage user roles', 'roles', 'manage');

-- Set up role permissions (Admin gets all permissions)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'admin';

-- Super admin gets all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'super_admin';

-- Manager gets read and regional management permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'manager' 
AND p.name IN ('user_read', 'report_read', 'region_manage', 'user_update');

-- Regular user gets basic read permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'user' 
AND p.name IN ('user_read', 'report_read');

-- Viewer gets only read permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'viewer' 
AND p.name IN ('user_read', 'report_read');

-- Create helper functions
CREATE OR REPLACE FUNCTION user_has_permission(user_id UUID, permission_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM user_profiles up
        JOIN role_permissions rp ON up.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE up.id = user_id 
        AND p.name = permission_name
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user's region
CREATE OR REPLACE FUNCTION get_user_region(user_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT region_id 
        FROM user_profiles 
        WHERE id = user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger function for updating timestamps and audit trail
CREATE OR REPLACE FUNCTION update_user_profile_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    -- Only set updated_by if auth.uid() is available (Supabase context)
    IF auth.uid() IS NOT NULL THEN
        NEW.updated_by = auth.uid();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER update_user_profile_timestamp_trigger
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_user_profile_timestamp();

-- Create indexes for performance
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_role_id ON user_profiles(role_id);
CREATE INDEX idx_user_profiles_region_id ON user_profiles(region_id);
CREATE INDEX idx_user_profiles_status ON user_profiles(status);
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);
