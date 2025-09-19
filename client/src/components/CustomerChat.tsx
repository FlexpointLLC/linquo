import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import socketService from '../services/socket';
import { chatService } from '../services/api';
import { Message } from '../types';

const Container = styled.div`
  min-height: 100vh;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  background: #667eea;
  color: white;
  padding: 1rem;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const ChatContainer = styled.div`
  flex: 1;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 10px;
  margin-top: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  overflow: hidden;
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  max-height: 400px;
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
  border-top: 1px solid #eee;
  background: #fafafa;
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

const NameInputContainer = styled.div`
  padding: 2rem;
  text-align: center;
`;

const NameInput = styled.input`
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 5px;
  margin-right: 1rem;
  font-size: 1rem;
`;

const StartButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;

  &:hover {
    background: #5a67d8;
  }
`;

const TypingIndicator = styled.div`
  padding: 0.5rem 1rem;
  font-style: italic;
  color: #666;
  font-size: 0.9rem;
`;

const CustomerChat: React.FC = () => {
  const [customerName, setCustomerName] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startChat = () => {
    if (!customerName.trim()) return;

    const socket = socketService.connect();
    
    socket.on('connect', () => {
      setConnected(true);
      socketService.joinAsCustomer({ name: customerName });
    });

    socketService.onSessionCreated((data) => {
      setSessionId(data.sessionId);
      chatService.createSession(data.sessionId, customerName);
    });

    socketService.onMessage((message) => {
      setMessages(prev => [...prev, {
        ...message,
        timestamp: new Date(message.timestamp)
      }]);
    });

    socketService.onTyping((data) => {
      if (data.userType === 'agent') {
        setTypingUser(data.user);
      }
    });

    socketService.onStopTyping((data) => {
      if (data.userType === 'agent') {
        setTypingUser(null);
      }
    });

    socketService.onError((error) => {
      console.error('Socket error:', error);
    });
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !sessionId || !connected) return;

    socketService.sendMessage(sessionId, newMessage, customerName);
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  const handleTyping = () => {
    if (!isTyping && sessionId) {
      setIsTyping(true);
      socketService.startTyping(sessionId);
      
      setTimeout(() => {
        setIsTyping(false);
        socketService.stopTyping(sessionId);
      }, 1000);
    }
  };

  if (!sessionId) {
    return (
      <Container>
        <Header>
          <h2>Customer Support Chat</h2>
        </Header>
        <ChatContainer>
          <NameInputContainer>
            <h3>Start a conversation</h3>
            <p>Please enter your name to begin chatting with our support team.</p>
            <div style={{ marginTop: '1rem' }}>
              <NameInput
                type="text"
                placeholder="Your name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && startChat()}
              />
              <StartButton onClick={startChat}>
                Start Chat
              </StartButton>
            </div>
          </NameInputContainer>
        </ChatContainer>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <h2>Customer Support Chat</h2>
        <p>Session: {sessionId}</p>
      </Header>
      <ChatContainer>
        <MessagesContainer>
          {messages.map((message) => (
            <MessageBubble key={message.id} isOwn={message.senderType === 'customer'}>
              <div>
                <MessageContent isOwn={message.senderType === 'customer'}>
                  {message.content}
                </MessageContent>
                <MessageInfo isOwn={message.senderType === 'customer'}>
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
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            onKeyPress={handleKeyPress}
            disabled={!connected}
          />
          <SendButton onClick={sendMessage} disabled={!connected || !newMessage.trim()}>
            Send
          </SendButton>
        </InputContainer>
      </ChatContainer>
    </Container>
  );
};

export default CustomerChat;