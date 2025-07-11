const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs-extra');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// Store connected users
const users = new Map();

// Chat history configuration
const CHAT_HISTORY_FILE = path.join(__dirname, 'data', 'chat-history.json');
const MAX_HISTORY_MESSAGES = 100;

// Initialize chat history storage
async function initializeChatHistory() {
    try {
        await fs.ensureDir(path.dirname(CHAT_HISTORY_FILE));

        // Check if history file exists, if not create it
        if (!(await fs.pathExists(CHAT_HISTORY_FILE))) {
            await fs.writeJson(CHAT_HISTORY_FILE, []);
            console.log('Created new chat history file');
        }
    } catch (error) {
        console.error('Error initializing chat history:', error);
    }
}

// Load chat history from file
async function loadChatHistory() {
    try {
        const history = await fs.readJson(CHAT_HISTORY_FILE);
        return history || [];
    } catch (error) {
        console.error('Error loading chat history:', error);
        return [];
    }
}

// Save message to chat history
async function saveMessageToHistory(messageData) {
    try {
        const history = await loadChatHistory();

        // Add new message with unique ID and full timestamp
        const messageWithId = {
            id: Date.now() + Math.random(), // Simple unique ID
            ...messageData,
            fullTimestamp: new Date().toISOString(),
            savedAt: new Date().toISOString()
        };

        history.push(messageWithId);

        // Keep only the last MAX_HISTORY_MESSAGES
        if (history.length > MAX_HISTORY_MESSAGES) {
            history.splice(0, history.length - MAX_HISTORY_MESSAGES);
        }

        await fs.writeJson(CHAT_HISTORY_FILE, history, { spaces: 2 });
        console.log(`Saved message to history: ${messageData.nickname}: ${messageData.message}`);
    } catch (error) {
        console.error('Error saving message to history:', error);
    }
}

// Get recent chat history for new users
async function getRecentHistory(limit = 50) {
    try {
        const history = await loadChatHistory();
        return history.slice(-limit); // Get last 'limit' messages
    } catch (error) {
        console.error('Error getting recent history:', error);
        return [];
    }
}

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/chat', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Handle user joining
    socket.on('join', async (nickname) => {
        // Check if nickname is already taken
        const isNicknameTaken = Array.from(users.values()).some(user => user.nickname === nickname);
        
        if (isNicknameTaken) {
            socket.emit('nickname-taken');
            return;
        }

        // Store user info
        users.set(socket.id, {
            id: socket.id,
            nickname: nickname,
            joinedAt: new Date()
        });

        // Join the public room
        socket.join('public-room');

        // Notify user they joined successfully
        socket.emit('joined', nickname);

        // Broadcast to all users that someone joined
        socket.to('public-room').emit('user-joined', {
            nickname: nickname,
            message: `${nickname} joined the chat`
        });

        // Send current user list to the new user
        const userList = Array.from(users.values()).map(user => user.nickname);
        socket.emit('user-list', userList);

        // Send updated user list to all users
        io.to('public-room').emit('user-list', userList);

        // Send chat history to the new user
        try {
            const recentHistory = await getRecentHistory(50);
            if (recentHistory.length > 0) {
                socket.emit('chat-history', recentHistory);
            }
        } catch (error) {
            console.error('Error sending chat history to new user:', error);
        }

        console.log(`${nickname} joined the chat`);
    });

    // Handle chat messages
    socket.on('chat-message', async (data) => {
        const user = users.get(socket.id);
        if (user) {
            const messageData = {
                nickname: user.nickname,
                message: data.message,
                timestamp: new Date().toLocaleTimeString()
            };

            // Save message to history
            await saveMessageToHistory(messageData);

            // Broadcast message to all users in the public room
            io.to('public-room').emit('chat-message', messageData);
            console.log(`${user.nickname}: ${data.message}`);
        }
    });

    // Handle user typing
    socket.on('typing', () => {
        const user = users.get(socket.id);
        if (user) {
            socket.to('public-room').emit('user-typing', user.nickname);
        }
    });

    // Handle user stopped typing
    socket.on('stop-typing', () => {
        const user = users.get(socket.id);
        if (user) {
            socket.to('public-room').emit('user-stop-typing', user.nickname);
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        const user = users.get(socket.id);
        if (user) {
            // Remove user from users map
            users.delete(socket.id);

            // Notify others that user left
            socket.to('public-room').emit('user-left', {
                nickname: user.nickname,
                message: `${user.nickname} left the chat`
            });

            // Send updated user list to remaining users
            const userList = Array.from(users.values()).map(user => user.nickname);
            io.to('public-room').emit('user-list', userList);

            console.log(`${user.nickname} disconnected`);
        }
    });
});

// Initialize chat history and start server
async function startServer() {
    await initializeChatHistory();

    server.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
        console.log('Chat history persistence enabled');
    });
}

startServer().catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
});
