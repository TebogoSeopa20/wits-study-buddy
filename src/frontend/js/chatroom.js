// chatroom.js - Complete implementation with real API integration
document.addEventListener('DOMContentLoaded', function() {
    // API configuration
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const API_BASE_URL = isLocal 
        ? 'http://localhost:3000/api' 
        : 'https://wits-buddy-g9esajarfqe3dmh6.southafricanorth-01.azurewebsites.net/api';
    
    const PROFILES_API_URL = `${API_BASE_URL}/profiles`;
    const CONNECTIONS_API_URL = `${API_BASE_URL}/connections`;
    
    // Initialize chatroom
    initChatroom();
    
    // Event listeners
    setupEventListeners();
    
    // Load conversations
    loadConversations();
});

// API configuration
function getApiBaseUrl() {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    return isLocal 
        ? 'http://localhost:3000/api' 
        : 'https://wits-buddy-g9esajarfqe3dmh6.southafricanorth-01.azurewebsites.net/api';
}

// Check if user is authenticated
function isAuthenticated() {
    try {
        const userData = sessionStorage.getItem('user');
        return userData !== null;
    } catch (error) {
        console.error('Error checking authentication:', error);
        return false;
    }
}

// Get current user data
function getCurrentUser() {
    try {
        const userData = sessionStorage.getItem('user');
        return userData ? JSON.parse(userData) : null;
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
}
// Update chatroom stats
async function updateChatroomStats() {
    try {
        const connections = await getConnectionsData();
        const conversations = await getConversationsData();
        const currentUserId = window.currentUser.id;
        
        // Count connected users (status: connected)
        const connectedCount = connections.filter(conn => 
            (conn.userId === currentUserId || conn.participantId === currentUserId) && 
            conn.status === 'connected'
        ).length;
        
        // Count conversations
        const userConversations = conversations.filter(conv => 
            conv.participants.includes(currentUserId)
        );
        
        // Update DOM
        document.getElementById('connectionsCount').textContent = connectedCount;
        document.getElementById('conversationsCount').textContent = userConversations.length;
        
        // Online count would typically come from a real-time API
        // For now, we'll simulate it
        document.getElementById('onlineCount').textContent = Math.floor(connectedCount * 0.7);
        
    } catch (error) {
        console.error('Error updating chatroom stats:', error);
    }
}
// Initialize chatroom
async function initChatroom() {
    // Get current user data
    const userData = getCurrentUser();
    if (!userData) {
        // Redirect to login if not authenticated
        window.location.href = 'login.html';
        return;
    }
    
    // Set user data for later use
    window.currentUser = userData;
    updateChatroomStats();
    
    // Check if we have a participant ID in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const participantId = urlParams.get('participant');
    
    if (participantId) {
        // Verify connection and open chat if valid
        verifyConnectionAndOpenChat(participantId);
    }
}

// Setup event listeners
function setupEventListeners() {
    // New chat button
    document.getElementById('newChatBtn').addEventListener('click', openNewChatModal);
    document.getElementById('startNewChat').addEventListener('click', openNewChatModal);
    
    // Modal close buttons
    document.getElementById('closeModal').addEventListener('click', closeConnectionModal);
    document.getElementById('closeNewChatModal').addEventListener('click', closeNewChatModal);
    
    // Connection modal buttons
    document.getElementById('cancelChatBtn').addEventListener('click', closeConnectionModal);
    document.getElementById('sendConnectionRequestBtn').addEventListener('click', sendConnectionRequest);
    
    // Message sending
    document.getElementById('sendMessageBtn').addEventListener('click', sendMessage);
    document.getElementById('messageInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // File attachment
    document.getElementById('attachBtn').addEventListener('click', function() {
        document.getElementById('fileInput').click();
    });
    document.getElementById('fileInput').addEventListener('change', handleFileUpload);
    
    // Voice message
    setupVoiceMessageRecording();
    
    // Search functionality
    document.getElementById('conversationSearch').addEventListener('input', filterConversations);
    document.getElementById('participantSearch').addEventListener('input', filterModalParticipants);
    
    // View profile button
    document.getElementById('viewProfileBtn').addEventListener('click', viewProfile);
    
    // Close notification when clicking close button
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('notification-close')) {
            e.target.closest('.notification').remove();
        }
    });
}

