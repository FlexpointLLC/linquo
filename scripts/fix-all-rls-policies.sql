-- Fix all RLS policies to allow signup process
-- This will temporarily disable RLS for signup-critical tables

-- 1. Disable RLS on organizations table (needed for signup)
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;

-- 2. Disable RLS on agents table (needed for signup)
ALTER TABLE agents DISABLE ROW LEVEL SECURITY;

-- 3. Keep RLS enabled on other tables for security
-- customers, conversations, messages still have RLS enabled

-- Note: After signup is working, we can re-enable RLS with proper policies
-- that don't cause recursion issues
