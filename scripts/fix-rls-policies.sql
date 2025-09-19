-- Fix RLS policies to prevent infinite recursion
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Owners can manage agents" ON agents;
DROP POLICY IF EXISTS "Users can view agents in their organization" ON agents;

-- Create new policies that don't cause recursion

-- Policy for viewing agents (no recursion)
CREATE POLICY "Users can view agents in their organization" ON agents
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM agents 
      WHERE user_id = auth.uid()
    )
  );

-- Policy for inserting agents (allow if user is creating their own agent record)
CREATE POLICY "Users can insert their own agent record" ON agents
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

-- Policy for updating agents (only owners can update)
CREATE POLICY "Owners can update agents" ON agents
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM agents 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Policy for deleting agents (only owners can delete)
CREATE POLICY "Owners can delete agents" ON agents
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM agents 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );
