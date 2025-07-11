# L4D2 QChat - Project Documentation

## 📋 Project Overview

**L4D2 QChat** is a real-time chat application built with Node.js, Express.js, and Socket.IO. It provides a simple, public chat room where users can join with just a nickname and chat in real-time.

### 🎯 Core Features
- **Simple Authentication**: Nickname-only login (no complex registration)
- **Real-time Messaging**: Instant chat using Socket.IO
- **Public Chat Room**: Single room where all users communicate
- **User Management**: Online user list and join/leave notifications
- **Typing Indicators**: Shows when users are typing
- **Chat History Persistence**: Messages are saved and loaded for new users
- **Responsive Design**: Works on desktop and mobile devices
- **Docker Support**: Containerized deployment with Docker Compose

## 🏗️ Technical Architecture

### Backend Stack
- **Node.js 18**: Runtime environment
- **Express.js 5.1.0**: Web framework
- **Socket.IO 4.8.1**: Real-time bidirectional communication
- **fs-extra**: Enhanced file system operations for chat history

### Frontend Stack
- **Vanilla JavaScript**: Client-side logic
- **HTML5**: Semantic markup
- **CSS3**: Modern styling with flexbox and responsive design
- **Socket.IO Client**: Real-time communication

### Infrastructure
- **Docker**: Containerization
- **Docker Compose**: Multi-container orchestration
- **Alpine Linux**: Lightweight container base
- **File-based Storage**: JSON files for chat history persistence

## 📁 Project Structure

```
l4d2-qchat/
├── server.js              # Main Express + Socket.IO server
├── package.json           # Dependencies and scripts
├── package-lock.json      # Dependency lock file
├── Dockerfile             # Container build instructions
├── docker-compose.yml     # Multi-container configuration
├── .gitignore            # Git ignore rules
├── .dockerignore         # Docker build ignore rules
├── CLAUDE.md             # This documentation file
├── public/               # Static frontend files
│   ├── index.html        # Login page
│   ├── chat.html         # Chat interface
│   ├── client.js         # Client-side JavaScript
│   └── style.css         # Styling
├── data/                 # Chat history storage (auto-created)
│   └── chat-history.json # Persistent chat messages
└── logs/                 # Application logs (auto-created)
```

## 🔧 Configuration

### Environment Variables
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment mode (production/development)

### Chat History Settings
- **Max History Messages**: 100 messages stored
- **History Sent to New Users**: Last 50 messages
- **Storage Format**: JSON file with message metadata

## 🚀 Deployment

### Local Development
```bash
npm install
npm start
# Access at http://localhost:3000
```

### Docker Deployment
```bash
# Build and start
docker-compose up -d --build

# View logs
docker-compose logs -f l4d2-qchat

# Stop
docker-compose down
```

### Docker Features
- **Security**: Non-root user execution (nodejs:1001)
- **Health Checks**: Automatic application monitoring
- **Restart Policy**: Auto-restart on failure
- **Volume Persistence**: Chat history and logs preserved
- **Network Isolation**: Internal Docker network (no exposed ports)

## 📊 Data Flow

### User Join Process
1. User enters nickname on login page
2. Client validates nickname locally
3. Socket connection established
4. Server checks nickname uniqueness
5. User joins 'public-room'
6. Chat history sent to new user
7. User list updated for all clients

### Message Flow
1. User types message in chat interface
2. Client sends message via Socket.IO
3. Server validates user session
4. Message saved to chat history file
5. Message broadcasted to all users in room
6. All clients display message in real-time

## ✅ Completed Features

### Phase 1: Core Chat Application ✅
- [x] Express.js server setup
- [x] Socket.IO integration
- [x] Simple nickname authentication
- [x] Real-time messaging
- [x] Public chat room
- [x] User join/leave notifications
- [x] Online user list
- [x] Typing indicators
- [x] Responsive web interface
- [x] Message timestamps
- [x] Logout functionality

### Phase 2: Docker Integration ✅
- [x] Dockerfile creation
- [x] Docker Compose configuration
- [x] Security hardening (non-root user)
- [x] Health checks
- [x] Volume mounting for logs
- [x] Network isolation (no exposed ports)
- [x] Production-ready configuration