// API call to get participants
async function fetchParticipants() {
    try {
        const API_BASE_URL = getApiBaseUrl();
        const response = await fetch(`${API_BASE_URL}/profiles`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching participants:', error);
        showNotification('Error', 'Failed to load participants. Please try again later.', 'error');
        return [];
    }
}

// API call to get connections
async function fetchConnections() {
    try {
        const currentUser = getCurrentUser();
        if (!currentUser || !currentUser.id) return [];
        
        const API_BASE_URL = getApiBaseUrl();
        const response = await fetch(`${API_BASE_URL}/connections?userId=${currentUser.id}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching connections:', error);
        return [];
    }
}

// API call to create a connection request
async function createConnectionRequest(participantId) {
    try {
        const currentUser = getCurrentUser();
        if (!currentUser || !currentUser.id) return false;
        
        const API_BASE_URL = getApiBaseUrl();
        const response = await fetch(`${API_BASE_URL}/connections`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: currentUser.id,
                participantId: participantId,
                status: 'pending'
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return true;
    } catch (error) {
        console.error('Error creating connection request:', error);
        return false;
    }
}

// Get participants data
async function getParticipantsData() {
    try {
        // Try to get from API first
        const participants = await fetchParticipants();
        
        // Store in sessionStorage for later use
        sessionStorage.setItem('participantsData', JSON.stringify(participants));
        return participants;
    } catch (error) {
        console.error('Error getting participants:', error);
        
        // Fallback to local storage if API fails
        try {
            const participants = JSON.parse(sessionStorage.getItem('participantsData') || '[]');
            return participants;
        } catch (parseError) {
            console.error('Error parsing participants data:', parseError);
            return [];
        }
    }
}

// Get connections data
async function getConnectionsData() {
    try {
        // Try to get from API first
        const connections = await fetchConnections();
        
        // Store in sessionStorage for later use
        sessionStorage.setItem('userConnections', JSON.stringify(connections));
        return connections;
    } catch (error) {
        console.error('Error getting connections:', error);
        
        // Fallback to local storage if API fails
        try {
            const connections = JSON.parse(sessionStorage.getItem('userConnections') || '[]');
            return connections;
        } catch (parseError) {
            console.error('Error parsing connections data:', parseError);
            return [];
        }
    }
}

// Get conversations data
async function getConversationsData() {
    try {
        // In a real app, this would be an API call
        // For now, use local storage
        const conversations = JSON.parse(localStorage.getItem('chatConversations') || 
                                       sessionStorage.getItem('chatConversations') || '[]');
        return conversations;
    } catch (error) {
        console.error('Error getting conversations:', error);
        return [];
    }
}

// Save conversations data
async function saveConversationsData(conversations) {
    try {
        // In a real app, this would be an API call
        // For now, use local storage
        localStorage.setItem('chatConversations', JSON.stringify(conversations));
        sessionStorage.setItem('chatConversations', JSON.stringify(conversations));
        return true;
    } catch (error) {
        console.error('Error saving conversations:', error);
        return false;
    }
}

// Load conversations for the current user
async function loadConversations() {
    const conversationsList = document.getElementById('conversationsList');
    
    // Show loading state
    conversationsList.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Loading conversations...</p>
        </div>
    `;
    
    try {
        const conversations = await getConversationsFromStorage();
        
        if (conversations.length === 0) {
            conversationsList.innerHTML = `
                <div class="no-conversations">
                    <i class="fas fa-comment-slash"></i>
                    <p>No conversations yet</p>
                    <button class="btn btn-primary" id="startFirstChat">Start a conversation</button>
                </div>
            `;
            
            document.getElementById('startFirstChat').addEventListener('click', openNewChatModal);
            return;
        }
        
        renderConversationsList(conversations);
    } catch (error) {
        console.error('Error loading conversations:', error);
        conversationsList.innerHTML = `
            <div class="no-conversations">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error loading conversations</p>
                <button class="btn btn-primary" id="retryLoading">Retry</button>
            </div>
        `;
        
        document.getElementById('retryLoading').addEventListener('click', loadConversations);
    }
}

// Get conversations from storage
async function getConversationsFromStorage() {
    try {
        const conversations = await getConversationsData();
        return conversations.filter(conv => conv.participants.includes(window.currentUser.id));
    } catch (error) {
        console.error('Error loading conversations:', error);
        return [];
    }
}

// Render conversations list
async function renderConversationsList(conversations) {
    const conversationsList = document.getElementById('conversationsList');
    const currentUserId = window.currentUser.id;
    
    if (conversations.length === 0) {
        conversationsList.innerHTML = `
            <div class="no-conversations">
                <i class="fas fa-comment-slash"></i>
                <p>No conversations yet</p>
                <button class="btn btn-primary" id="startFirstChat">Start a conversation</button>
            </div>
        `;
        
        document.getElementById('startFirstChat').addEventListener('click', openNewChatModal);
        return;
    }
    
    let html = '';
    
    for (const conversation of conversations) {
        // Get the other participant (not the current user)
        const otherParticipantId = conversation.participants.find(id => id !== currentUserId);
        const participant = await getParticipantById(otherParticipantId);
        
        if (!participant) continue;
        
        // Get last message
        const lastMessage = conversation.messages.length > 0 
            ? conversation.messages[conversation.messages.length - 1] 
            : null;
            
        // Format last message preview
        let messagePreview = 'No messages yet';
        if (lastMessage) {
            if (lastMessage.type === 'text') {
                messagePreview = lastMessage.senderId === currentUserId 
                    ? `You: ${lastMessage.content}` 
                    : lastMessage.content;
            } else if (lastMessage.type === 'image') {
                messagePreview = lastMessage.senderId === currentUserId 
                    ? 'You sent an image' 
                    : 'Sent an image';
            } else if (lastMessage.type === 'file') {
                messagePreview = lastMessage.senderId === currentUserId 
                    ? 'You sent a file' 
                    : 'Sent a file';
            } else if (lastMessage.type === 'audio') {
                messagePreview = lastMessage.senderId === currentUserId 
                    ? 'You sent a voice message' 
                    : 'Sent a voice message';
            }
            
            // Truncate long messages
            if (messagePreview.length > 35) {
                messagePreview = messagePreview.substring(0, 35) + '...';
            }
        }
        
        // Format time
        const time = lastMessage ? formatMessageTime(lastMessage.timestamp) : '';
        
        // Unread count
        const unreadCount = conversation.messages.filter(
            msg => msg.senderId !== currentUserId && !msg.read
        ).length;
        
        html += `
            <div class="conversation-item" data-conversation-id="${conversation.id}" data-participant-id="${participant.id || participant.user_id}">
                <div class="conversation-avatar" style="background-color: ${stringToColor(participant.name)}">
                    ${getInitials(participant.name)}
                </div>
                <div class="conversation-info">
                    <div class="conversation-name">${participant.name}</div>
                    <div class="conversation-preview">${messagePreview}</div>
                </div>
                <div class="conversation-meta">
                    <div class="conversation-time">${time}</div>
                    ${unreadCount > 0 ? `<div class="conversation-badge">${unreadCount}</div>` : ''}
                </div>
            </div>
        `;
    }
    
    conversationsList.innerHTML = html;
    
    // Add click event to conversation items
    document.querySelectorAll('.conversation-item').forEach(item => {
        item.addEventListener('click', function() {
            const participantId = this.getAttribute('data-participant-id');
            const conversationId = this.getAttribute('data-conversation-id');
            
            // Verify connection before opening chat
            verifyConnectionAndOpenChat(participantId, conversationId);
        });
    });
}

// Get participant by ID
async function getParticipantById(participantId) {
    try {
        const participants = await getParticipantsData();
        return participants.find(p => p.id === participantId || p.user_id === participantId);
    } catch (error) {
        console.error('Error getting participant:', error);
        return null;
    }
}

// Check if user is connected to participant
async function checkIfConnected(participantId) {
    try {
        // Get connections
        const connections = await getConnectionsData();
        
        // Check if current user is connected to this participant
        const currentUserId = window.currentUser.id;
        
        return connections.some(conn => 
            (conn.userId === currentUserId && conn.participantId === participantId && conn.status === 'connected') ||
            (conn.userId === participantId && conn.participantId === currentUserId && conn.status === 'connected')
        );
    } catch (error) {
        console.error('Error checking connection:', error);
        return false;
    }
}

// Verify connection and open chat if valid
async function verifyConnectionAndOpenChat(participantId, conversationId = null) {
    // Check if participant exists and is connected
    const participant = await getParticipantById(participantId);
    const isConnected = await checkIfConnected(participantId);
    
    if (participant && isConnected) {
        // Open the chat
        openChat(participant, conversationId);
    } else {
        // Show connection required modal
        showConnectionModal(participant);
    }
}

// Open chat with participant
function openChat(participant, conversationId = null) {
    // Hide "no chat selected" UI
    document.getElementById('noChatSelected').style.display = 'none';
    
    // Show chat UI elements
    document.getElementById('chatHeader').style.display = 'flex';
    document.getElementById('messagesContainer').style.display = 'block';
    document.getElementById('messageInputContainer').style.display = 'flex';
    
    // Set participant info in chat header
    document.getElementById('chatUserName').textContent = participant.name;
    document.getElementById('chatUserStatus').textContent = 'Online'; // This would come from real data
    
    // Set participant avatar
    const avatarEl = document.getElementById('chatUserAvatar');
    avatarEl.style.backgroundColor = stringToColor(participant.name);
    avatarEl.textContent = getInitials(participant.name);
    
    // Store current chat participant and conversation
    window.currentChat = {
        participant: participant,
        conversationId: conversationId
    };
    
    // Load messages for this conversation
    loadMessages(conversationId, participant.id || participant.user_id);
    
    // Mark messages as read
    markMessagesAsRead(conversationId, participant.id || participant.user_id);
    
    // Update active conversation in sidebar
    document.querySelectorAll('.conversation-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-participant-id') === (participant.id || participant.user_id)) {
            item.classList.add('active');
        }
    });
    
    // Update call buttons with actual phone number if available
    const voiceCallBtn = document.getElementById('voiceCallBtn');
    const videoCallBtn = document.getElementById('videoCallBtn');
    
    if (participant.phone) {
        voiceCallBtn.onclick = () => initiateCall(participant.phone, 'voice');
        videoCallBtn.onclick = () => initiateCall(participant.phone, 'video');
    } else {
        voiceCallBtn.onclick = () => showNotification('Call', 'No phone number available for this user', 'error');
        videoCallBtn.onclick = () => showNotification('Call', 'No phone number available for this user', 'error');
    }
}

