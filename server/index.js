const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const Database = require('./database');
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const { authenticateSocket } = require('./middleware/auth');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// Initialize database
const db = new Database();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/build')));

// Routes
app.use('/api/auth', authRoutes(db));
app.use('/api/chat', chatRoutes(db));

// Store active connections
const activeConnections = new Map();
const agentConnections = new Map();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Handle customer joining
  socket.on('join-customer', (customerData) => {
    const sessionId = customerData.sessionId || `session_${Date.now()}`;
    socket.join(sessionId);
    socket.sessionId = sessionId;
    socket.userType = 'customer';
    socket.customerName = customerData.name || 'Anonymous';
    
    activeConnections.set(socket.id, {
      sessionId,
      userType: 'customer',
      name: customerData.name || 'Anonymous',
      socketId: socket.id
    });

    // Notify agents of new customer
    socket.to('agents').emit('customer-joined', {
      sessionId,
      customerName: socket.customerName,
      timestamp: new Date()
    });

    socket.emit('session-created', { sessionId });
    console.log(`Customer ${socket.customerName} joined session ${sessionId}`);
  });

  // Handle agent joining
  socket.on('join-agent', async (agentData) => {
    try {
      // Verify agent authentication would happen here
      socket.join('agents');
      socket.userType = 'agent';
      socket.agentId = agentData.agentId;
      socket.agentName = agentData.name;
      
      agentConnections.set(socket.id, {
        agentId: agentData.agentId,
        name: agentData.name,
        socketId: socket.id
      });

      // Send list of active sessions to agent
      const activeSessions = Array.from(activeConnections.values())
        .filter(conn => conn.userType === 'customer')
        .map(conn => ({
          sessionId: conn.sessionId,
          customerName: conn.name,
          status: 'active'
        }));

      socket.emit('active-sessions', activeSessions);
      console.log(`Agent ${socket.agentName} connected`);
    } catch (error) {
      socket.emit('auth-error', { message: 'Authentication failed' });
    }
  });

  // Handle joining specific session (for agents)
  socket.on('join-session', (sessionId) => {
    socket.join(sessionId);
    console.log(`Socket ${socket.id} joined session ${sessionId}`);
  });

  // Handle new messages
  socket.on('send-message', async (messageData) => {
    try {
      const message = {
        id: `msg_${Date.now()}_${Math.random()}`,
        sessionId: messageData.sessionId,
        content: messageData.content,
        sender: messageData.sender,
        senderType: socket.userType,
        timestamp: new Date(),
        socketId: socket.id
      };

      // Save message to database
      await db.saveMessage(message);

      // Broadcast message to all users in the session
      io.to(messageData.sessionId).emit('new-message', message);

      // If customer message, notify agents
      if (socket.userType === 'customer') {
        socket.to('agents').emit('customer-message', {
          sessionId: messageData.sessionId,
          customerName: socket.customerName,
          message: message
        });
      }

      console.log(`Message sent in session ${messageData.sessionId}`);
    } catch (error) {
      console.error('Error saving message:', error);
      socket.emit('message-error', { message: 'Failed to send message' });
    }
  });

  // Handle typing indicators
  socket.on('typing', (data) => {
    socket.to(data.sessionId).emit('user-typing', {
      sessionId: data.sessionId,
      user: socket.userType === 'customer' ? socket.customerName : socket.agentName,
      userType: socket.userType
    });
  });

  socket.on('stop-typing', (data) => {
    socket.to(data.sessionId).emit('user-stop-typing', {
      sessionId: data.sessionId,
      user: socket.userType === 'customer' ? socket.customerName : socket.agentName,
      userType: socket.userType
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    const connection = activeConnections.get(socket.id);
    if (connection && connection.userType === 'customer') {
      // Notify agents that customer left
      socket.to('agents').emit('customer-left', {
        sessionId: connection.sessionId,
        customerName: connection.name
      });
    }
    
    activeConnections.delete(socket.id);
    agentConnections.delete(socket.id);
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Serve React app for any non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server ready for connections`);
});

module.exports = { app, io };