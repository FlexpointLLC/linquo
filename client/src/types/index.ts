export interface Message {
  id: string;
  sessionId: string;
  content: string;
  sender: string;
  senderType: 'customer' | 'agent';
  timestamp: Date;
  socketId?: string;
}

export interface Session {
  id: string;
  customerName: string;
  status: 'active' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

export interface Agent {
  id: string;
  name: string;
  email: string;
}

export interface CustomerData {
  sessionId?: string;
  name: string;
}

export interface TypingData {
  sessionId: string;
  user: string;
  userType: 'customer' | 'agent';
}