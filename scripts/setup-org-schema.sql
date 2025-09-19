-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update agents table to include organization_id and role
ALTER TABLE agents ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'agent' CHECK (role IN ('owner', 'admin', 'agent'));
ALTER TABLE agents ADD COLUMN IF NOT EXISTS user_id UUID; -- This will link to Supabase auth.users

-- Update customers table to include organization_id
ALTER TABLE customers ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Update conversations table to include organization_id
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Update messages table to include organization_id
ALTER TABLE messages ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_agents_organization_id ON agents(organization_id);
CREATE INDEX IF NOT EXISTS idx_customers_organization_id ON customers(organization_id);
CREATE INDEX IF NOT EXISTS idx_conversations_organization_id ON conversations(organization_id);
CREATE INDEX IF NOT EXISTS idx_messages_organization_id ON messages(organization_id);

-- Enable RLS (Row Level Security)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations
CREATE POLICY "Users can view their organization" ON organizations
  FOR SELECT USING (
    id IN (
      SELECT organization_id FROM agents 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their organization" ON organizations
  FOR UPDATE USING (
    id IN (
      SELECT organization_id FROM agents 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- RLS Policies for agents
CREATE POLICY "Users can view agents in their organization" ON agents
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM agents 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can manage agents" ON agents
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM agents 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- RLS Policies for customers
CREATE POLICY "Users can view customers in their organization" ON customers
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM agents 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage customers in their organization" ON customers
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM agents 
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for conversations
CREATE POLICY "Users can view conversations in their organization" ON conversations
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM agents 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage conversations in their organization" ON conversations
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM agents 
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for messages
CREATE POLICY "Users can view messages in their organization" ON messages
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM agents 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage messages in their organization" ON messages
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM agents 
      WHERE user_id = auth.uid()
    )
  );
