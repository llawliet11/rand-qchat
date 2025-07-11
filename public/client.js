// Check if user has a nickname, if not redirect to login
const nickname = sessionStorage.getItem('nickname');
if (!nickname) {
    window.location.href = '/';
}

// Initialize socket connection
const socket = io();

// DOM elements
const userNicknameEl = document.getElementById('user-nickname');
const onlineCountEl = document.getElementById('online-count');
const userListEl = document.getElementById('user-list');
const messagesEl = document.getElementById('messages');
const typingIndicatorEl = document.getElementById('typing-indicator');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const logoutBtn = document.getElementById('logout-btn');

// State
let isTyping = false;
let typingTimer;
const typingUsers = new Set();

// Initialize
userNicknameEl.textContent = `Welcome, ${nickname}!`;
messageInput.focus();

// Join the chat room
socket.emit('join', nickname);

// Socket event listeners
socket.on('joined', (joinedNickname) => {
    addSystemMessage(`You joined the chat as ${joinedNickname}`);
});

socket.on('user-joined', (data) => {
    addSystemMessage(data.message);
});

socket.on('user-left', (data) => {
    addSystemMessage(data.message);
});

socket.on('user-list', (users) => {
    updateUserList(users);
    updateOnlineCount(users.length);
});

socket.on('chat-message', (data) => {
    addChatMessage(data);
});

socket.on('user-typing', (typingNickname) => {
    if (typingNickname !== nickname) {
        typingUsers.add(typingNickname);
        updateTypingIndicator();
    }
});

socket.on('user-stop-typing', (typingNickname) => {
    typingUsers.delete(typingNickname);
    updateTypingIndicator();
});

socket.on('nickname-taken', () => {
    alert('Nickname is already taken. Please choose another one.');
    window.location.href = '/';
});

socket.on('disconnect', () => {
    addSystemMessage('Disconnected from server. Trying to reconnect...');
});

socket.on('reconnect', () => {
    addSystemMessage('Reconnected to server!');
    socket.emit('join', nickname);
});

// Form submission
messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const message = messageInput.value.trim();
    if (!message) return;

    // Send message
    socket.emit('chat-message', { message });
    
    // Clear input
    messageInput.value = '';
    
    // Stop typing indicator
    if (isTyping) {
        socket.emit('stop-typing');
        isTyping = false;
    }
});

// Typing indicator
messageInput.addEventListener('input', () => {
    if (!isTyping) {
        isTyping = true;
        socket.emit('typing');
    }
    
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
        if (isTyping) {
            socket.emit('stop-typing');
            isTyping = false;
        }
    }, 1000);
});

// Logout functionality
logoutBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to logout?')) {
        sessionStorage.removeItem('nickname');
        socket.disconnect();
        window.location.href = '/';
    }
});

// Functions
function addChatMessage(data) {
    const messageEl = document.createElement('div');
    messageEl.className = 'message';
    
    const isOwnMessage = data.nickname === nickname;
    if (isOwnMessage) {
        messageEl.classList.add('own-message');
    }
    
    messageEl.innerHTML = `
        <div class="message-header">
            <span class="message-nickname">${escapeHtml(data.nickname)}</span>
            <span class="message-time">${data.timestamp}</span>
        </div>
        <div class="message-content">${escapeHtml(data.message)}</div>
    `;
    
    messagesEl.appendChild(messageEl);
    scrollToBottom();
}

function addSystemMessage(message) {
    const messageEl = document.createElement('div');
    messageEl.className = 'message system-message';
    messageEl.innerHTML = `<div class="message-content">${escapeHtml(message)}</div>`;
    
    messagesEl.appendChild(messageEl);
    scrollToBottom();
}

function updateUserList(users) {
    userListEl.innerHTML = '';
    
    users.forEach(user => {
        const userEl = document.createElement('li');
        userEl.className = 'user-item';
        if (user === nickname) {
            userEl.classList.add('current-user');
        }
        userEl.textContent = user;
        userListEl.appendChild(userEl);
    });
}

function updateOnlineCount(count) {
    onlineCountEl.textContent = `${count} online`;
}

function updateTypingIndicator() {
    if (typingUsers.size === 0) {
        typingIndicatorEl.style.display = 'none';
        return;
    }
    
    const typingArray = Array.from(typingUsers);
    let text = '';
    
    if (typingArray.length === 1) {
        text = `${typingArray[0]} is typing...`;
    } else if (typingArray.length === 2) {
        text = `${typingArray[0]} and ${typingArray[1]} are typing...`;
    } else {
        text = `${typingArray.length} people are typing...`;
    }
    
    typingIndicatorEl.textContent = text;
    typingIndicatorEl.style.display = 'block';
}

function scrollToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Handle page visibility change
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        messageInput.focus();
    }
});
