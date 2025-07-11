// Check if user has a nickname and password, if not redirect to login
const nickname = sessionStorage.getItem('nickname');
const password = sessionStorage.getItem('password');
if (!nickname || !password) {
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

// Join the chat room with credentials
socket.emit('join', { nickname, password });

// Socket event listeners
socket.on('joined', (userData) => {
    addSystemMessage(`You joined the chat as ${userData.nickname}`);
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

socket.on('chat-history', (historyMessages) => {
    loadChatHistory(historyMessages);
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


socket.on('force-logout', (reason) => {
    alert(reason || 'You have been logged out because someone else logged in with your credentials.');
    sessionStorage.clear();
    window.location.href = '/';
});

socket.on('login-failed', (reason) => {
    alert(reason || 'Login failed. Please check your credentials.');
    sessionStorage.clear();
    window.location.href = '/';
});

socket.on('disconnect', () => {
    addSystemMessage('Disconnected from server. Trying to reconnect...');
});

socket.on('reconnect', () => {
    addSystemMessage('Reconnected to server!');
    socket.emit('join', { nickname, password });
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
        sessionStorage.clear();
        socket.disconnect();
        window.location.href = '/';
    }
});

// Functions
function addChatMessage(data, isHistorical = false) {
    const messageEl = document.createElement('div');
    messageEl.className = 'message';

    const isOwnMessage = data.nickname === nickname;
    if (isOwnMessage) {
        messageEl.classList.add('own-message');
    }

    if (isHistorical) {
        messageEl.classList.add('historical-message');
    }

    messageEl.innerHTML = `
        <div class="message-header">
            <span class="message-nickname">${escapeHtml(data.nickname)}</span>
            <span class="message-time">${data.timestamp}</span>
        </div>
        <div class="message-content">${escapeHtml(data.message)}</div>
    `;

    messagesEl.appendChild(messageEl);
    if (!isHistorical) {
        scrollToBottom();
    }
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

function loadChatHistory(historyMessages) {
    if (!historyMessages || historyMessages.length === 0) {
        return;
    }

    // Add a separator for historical messages
    const separatorEl = document.createElement('div');
    separatorEl.className = 'message history-separator';
    separatorEl.innerHTML = `
        <div class="message-content">
            📜 Chat History (${historyMessages.length} messages)
        </div>
    `;
    messagesEl.appendChild(separatorEl);

    // Add historical messages
    historyMessages.forEach(message => {
        addChatMessage(message, true);
    });

    // Add another separator to mark end of history
    const endSeparatorEl = document.createElement('div');
    endSeparatorEl.className = 'message history-separator';
    endSeparatorEl.innerHTML = `
        <div class="message-content">
            ⬆️ End of chat history ⬆️
        </div>
    `;
    messagesEl.appendChild(endSeparatorEl);

    // Scroll to bottom after loading history
    scrollToBottom();
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
