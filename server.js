const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// Store connected users
const users = new Map();

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
    socket.on('join', (nickname) => {
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

        console.log(`${nickname} joined the chat`);
    });

    // Handle chat messages
    socket.on('chat-message', (data) => {
        const user = users.get(socket.id);
        if (user) {
            const messageData = {
                nickname: user.nickname,
                message: data.message,
                timestamp: new Date().toLocaleTimeString()
            };

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

// Start server
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
