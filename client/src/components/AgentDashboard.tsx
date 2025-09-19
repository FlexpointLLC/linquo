import React, { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import socketService from '../services/socket';
import { chatService } from '../services/api';
import { Message } from '../types';

const Container = styled.div`
  min-height: 100vh;
  background: #f5f5f5;
  display: flex;
`;

const Sidebar = styled.div`
  width: 300px;
  background: white;
  border-right: 1px solid #eee;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  padding: 1rem;
  background: #667eea;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const LogoutButton = styled.button`
  background: rgba(255,255,255,0.2);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  cursor: pointer;

  &:hover {
    background: rgba(255,255,255,0.3);
  }
`;

const SessionsList = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const SessionItem = styled.div<{ active: boolean }>`
  padding: 1rem;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  background: ${props => props.active ? '#f0f8ff' : 'white'};
  
  &:hover {
    background: #f8f9fa;
  }
`;

const CustomerName = styled.div`
  font-weight: 600;
  margin-bottom: 0.25rem;
`;

const SessionInfo = styled.div`
  font-size: 0.8rem;
  color: #666;
`;

const ChatArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const ChatHeader = styled.div`
  padding: 1rem;
  background: white;
  border-bottom: 1px solid #eee;
  font-weight: 600;
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  background: #fafafa;
`;

const MessageBubble = styled.div<{ isOwn: boolean }>`
  margin: 0.5rem 0;
  display: flex;
  justify-content: ${props => props.isOwn ? 'flex-end' : 'flex-start'};
`;

const MessageContent = styled.div<{ isOwn: boolean }>`
  max-width: 70%;
  padding: 0.75rem 1rem;
  border-radius: 18px;
  background: ${props => props.isOwn ? '#667eea' : '#e9ecef'};
  color: ${props => props.isOwn ? 'white' : '#333'};
  word-wrap: break-word;
`;

const MessageInfo = styled.div<{ isOwn: boolean }>`
  font-size: 0.75rem;
  opacity: 0.7;
  margin-top: 0.25rem;
  text-align: ${props => props.isOwn ? 'right' : 'left'};
`;

const InputContainer = styled.div`
  display: flex;
  padding: 1rem;
  background: white;
  border-top: 1px solid #eee;
`;

const MessageInput = styled.input`
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 20px;
  outline: none;
  font-size: 1rem;

  &:focus {
    border-color: #667eea;
  }
`;

const SendButton = styled.button`
  margin-left: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: 1rem;

  &:hover {
    background: #5a67d8;
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  font-size: 1.1rem;
`;

const TypingIndicator = styled.div`
  padding: 0.5rem 1rem;
  font-style: italic;
  color: #666;
  font-size: 0.9rem;
`;

const AgentDashboard: React.FC = () => {
  const { agent, logout, isAuthenticated } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!isAuthenticated || !agent) return;

    const token = localStorage.getItem('authToken');
    const socket = socketService.connect(token);

    socket.on('connect', () => {
      setConnected(true);
      socketService.joinAsAgent({
        agentId: agent.id,
        name: agent.name
      });
    });

    socketService.onActiveSessions((activeSessions) => {
      setSessions(activeSessions);
    });

    socketService.onCustomerJoined((data) => {
      setSessions(prev => [...prev, {
        sessionId: data.sessionId,
        customerName: data.customerName,
        status: 'active'
      }]);
    });

    socketService.onCustomerLeft((data) => {
      setSessions(prev => prev.filter(s => s.sessionId !== data.sessionId));
      if (activeSession === data.sessionId) {
        setActiveSession(null);
        setMessages([]);
      }
    });

    socketService.onMessage((message) => {
      setMessages(prev => [...prev, {
        ...message,
        timestamp: new Date(message.timestamp)
      }]);
    });

    socketService.onTyping((data) => {
      if (data.userType === 'customer' && data.sessionId === activeSession) {
        setTypingUser(data.user);
      }
    });

    socketService.onStopTyping((data) => {
      if (data.userType === 'customer' && data.sessionId === activeSession) {
        setTypingUser(null);
      }
    });

    return () => {
      socketService.disconnect();
    };
  }, [isAuthenticated, agent, activeSession]);

  const selectSession = async (sessionId: string) => {
    setActiveSession(sessionId);
    socketService.joinSession(sessionId);
    
    try {
      const sessionMessages = await chatService.getMessages(sessionId);
      setMessages(sessionMessages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      })));
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !activeSession || !connected || !agent) return;

    socketService.sendMessage(activeSession, newMessage, agent.name);
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  if (!isAuthenticated) {
    return <Navigate to="/agent/login" replace />;
  }

  return (
    <Container>
      <Sidebar>
        <Header>
          <div>
            <div>Agent Dashboard</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
              {agent?.name}
            </div>
          </div>
          <LogoutButton onClick={logout}>
            Logout
          </LogoutButton>
        </Header>
        
        <SessionsList>
          {sessions.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
              No active sessions
            </div>
          ) : (
            sessions.map((session) => (
              <SessionItem
                key={session.sessionId}
                active={activeSession === session.sessionId}
                onClick={() => selectSession(session.sessionId)}
              >
                <CustomerName>{session.customerName}</CustomerName>
                <SessionInfo>
                  Session: {session.sessionId.slice(0, 8)}...
                </SessionInfo>
              </SessionItem>
            ))
          )}
        </SessionsList>
      </Sidebar>

      <ChatArea>
        {activeSession ? (
          <>
            <ChatHeader>
              Chat with {sessions.find(s => s.sessionId === activeSession)?.customerName}
            </ChatHeader>
            
            <MessagesContainer>
              {messages.map((message) => (
                <MessageBubble key={message.id} isOwn={message.senderType === 'agent'}>
                  <div>
                    <MessageContent isOwn={message.senderType === 'agent'}>
                      {message.content}
                    </MessageContent>
                    <MessageInfo isOwn={message.senderType === 'agent'}>
                      {message.sender} • {new Date(message.timestamp).toLocaleTimeString()}
                    </MessageInfo>
                  </div>
                </MessageBubble>
              ))}
              {typingUser && (
                <TypingIndicator>
                  {typingUser} is typing...
                </TypingIndicator>
              )}
              <div ref={messagesEndRef} />
            </MessagesContainer>
            
            <InputContainer>
              <MessageInput
                type="text"
                placeholder="Type your reply..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={!connected}
              />
              <SendButton 
                onClick={sendMessage} 
                disabled={!connected || !newMessage.trim()}
              >
                Send
              </SendButton>
            </InputContainer>
          </>
        ) : (
          <EmptyState>
            Select a customer session to start chatting
          </EmptyState>
        )}
      </ChatArea>
    </Container>
  );
};

export default AgentDashboard;