### Phase 3: Chat History Persistence ✅
- [x] File-based message storage
- [x] Chat history loading for new users
- [x] Message persistence with metadata
- [x] Historical message styling
- [x] History separators in UI
- [x] Automatic history cleanup (max 100 messages)
- [x] Docker volume for data persistence

## 🔄 Current Status

**Status**: ✅ **FULLY FUNCTIONAL**

The application is currently running in Docker with all core features implemented:
- Real-time chat working
- Chat history persistence active
- Docker deployment successful
- All tests passing

## 📝 TODO List & Future Enhancements

### High Priority 🔴
- [ ] **Message Editing**: Allow users to edit their recent messages
- [ ] **Message Deletion**: Allow users to delete their messages
- [ ] **File Upload**: Support for image/file sharing
- [ ] **Emoji Support**: Emoji picker and reactions
- [ ] **Private Messages**: Direct messaging between users

### Medium Priority 🟡
- [ ] **Multiple Rooms**: Create and join different chat rooms
- [ ] **User Roles**: Admin/moderator capabilities
- [ ] **Message Search**: Search through chat history
- [ ] **User Profiles**: Avatar and status messages
- [ ] **Notification System**: Browser notifications for new messages
- [ ] **Rate Limiting**: Prevent spam and abuse
- [ ] **Profanity Filter**: Content moderation

### Low Priority 🟢
- [ ] **Database Integration**: Replace file storage with PostgreSQL/MongoDB
- [ ] **Redis Integration**: Session management and scaling
- [ ] **API Endpoints**: REST API for external integrations
- [ ] **Mobile App**: React Native or Flutter mobile client
- [ ] **Voice Chat**: WebRTC voice communication
- [ ] **Screen Sharing**: Share screen functionality
- [ ] **Bot Integration**: Chatbot support
- [ ] **Themes**: Dark/light mode and custom themes

### DevOps & Infrastructure 🔵
- [ ] **CI/CD Pipeline**: GitHub Actions for automated deployment
- [ ] **Monitoring**: Application performance monitoring
- [ ] **Logging**: Structured logging with log aggregation
- [ ] **Backup System**: Automated chat history backups
- [ ] **Load Balancing**: Support for multiple server instances
- [ ] **SSL/TLS**: HTTPS support with certificates
- [ ] **Environment Management**: Development/staging/production environments

## 🐛 Known Issues

### Current Issues
- None reported

### Potential Improvements
- Chat history could be optimized for very large message volumes
- File storage could be replaced with database for better scalability
- Message delivery confirmation could be added
- Reconnection handling could be improved

## 🔒 Security Considerations

### Implemented
- ✅ Non-root Docker container execution
- ✅ Input sanitization (HTML escaping)
- ✅ No exposed ports in Docker setup
- ✅ Session validation for message sending

### Recommended Additions
- [ ] Rate limiting for message sending
- [ ] Input validation and sanitization
- [ ] CSRF protection
- [ ] Content Security Policy (CSP)
- [ ] User authentication with JWT tokens
- [ ] Message encryption for sensitive data

## 📈 Performance Notes

### Current Performance
- **Message Throughput**: Suitable for small to medium groups (< 100 concurrent users)
- **Storage**: File-based storage suitable for moderate message volumes
- **Memory Usage**: Minimal with current user storage in memory
- **Network**: Efficient Socket.IO binary protocol

### Scaling Considerations
- For > 100 concurrent users: Consider Redis for session management
- For > 1000 messages/day: Consider database migration
- For multiple servers: Implement Socket.IO Redis adapter

## 🤝 Contributing

### Development Setup
1. Clone repository
2. Run `npm install`
3. Start with `npm start`
4. Access at `http://localhost:3000`

### Code Style
- Use ES6+ features
- Follow existing naming conventions
- Add comments for complex logic
- Test changes thoroughly

---

**Last Updated**: 2025-07-11  
**Version**: 1.1.0 (with chat history persistence)  
**Maintainer**: LLAWLIET (llawliet11)
