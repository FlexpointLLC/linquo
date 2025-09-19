-- Fix missing agent record for existing user
-- Run this AFTER checking what user exists in auth.users

-- First, let's see what users exist
SELECT 'Users in auth.users:' as info;
SELECT id, email, email_confirmed_at, created_at FROM auth.users;

-- Check if any organizations exist
SELECT 'Organizations:' as info;
SELECT * FROM organizations;

-- Check if any agents exist
SELECT 'Agents:' as info;
SELECT * FROM agents;

-- If you have a user but no organization/agent, you can create them manually
-- Replace 'YOUR_USER_ID_HERE' with the actual user ID from the query above
-- Replace 'YOUR_EMAIL_HERE' with your actual email
-- Replace 'YOUR_NAME_HERE' with your actual name

-- Example (uncomment and modify these lines):
/*
INSERT INTO organizations (id, name, slug) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'Your Company Name', 'your-company-slug');

INSERT INTO agents (id, name, email, role, organization_id, user_id) VALUES 
('550e8400-e29b-41d4-a716-446655440001', 'Your Name', 'your@email.com', 'owner', '550e8400-e29b-41d4-a716-446655440000', 'YOUR_USER_ID_HERE');
*/
