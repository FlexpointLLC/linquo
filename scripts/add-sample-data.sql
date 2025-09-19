-- Add sample data for testing
-- Run this AFTER running clear-all-tables.sql

-- Insert a sample organization
INSERT INTO organizations (id, name, slug) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'Flexpoint LLC', 'flexpoint-llc');

-- Insert a sample agent (you'll need to replace the user_id with your actual user ID from auth.users)
-- First, let's see what users exist in auth.users
SELECT id, email FROM auth.users LIMIT 5;

-- Insert sample customers
INSERT INTO customers (id, name, email, website, status, organization_id) VALUES 
('550e8400-e29b-41d4-a716-446655440001', 'John Doe', 'john@example.com', 'example.com', 'active', '550e8400-e29b-41d4-a716-446655440000'),
('550e8400-e29b-41d4-a716-446655440002', 'Jane Smith', 'jane@company.com', 'company.com', 'solved', '550e8400-e29b-41d4-a716-446655440000'),
('550e8400-e29b-41d4-a716-446655440003', 'Bob Johnson', 'bob@startup.io', 'startup.io', 'trial', '550e8400-e29b-41d4-a716-446655440000');

-- Insert sample conversations
INSERT INTO conversations (id, customer_id, organization_id, status) VALUES 
('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'active'),
('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'solved'),
('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'active');

-- Insert sample messages
INSERT INTO messages (id, conversation_id, organization_id, author, name, text) VALUES 
('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440000', 'customer', 'John Doe', 'Hello, I need help with my account'),
('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440000', 'agent', 'Support Agent', 'Hi John! I can help you with that. What seems to be the issue?'),
('550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440000', 'customer', 'John Doe', 'I cannot log into my dashboard'),
('550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440000', 'customer', 'Jane Smith', 'Thank you for your help!'),
('550e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440000', 'agent', 'Support Agent', 'You are welcome! Let us know if you need anything else.'),
('550e8400-e29b-41d4-a716-446655440025', '550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440000', 'customer', 'Bob Johnson', 'I am interested in your premium plan');

-- Verify data was inserted
SELECT 'Sample data inserted successfully' as status;
SELECT 'Organizations:' as table_name, count(*) as count FROM organizations
UNION ALL
SELECT 'Agents:', count(*) FROM agents
UNION ALL
SELECT 'Customers:', count(*) FROM customers
UNION ALL
SELECT 'Conversations:', count(*) FROM conversations
UNION ALL
SELECT 'Messages:', count(*) FROM messages;