// Initiate call function
function initiateCall(phoneNumber, callType) {
    // In a real app, this would integrate with a calling API
    showNotification(
        `${callType === 'voice' ? 'Voice' : 'Video'} Call`, 
        `Calling ${phoneNumber}...`, 
        'info'
    );
    
    // Simulate call initiation
    console.log(`Initiating ${callType} call to: ${phoneNumber}`);
}

// Load messages for conversation
async function loadMessages(conversationId, participantId) {
    const messagesContainer = document.getElementById('messages');
    const currentUserId = window.currentUser.id;
    
    // Show loading state
    messagesContainer.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Loading messages...</p>
        </div>
    `;
    
    try {
        let messages = [];
        const conversations = await getConversationsData();
        
        if (conversationId) {
            // Get messages from existing conversation
            const conversation = conversations.find(conv => conv.id === conversationId);
            
            if (conversation) {
                messages = conversation.messages;
            }
        } else {
            // Check if there's an existing conversation with this participant
            const existingConversation = conversations.find(conv => 
                conv.participants.includes(currentUserId) && conv.participants.includes(participantId)
            );
            
            if (existingConversation) {
                messages = existingConversation.messages;
                window.currentChat.conversationId = existingConversation.id;
            }
        }
        
        renderMessages(messages);
    } catch (error) {
        console.error('Error loading messages:', error);
        messagesContainer.innerHTML = `
            <div class="no-messages">
                <p>Error loading messages</p>
            </div>
        `;
    }
}

// Render messages in the chat
function renderMessages(messages) {
    const messagesContainer = document.getElementById('messages');
    const currentUserId = window.currentUser.id;
    
    if (messages.length === 0) {
        messagesContainer.innerHTML = `
            <div class="no-messages">
                <p>No messages yet. Start the conversation!</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    messages.forEach(message => {
        const isSent = message.senderId === currentUserId;
        
        html += `
            <div class="message ${isSent ? 'sent' : 'received'}">
                <div class="message-content">
        `;
        
        // Different content based on message type
        if (message.type === 'text') {
            html += `
                <p class="message-text">${message.content}</p>
            `;
        } else if (message.type === 'image') {
            html += `
                <img src="${message.content}" alt="Shared image" class="message-image">
            `;
        } else if (message.type === 'file') {
            html += `
                <div class="message-file">
                    <i class="fas fa-file"></i>
                    <span>${message.fileName || 'Document'}</span>
                </div>
            `;
        } else if (message.type === 'audio') {
            html += `
                <div class="message-audio">
                    <audio controls class="audio-player">
                        <source src="${message.content}" type="audio/webm">
                        Your browser does not support the audio element.
                    </audio>
                </div>
            `;
        }
        
        // Message time and status
        html += `
                    <div class="message-time">${formatMessageTime(message.timestamp)}</div>
                    ${isSent ? `
                        <div class="message-status ${message.read ? 'read' : message.delivered ? 'delivered' : 'sent'}">
                            <i class="fas fa-check${message.read ? '-double' : ''}"></i>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    });
    
    messagesContainer.innerHTML = html;
    
    // Scroll to bottom of messages
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Send a message
function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const messageText = messageInput.value.trim();
    
    if (!messageText || !window.currentChat) return;
    
    // Create message object
    const message = {
        id: generateId(),
        senderId: window.currentUser.id,
        content: messageText,
        type: 'text',
        timestamp: new Date().toISOString(),
        delivered: false,
        read: false
    };
    
    // Add message to UI immediately for better UX
    addMessageToUI(message);
    
    // Clear input
    messageInput.value = '';
    
    // Save message to storage
    saveMessageToStorage(message);
    
    // Simulate message delivery and read status (in a real app, this would happen via WebSockets)
    simulateMessageDelivery(message);
}

