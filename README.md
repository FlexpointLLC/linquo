# linquo

Real-time Customer Support Application

A modern, real-time customer support platform built with Node.js, React, and Socket.IO that enables seamless communication between customers and support agents.

## Features

- **Real-time messaging** with WebSocket support
- **Customer chat interface** for instant support requests
- **Agent dashboard** for managing multiple customer sessions
- **Message persistence** with SQLite database
- **Agent authentication** system
- **Typing indicators** for better user experience
- **Session management** and status tracking
- **Responsive design** for desktop and mobile

## Tech Stack

### Backend
- Node.js with Express
- Socket.IO for real-time communication
- SQLite for data persistence
- JWT for authentication
- bcryptjs for password hashing

### Frontend
- React with TypeScript
- Socket.IO client
- Styled Components for styling
- React Router for navigation
- Axios for HTTP requests

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/FlexpointLLC/linquo.git
cd linquo
```

2. Install dependencies for both backend and frontend:
```bash
npm run install-deps
```

3. Set up environment variables:
```bash
cp .env.example .env
```
Edit the `.env` file with your configuration.

### Development

1. Start both backend and frontend in development mode:
```bash
npm run dev
```

This will start:
- Backend server on http://localhost:3001
- Frontend development server on http://localhost:3000

2. Or start them separately:

Start the backend server:
```bash
npm run server
```

Start the frontend development server:
```bash
npm run client
```

### Production

1. Build the frontend:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

## Usage

### For Customers
1. Visit the application homepage
2. Click "Start Customer Chat"
3. Enter your name to begin a support session
4. Chat with available support agents in real-time

### For Support Agents
1. Go to `/agent/login`
2. Register a new agent account or login with existing credentials
3. Access the agent dashboard to see active customer sessions
4. Click on any session to start chatting with customers
5. Handle multiple customer conversations simultaneously

## API Endpoints

### Authentication
- `POST /api/auth/login` - Agent login
- `POST /api/auth/register` - Agent registration
- `GET /api/auth/verify` - Verify JWT token

### Chat
- `GET /api/chat/sessions` - Get active sessions (authenticated)
- `GET /api/chat/sessions/:sessionId/messages` - Get messages for a session
- `POST /api/chat/sessions` - Create a new session
- `PATCH /api/chat/sessions/:sessionId` - Update session status

### WebSocket Events

#### Client to Server
- `join-customer` - Customer joins with name
- `join-agent` - Agent joins with credentials
- `join-session` - Join specific session
- `send-message` - Send a message
- `typing` - Start typing indicator
- `stop-typing` - Stop typing indicator

#### Server to Client
- `session-created` - Session created for customer
- `new-message` - New message received
- `active-sessions` - List of active sessions
- `customer-joined` - New customer joined
- `customer-left` - Customer left session
- `user-typing` - User is typing
- `user-stop-typing` - User stopped typing

## Database Schema

### Messages
- `id` - Unique message identifier
- `session_id` - Session identifier
- `content` - Message content
- `sender` - Sender name
- `sender_type` - 'customer' or 'agent'
- `timestamp` - Message timestamp
- `socket_id` - Socket connection ID

### Sessions
- `id` - Unique session identifier
- `customer_name` - Customer name
- `status` - Session status ('active', 'closed')
- `created_at` - Session creation timestamp
- `updated_at` - Last update timestamp

### Agents
- `id` - Unique agent identifier
- `name` - Agent name
- `email` - Agent email (unique)
- `password_hash` - Hashed password
- `is_active` - Agent status
- `created_at` - Account creation timestamp

## Configuration

Environment variables:

- `PORT` - Server port (default: 3001)
- `JWT_SECRET` - Secret key for JWT tokens
- `DB_PATH` - SQLite database file path
- `CLIENT_URL` - Frontend URL for CORS (default: http://localhost:3000)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.