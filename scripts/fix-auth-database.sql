-- Fix authentication database issues
-- Run this in your Supabase SQL Editor

-- 1. Temporarily disable RLS for all tables
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE agents DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- 2. Check if we have any existing data
SELECT 'organizations' as table_name, count(*) as count FROM organizations
UNION ALL
SELECT 'agents' as table_name, count(*) as count FROM agents
UNION ALL
SELECT 'customers' as table_name, count(*) as count FROM customers
UNION ALL
SELECT 'conversations' as table_name, count(*) as count FROM conversations
UNION ALL
SELECT 'messages' as table_name, count(*) as count FROM messages;

-- 3. Check if we have any users in auth.users
SELECT count(*) as user_count FROM auth.users;

-- 4. If you want to see all users (for debugging)
-- SELECT id, email, email_confirmed_at, created_at FROM auth.users;
