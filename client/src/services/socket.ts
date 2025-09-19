import { io, Socket } from 'socket.io-client';
import { Message, CustomerData, TypingData } from '../types';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';

class SocketService {
  private socket: Socket | null = null;

  connect(token?: string | null): Socket {
    this.socket = io(SOCKET_URL, {
      auth: {
        token: token || undefined
      }
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  // Customer methods
  joinAsCustomer(customerData: CustomerData) {
    if (this.socket) {
      this.socket.emit('join-customer', customerData);
    }
  }

  // Agent methods
  joinAsAgent(agentData: { agentId: string; name: string }) {
    if (this.socket) {
      this.socket.emit('join-agent', agentData);
    }
  }

  joinSession(sessionId: string) {
    if (this.socket) {
      this.socket.emit('join-session', sessionId);
    }
  }

  // Messaging
  sendMessage(sessionId: string, content: string, sender: string) {
    if (this.socket) {
      this.socket.emit('send-message', {
        sessionId,
        content,
        sender
      });
    }
  }

  // Typing indicators
  startTyping(sessionId: string) {
    if (this.socket) {
      this.socket.emit('typing', { sessionId });
    }
  }

  stopTyping(sessionId: string) {
    if (this.socket) {
      this.socket.emit('stop-typing', { sessionId });
    }
  }

  // Event listeners
  onMessage(callback: (message: Message) => void) {
    if (this.socket) {
      this.socket.on('new-message', callback);
    }
  }

  onSessionCreated(callback: (data: { sessionId: string }) => void) {
    if (this.socket) {
      this.socket.on('session-created', callback);
    }
  }

  onCustomerJoined(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('customer-joined', callback);
    }
  }

  onCustomerLeft(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('customer-left', callback);
    }
  }

  onActiveSessions(callback: (sessions: any[]) => void) {
    if (this.socket) {
      this.socket.on('active-sessions', callback);
    }
  }

  onTyping(callback: (data: TypingData) => void) {
    if (this.socket) {
      this.socket.on('user-typing', callback);
    }
  }

  onStopTyping(callback: (data: TypingData) => void) {
    if (this.socket) {
      this.socket.on('user-stop-typing', callback);
    }
  }

  onError(callback: (error: any) => void) {
    if (this.socket) {
      this.socket.on('connect_error', callback);
      this.socket.on('auth-error', callback);
      this.socket.on('message-error', callback);
    }
  }

  // Remove listeners
  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }
}

const socketService = new SocketService();
export default socketService;