// Add message to UI
function addMessageToUI(message) {
    const messagesContainer = document.getElementById('messages');
    const isSent = message.senderId === window.currentUser.id;
    
    let messageHtml = `
        <div class="message ${isSent ? 'sent' : 'received'}">
            <div class="message-content">
    `;
    
    if (message.type === 'text') {
        messageHtml += `<p class="message-text">${message.content}</p>`;
    } else if (message.type === 'image') {
        messageHtml += `<img src="${message.content}" alt="Shared image" class="message-image">`;
    } else if (message.type === 'file') {
        messageHtml += `
            <div class="message-file">
                <i class="fas fa-file"></i>
                <span>${message.fileName || 'Document'}</span>
            </div>
        `;
    } else if (message.type === 'audio') {
        messageHtml += `
            <div class="message-audio">
                <audio controls class="audio-player">
                    <source src="${message.content}" type="audio/webm">
                    Your browser does not support the audio element.
                </audio>
            </div>
        `;
    }
    
    messageHtml += `
                <div class="message-time">${formatMessageTime(message.timestamp)}</div>
                ${isSent ? `
                    <div class="message-status sent">
                        <i class="fas fa-check"></i>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
    
    // Remove "no messages" text if it exists
    if (messagesContainer.querySelector('.no-messages')) {
        messagesContainer.innerHTML = '';
    }
    
    messagesContainer.innerHTML += messageHtml;
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Save message to storage
async function saveMessageToStorage(message) {
    try {
        const conversations = await getConversationsData();
        const currentUserId = window.currentUser.id;
        const participantId = window.currentChat.participant.id || window.currentChat.participant.user_id;
        
        // Find existing conversation or create new one
        let conversation = conversations.find(conv => 
            conv.participants.includes(currentUserId) && conv.participants.includes(participantId)
        );
        
        if (!conversation) {
            conversation = {
                id: generateId(),
                participants: [currentUserId, participantId],
                messages: []
            };
            conversations.push(conversation);
        }
        
        // Add message to conversation
        conversation.messages.push(message);
        
        // Update conversation in storage
        await saveConversationsData(conversations);
        
        // Update conversation in sidebar
        loadConversations();
        
    } catch (error) {
        console.error('Error saving message:', error);
    }
}

// Simulate message delivery and read status
function simulateMessageDelivery(message) {
    // Simulate delivery after a short delay
    setTimeout(() => {
        updateMessageStatus(message.id, 'delivered', true);
        
        // Simulate read status after another delay
        setTimeout(() => {
            updateMessageStatus(message.id, 'read', true);
        }, 1000);
    }, 1000);
}

// Update message status in UI and storage
async function updateMessageStatus(messageId, status, value) {
    // Update in UI
    const messageElements = document.querySelectorAll('.message');
    messageElements.forEach(el => {
        // This is a simplified approach - in a real app you'd have a better way to identify messages
        const statusElement = el.querySelector('.message-status');
        if (statusElement) {
            if (status === 'delivered' && value) {
                statusElement.innerHTML = '<i class="fas fa-check-double"></i>';
                statusElement.classList.remove('sent');
                statusElement.classList.add('delivered');
            } else if (status === 'read' && value) {
                statusElement.innerHTML = '<i class="fas fa-check-double" style="color: var(--study-success)"></i>';
                statusElement.classList.remove('delivered');
                statusElement.classList.add('read');
            }
        }
    });
    
    // Update in storage
    try {
        const conversations = await getConversationsData();
        
        for (const conversation of conversations) {
            const messageIndex = conversation.messages.findIndex(msg => msg.id === messageId);
            if (messageIndex !== -1) {
                conversation.messages[messageIndex][status] = value;
                break;
            }
        }
        
        await saveConversationsData(conversations);
    } catch (error) {
        console.error('Error updating message status:', error);
    }
}

// Handle file upload
function handleFileUpload(e) {
    const files = e.target.files;
    if (!files.length || !window.currentChat) return;
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileType = getFileType(file.type);
        
        // Create a message object for the file
        const message = {
            id: generateId(),
            senderId: window.currentUser.id,
            content: URL.createObjectURL(file), // In a real app, this would be a server URL
            type: fileType,
            fileName: file.name,
            fileSize: file.size,
            timestamp: new Date().toISOString(),
            delivered: false,
            read: false
        };
        
        // Show upload progress (simulated)
        showUploadProgress(message, file);
        
        // Simulate upload completion
        setTimeout(() => {
            // Add message to UI
            addMessageToUI(message);
            
            // Save to storage
            saveMessageToStorage(message);
            
            // Simulate delivery
            simulateMessageDelivery(message);
        }, 1500);
    }
    
    // Reset file input
    e.target.value = '';
}

