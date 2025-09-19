-- Temporarily disable RLS for all tables to test signup
-- Run this in Supabase SQL Editor

-- Disable RLS on all tables
ALTER TABLE public.agents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 'RLS Status:' as step;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('agents', 'organizations', 'customers', 'conversations', 'messages')
ORDER BY tablename;