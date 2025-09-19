-- Test the signup process step by step
-- This will help us identify where the signup is failing

-- 1. Check if RLS is enabled on any tables
SELECT 'RLS Status:' as info;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('organizations', 'agents', 'customers', 'conversations', 'messages')
AND schemaname = 'public';

-- 2. Check if there are any RLS policies
SELECT 'RLS Policies:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('organizations', 'agents', 'customers', 'conversations', 'messages')
AND schemaname = 'public';

-- 3. Test inserting into organizations table
SELECT 'Testing organization insert...' as info;
INSERT INTO organizations (name, slug) VALUES ('Test Org', 'test-org') RETURNING *;

-- 4. Test inserting into agents table (you'll need to replace the user_id)
SELECT 'Testing agent insert...' as info;
-- First, get a user ID from auth.users
SELECT 'Available users:' as info;
SELECT id, email FROM auth.users LIMIT 1;

-- Then test agent insert (replace USER_ID_HERE with actual user ID)
-- INSERT INTO agents (name, email, role, organization_id, user_id) 
-- VALUES ('Test Agent', 'test@example.com', 'owner', (SELECT id FROM organizations WHERE slug = 'test-org'), 'USER_ID_HERE') 
-- RETURNING *;

-- 5. Clean up test data
DELETE FROM organizations WHERE slug = 'test-org';