// Get file type from MIME type
function getFileType(mimeType) {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.startsWith('video/')) return 'video';
    return 'file';
}

// Show upload progress
function showUploadProgress(message, file) {
    const messagesContainer = document.getElementById('messages');
    
    const progressHtml = `
        <div class="message sent" id="upload-${message.id}">
            <div class="message-content">
                <div class="message-file">
                    <i class="fas fa-file"></i>
                    <span>${file.name}</span>
                </div>
                <div class="upload-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 0%"></div>
                    </div>
                    <div class="progress-text">0%</div>
                </div>
            </div>
        </div>
    `;
    
    // Remove "no messages" text if it exists
    if (messagesContainer.querySelector('.no-messages')) {
        messagesContainer.innerHTML = '';
    }
    
    messagesContainer.innerHTML += progressHtml;
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Simulate progress updates
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += 5;
        const progressFill = document.querySelector(`#upload-${message.id} .progress-fill`);
        const progressText = document.querySelector(`#upload-${message.id} .progress-text`);
        
        if (progressFill && progressText) {
            progressFill.style.width = `${progress}%`;
            progressText.textContent = `${progress}%`;
        }
        
        if (progress >= 100) {
            clearInterval(progressInterval);
        }
    }, 100);
}

// Setup voice message recording
function setupVoiceMessageRecording() {
    const voiceBtn = document.getElementById('voiceMessageBtn');
    let mediaRecorder;
    let audioChunks = [];
    
    voiceBtn.addEventListener('mousedown', startRecording);
    voiceBtn.addEventListener('mouseup', stopRecording);
    voiceBtn.addEventListener('mouseleave', stopRecording);
    voiceBtn.addEventListener('touchstart', startRecording, {passive: true});
    voiceBtn.addEventListener('touchend', stopRecording);
    
    function startRecording(e) {
        e.preventDefault();
        
        if (!window.currentChat) return;
        
        // Check if browser supports media recording
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            showNotification('Voice Message', 'Your browser does not support voice recording', 'error');
            return;
        }
        
        // Show recording UI
        showRecordingUI();
        
        // Request microphone access
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                mediaRecorder = new MediaRecorder(stream);
                audioChunks = [];
                
                mediaRecorder.ondataavailable = event => {
                    audioChunks.push(event.data);
                };
                
                mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                    const audioUrl = URL.createObjectURL(audioBlob);
                    
                    // Create audio message
                    const message = {
                        id: generateId(),
                        senderId: window.currentUser.id,
                        content: audioUrl,
                        type: 'audio',
                        timestamp: new Date().toISOString(),
                        delivered: false,
                        read: false
                    };
                    
                    // Add to UI
                    addMessageToUI(message);
                    
                    // Save to storage
                    saveMessageToStorage(message);
                    
                    // Simulate delivery
                    simulateMessageDelivery(message);
                    
                    // Stop all tracks
                    stream.getTracks().forEach(track => track.stop());
                };
                
                mediaRecorder.start();
            })
            .catch(error => {
                console.error('Error accessing microphone:', error);
                hideRecordingUI();
                showNotification('Voice Message', 'Cannot access microphone. Please check permissions.', 'error');
            });
    }
    
    function stopRecording() {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            hideRecordingUI();
        }
    }
}

// Show recording UI
function showRecordingUI() {
    const recordingUI = document.createElement('div');
    recordingUI.className = 'voice-recorder';
    recordingUI.innerHTML = `
        <div class="recording-indicator">
            <div class="recording-dot"></div>
            <span class="recording-time">00:00</span>
        </div>
        <div class="recording-actions">
            <button class="recording-cancel">
                <i class="fas fa-times"></i>
            </button>
            <button class="recording-send">
                <i class="fas fa-paper-plane"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(recordingUI);
    
    // Start timer
    let seconds = 0;
    const timerInterval = setInterval(() => {
        seconds++;
        const timeEl = recordingUI.querySelector('.recording-time');
        if (timeEl) {
            const minutes = Math.floor(seconds / 60);
            const secs = seconds % 60;
            timeEl.textContent = `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
    }, 1000);
    
    // Store timer interval for cleanup
    recordingUI.dataset.timerInterval = timerInterval;
    
    // Add event listeners to buttons
    recordingUI.querySelector('.recording-cancel').addEventListener('click', () => {
        clearInterval(timerInterval);
        recordingUI.remove();
    });
    
    recordingUI.querySelector('.recording-send').addEventListener('click', () => {
        clearInterval(timerInterval);
        recordingUI.remove();
        
        // Stop recording if still active
        if (window.mediaRecorder && window.mediaRecorder.state === 'recording') {
            window.mediaRecorder.stop();
        }
    });
}

// Hide recording UI
function hideRecordingUI() {
    const recordingUI = document.querySelector('.voice-recorder');
    if (recordingUI) {
        clearInterval(parseInt(recordingUI.dataset.timerInterval));
        recordingUI.remove();
    }
}

// Open new chat modal
function openNewChatModal() {
    const modal = document.getElementById('newChatModal');
    modal.classList.add('show');
    
    loadConnectedParticipants();
}

// Close new chat modal
function closeNewChatModal() {
    document.getElementById('newChatModal').classList.remove('show');
}

// Load connected participants for new chat
async function loadConnectedParticipants() {
    const participantsList = document.getElementById('modalParticipantsList');
    
    // Show loading state
    participantsList.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Loading participants...</p>
        </div>
    `;
    
    try {
        const connectedParticipants = await getConnectedParticipants();
        
        if (connectedParticipants.length === 0) {
            participantsList.innerHTML = `
                <div class="no-participants">
                    <i class="fas fa-users-slash"></i>
                    <p>No connected participants yet</p>
                    <button class="btn btn-primary" onclick="window.location.href='participants.html'">
                        Find Participants
                    </button>
                </div>
            `;
            return;
        }
        
        renderModalParticipantsList(connectedParticipants);
    } catch (error) {
        console.error('Error loading participants:', error);
        participantsList.innerHTML = `
            <div class="no-participants">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error loading participants</p>
            </div>
        `;
    }
}

// Get connected participants
async function getConnectedParticipants() {
    try {
        const currentUserId = window.currentUser.id;
        const connections = await getConnectionsData();
        const participants = await getParticipantsData();
        
        // Get IDs of connected participants
        const connectedParticipantIds = connections
            .filter(conn => 
                (conn.userId === currentUserId || conn.participantId === currentUserId) && 
                conn.status === 'connected'
            )
            .map(conn => 
                conn.userId === currentUserId ? conn.participantId : conn.userId
            );
        
        // Get participant objects
        return participants.filter(p => 
            (p.id !== currentUserId && p.user_id !== currentUserId) && 
            (connectedParticipantIds.includes(p.id) || connectedParticipantIds.includes(p.user_id))
        );
    } catch (error) {
        console.error('Error getting connected participants:', error);
        return [];
    }
}

// Render participants list in modal
function renderModalParticipantsList(participants) {
    const participantsList = document.getElementById('modalParticipantsList');
    
    let html = '';
    
    participants.forEach(participant => {
        const participantId = participant.id || participant.user_id;
        
        html += `
            <div class="modal-participant-item" data-participant-id="${participantId}">
                <div class="modal-participant-avatar" style="background-color: ${stringToColor(participant.name)}">
                    ${getInitials(participant.name)}
                </div>
                <div class="modal-participant-info">
                    <div class="modal-participant-name">${participant.name}</div>
                    <div class="modal-participant-role">${participant.role || 'Student'}</div>
                </div>
            </div>
        `;
    });
    
    participantsList.innerHTML = html;
    
    // Add click event to participant items
    document.querySelectorAll('.modal-participant-item').forEach(item => {
        item.addEventListener('click', function() {
            const participantId = this.getAttribute('data-participant-id');
            closeNewChatModal();
            
            // Open chat with this participant
            verifyConnectionAndOpenChat(participantId);
        });
    });
}

// Filter conversations in sidebar
function filterConversations() {
    const searchTerm = document.getElementById('conversationSearch').value.toLowerCase();
    const conversationItems = document.querySelectorAll('.conversation-item');
    
    conversationItems.forEach(item => {
        const conversationName = item.querySelector('.conversation-name').textContent.toLowerCase();
        if (conversationName.includes(searchTerm)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// Filter participants in modal
function filterModalParticipants() {
    const searchTerm = document.getElementById('participantSearch').value.toLowerCase();
    const participantItems = document.querySelectorAll('.modal-participant-item');
    
    participantItems.forEach(item => {
        const participantName = item.querySelector('.modal-participant-name').textContent.toLowerCase();
        if (participantName.includes(searchTerm)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// Show connection modal
function showConnectionModal(participant) {
    const modal = document.getElementById('connectionModal');
    modal.classList.add('show');
    
    // Update modal content with participant info
    const modalBody = modal.querySelector('.modal-body');
    modalBody.innerHTML = `
        <i class="fas fa-users-slash"></i>
        <p>You need to be connected with <strong>${participant.name}</strong> to start chatting.</p>
        <p>Would you like to send a connection request?</p>
    `;
    
    // Store participant for later use
    window.pendingParticipant = participant;
}

// Close connection modal
function closeConnectionModal() {
    document.getElementById('connectionModal').classList.remove('show');
    window.pendingParticipant = null;
}

// Send connection request
async function sendConnectionRequest() {
    const participant = window.pendingParticipant;
    if (!participant) return;
    
    try {
        const participantId = participant.id || participant.user_id;
        const success = await createConnectionRequest(participantId);
        
        if (success) {
            showNotification('Connection Request', `Connection request sent to ${participant.name}`, 'success');
            
            // Update local connections data
            const connections = await getConnectionsData();
            connections.push({
                userId: window.currentUser.id,
                participantId: participantId,
                status: 'pending'
            });
            sessionStorage.setItem('userConnections', JSON.stringify(connections));
        } else {
            showNotification('Error', 'Failed to send connection request. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Error sending connection request:', error);
        showNotification('Error', 'Failed to send connection request. Please try again.', 'error');
    }
    
    // Close the modal
    closeConnectionModal();
}

// View profile of current chat participant
function viewProfile() {
    if (!window.currentChat) return;
    
    // Redirect to profile page with participant ID
    const participantId = window.currentChat.participant.id || window.currentChat.participant.user_id;
    window.location.href = `student-profile.html?view=${participantId}`;
}

// Mark messages as read
async function markMessagesAsRead(conversationId, participantId) {
    try {
        const conversations = await getConversationsData();
        const currentUserId = window.currentUser.id;
        
        for (const conversation of conversations) {
            if (conversation.id === conversationId || 
                (conversation.participants.includes(currentUserId) && 
                 conversation.participants.includes(participantId))) {
                
                conversation.messages.forEach(message => {
                    if (message.senderId !== currentUserId) {
                        message.read = true;
                    }
                });
                
                break;
            }
        }
        
        await saveConversationsData(conversations);
        
        // Update conversations list to remove unread badges
        loadConversations();
    } catch (error) {
        console.error('Error marking messages as read:', error);
    }
}

// Show notification
function showNotification(title, message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <div class="notification-content">
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        </div>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Utility function to generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Format message time
function formatMessageTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
        return 'Yesterday';
    } else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
}

// Get initials from name
function getInitials(name) {
    return name.split(' ').map(part => part[0]).join('').toUpperCase().substring(0, 2);
}

// Generate color from string
function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 60%)`;
}