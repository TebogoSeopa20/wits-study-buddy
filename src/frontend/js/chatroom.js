// chatroom.js - Fixed connection status and API error issues
document.addEventListener('DOMContentLoaded', function() {
    // Initialize chatroom
    initChatroom();
});

// Get API base URL
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
    
    // Setup event listeners
    setupEventListeners();
    
    // Load conversations
    await loadConversations();
    
    // Update chatroom stats (with error handling)
    try {
        await updateChatroomStats();
    } catch (error) {
        console.error('Error updating chatroom stats:', error);
    }
    
    // Check if we have a participant ID in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const participantId = urlParams.get('participant');
    
    if (participantId) {
        // First check if we have this participant in our conversations
        const conversationItem = document.querySelector(`.conversation-item[data-participant-id="${participantId}"]`);
        
        if (conversationItem) {
            // We have this participant in our list, they are connected - open chat directly
            const participantName = conversationItem.getAttribute('data-participant-name');
            const participantData = {
                id: participantId,
                user_id: participantId,
                name: participantName
            };
            
            // Since they're in our conversation list, they are connected - open chat
            openChat(participantData);
        } else {
            // Not in conversation list, verify connection
            verifyConnectionAndOpenChat(participantId);
        }
    } else {
        // Show default screen only if no participant specified
        showNoChatSelected();
    }
    
    // Add ESC key listener to return to no chat selected
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && window.currentChat) {
            // Update URL to remove participant parameter
            const url = new URL(window.location);
            url.searchParams.delete('participant');
            window.history.replaceState({}, '', url);
            
            showNoChatSelected();
        }
    });
}

// Show no chat selected UI
function showNoChatSelected() {
    // Hide chat UI elements
    const chatHeader = document.getElementById('chatHeader');
    const messagesContainer = document.getElementById('messagesContainer');
    const messageInputContainer = document.getElementById('messageInputContainer');
    const noChatSelected = document.getElementById('noChatSelected');
    
    if (chatHeader) chatHeader.style.display = 'none';
    if (messagesContainer) messagesContainer.style.display = 'none';
    if (messageInputContainer) messageInputContainer.style.display = 'none';
    if (noChatSelected) noChatSelected.style.display = 'flex';
    
    // Clear current chat
    window.currentChat = null;
    
    // Remove active class from all conversation items
    document.querySelectorAll('.conversation-item').forEach(item => {
        item.classList.remove('active');
    });
}

// Update chatroom stats with real data
async function updateChatroomStats() {
    try {
        const API_BASE_URL = getApiBaseUrl();
        const CONNECTIONS_API_URL = `${API_BASE_URL}/connections`;
        
        const currentUserId = window.currentUser.id;
        
        // Fetch connections data
        const connectionsResponse = await fetch(`${CONNECTIONS_API_URL}/${currentUserId}/stats`);
        if (!connectionsResponse.ok) throw new Error('Failed to fetch connection stats');
        const connectionsData = await connectionsResponse.json();
        
        // Fetch conversations count
        const conversationsResponse = await fetch(`${CONNECTIONS_API_URL}/${currentUserId}/friends`);
        if (!conversationsResponse.ok) throw new Error('Failed to fetch conversations');
        const conversationsData = await conversationsResponse.json();
        
        // Update DOM with real data (with null checks)
        const connectionsCountEl = document.getElementById('connectionsCount');
        const conversationsCountEl = document.getElementById('conversationsCount');
        const onlineCountEl = document.getElementById('onlineCount');
        
        if (connectionsCountEl) {
            connectionsCountEl.textContent = connectionsData.stats?.accepted || 0;
        }
        
        if (conversationsCountEl) {
            conversationsCountEl.textContent = conversationsData.count || 0;
        }
        
        if (onlineCountEl) {
            // Online count would typically come from a real-time API
            // For now, we'll simulate it based on connected users
            onlineCountEl.textContent = Math.floor((connectionsData.stats?.accepted || 0) * 0.7);
        }
        
    } catch (error) {
        console.error('Error updating chatroom stats:', error);
        // Don't throw the error further to prevent breaking the app
    }
}

// Setup event listeners
function setupEventListeners() {
    // New chat button
    const newChatBtn = document.getElementById('newChatBtn');
    const startNewChat = document.getElementById('startNewChat');
    
    if (newChatBtn) newChatBtn.addEventListener('click', openNewChatModal);
    if (startNewChat) startNewChat.addEventListener('click', openNewChatModal);
    
    // Modal close buttons
    const closeModal = document.getElementById('closeModal');
    const closeNewChatModal = document.getElementById('closeNewChatModal');
    
    if (closeModal) closeModal.addEventListener('click', closeConnectionModal);
    if (closeNewChatModal) closeNewChatModal.addEventListener('click', closeNewChatModal);
    
    // Connection modal buttons
    const cancelChatBtn = document.getElementById('cancelChatBtn');
    const sendConnectionRequestBtn = document.getElementById('sendConnectionRequestBtn');
    
    if (cancelChatBtn) cancelChatBtn.addEventListener('click', closeConnectionModal);
    if (sendConnectionRequestBtn) sendConnectionRequestBtn.addEventListener('click', sendConnectionRequest);
    
    // Message sending
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    const messageInput = document.getElementById('messageInput');
    
    if (sendMessageBtn) sendMessageBtn.addEventListener('click', sendMessage);
    if (messageInput) {
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
    
    // File attachment
    const attachBtn = document.getElementById('attachBtn');
    const fileInput = document.getElementById('fileInput');
    
    if (attachBtn) attachBtn.addEventListener('click', function() {
        if (fileInput) fileInput.click();
    });
    if (fileInput) fileInput.addEventListener('change', handleFileUpload);
    
    // Voice message
    setupVoiceMessageRecording();
    
    // Search functionality
    const conversationSearch = document.getElementById('conversationSearch');
    const participantSearch = document.getElementById('participantSearch');
    
    if (conversationSearch) conversationSearch.addEventListener('input', filterConversations);
    if (participantSearch) participantSearch.addEventListener('input', filterModalParticipants);
    
    // View profile button
    const viewProfileBtn = document.getElementById('viewProfileBtn');
    if (viewProfileBtn) viewProfileBtn.addEventListener('click', viewProfile);
    
    // Close notification when clicking close button
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('notification-close')) {
            e.target.closest('.notification').remove();
        }
    });
}

// Get participants data from API
async function getParticipantsData() {
    try {
        const API_BASE_URL = getApiBaseUrl();
        const response = await fetch(`${API_BASE_URL}/profiles`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const participants = await response.json();
        
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

// Get connections data from API
async function getConnectionsData() {
    try {
        const currentUser = getCurrentUser();
        if (!currentUser || !currentUser.id) return [];
        
        const API_BASE_URL = getApiBaseUrl();
        const CONNECTIONS_API_URL = `${API_BASE_URL}/connections`;
        
        const response = await fetch(`${CONNECTIONS_API_URL}/${currentUser.id}/details`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Store in sessionStorage for later use
        sessionStorage.setItem('userConnections', JSON.stringify(data.connections || []));
        return data.connections || [];
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

// Check if user is connected to participant
async function checkIfConnected(participantId) {
    try {
        const currentUserId = window.currentUser.id;
        const API_BASE_URL = getApiBaseUrl();
        const CONNECTIONS_API_URL = `${API_BASE_URL}/connections`;
        
        // Use the connection status API endpoint
        const response = await fetch(`${CONNECTIONS_API_URL}/${currentUserId}/status/${participantId}`);
        
        if (!response.ok) {
            // If API returns error, check if participant is in our conversation list
            const conversationItem = document.querySelector(`.conversation-item[data-participant-id="${participantId}"]`);
            if (conversationItem) {
                console.log("API failed but participant is in conversation list - assuming connected");
                return true;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Return true if status is 'accepted' (connected)
        return data.status === 'accepted';
    } catch (error) {
        console.error('Error checking connection:', error);
        
        // If API fails, check if participant is in our conversation list
        const conversationItem = document.querySelector(`.conversation-item[data-participant-id="${participantId}"]`);
        if (conversationItem) {
            console.log("API failed but participant is in conversation list - assuming connected");
            return true;
        }
        
        return false;
    }
}

// Get connected participants
async function getConnectedParticipants() {
    try {
        const currentUserId = window.currentUser.id;
        const API_BASE_URL = getApiBaseUrl();
        const CONNECTIONS_API_URL = `${API_BASE_URL}/connections`;
        
        // Fetch accepted connections
        const response = await fetch(`${CONNECTIONS_API_URL}/${currentUserId}/friends`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data.friends || [];
    } catch (error) {
        console.error('Error getting connected participants:', error);
        return [];
    }
}

// Send connection request
async function sendConnectionRequest() {
    const participant = window.pendingParticipant;
    if (!participant) return;
    
    try {
        const participantId = participant.id || participant.user_id;
        const currentUserId = window.currentUser.id;
        const API_BASE_URL = getApiBaseUrl();
        const CONNECTIONS_API_URL = `${API_BASE_URL}/connections`;
        
        const response = await fetch(`${CONNECTIONS_API_URL}/${currentUserId}/send-request`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                target_user_id: participantId
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        showNotification('Connection Request', `Connection request sent to ${participant.name}`, 'success');
        
        // Update local connections data
        const connections = await getConnectionsData();
        connections.push({
            user_id: currentUserId,
            participant_id: participantId,
            status: 'pending'
        });
        sessionStorage.setItem('userConnections', JSON.stringify(connections));
    } catch (error) {
        console.error('Error sending connection request:', error);
        showNotification('Error', 'Failed to send connection request. Please try again.', 'error');
    }
    
    // Close the modal
    closeConnectionModal();
}

// Load connected participants for new chat modal
async function loadConnectedParticipants() {
    const participantsList = document.getElementById('modalParticipantsList');
    if (!participantsList) return;
    
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

// Render participants list in modal with real data
function renderModalParticipantsList(participants) {
    const participantsList = document.getElementById('modalParticipantsList');
    if (!participantsList) return;
    
    let html = '';
    
    participants.forEach(participant => {
        const participantId = participant.id || participant.user_id;
        const avatarColor = stringToColor(participant.name);
        const initials = getInitials(participant.name);
        
        html += `
            <div class="modal-participant-item" data-participant-id="${participantId}">
                <div class="modal-participant-avatar" style="background-color: ${avatarColor}">
                    ${initials}
                </div>
                <div class="modal-participant-info">
                    <div class="modal-participant-name">${participant.name}</div>
                    <div class="modal-participant-role">${participant.role || 'Student'}</div>
                    ${participant.faculty ? `<div class="modal-participant-faculty">${participant.faculty}</div>` : ''}
                </div>
            </div>
        `;
    });
    
    participantsList.innerHTML = html;
    
    // Add click event to participant items - FIXED: Always redirect to DM
    document.querySelectorAll('.modal-participant-item').forEach(item => {
        item.addEventListener('click', function() {
            const participantId = this.getAttribute('data-participant-id');
            closeNewChatModal();
            
            // Always redirect to the DM with this participant
            window.location.href = `chatroom.html?participant=${participantId}`;
        });
    });
}

// Open new chat modal
function openNewChatModal() {
    const modal = document.getElementById('newChatModal');
    if (modal) {
        modal.classList.add('show');
        loadConnectedParticipants();
    }
}

// Close new chat modal
function closeNewChatModal() {
    const modal = document.getElementById('newChatModal');
    if (modal) modal.classList.remove('show');
}

// Verify connection and open chat if valid
async function verifyConnectionAndOpenChat(participantId) {
    try {
        console.log("Looking for participant with ID:", participantId);
        
        // First check if we have the participant data in session storage from the participants page
        const lastClickedParticipant = sessionStorage.getItem('lastClickedParticipant');
        if (lastClickedParticipant) {
            const participant = JSON.parse(lastClickedParticipant);
            console.log("Found participant in session storage:", participant);
            
            if ((participant.id === participantId) || (participant.user_id === participantId)) {
                const isConnected = await checkIfConnected(participantId);
                
                if (isConnected) {
                    // Open the chat
                    openChat(participant);
                    sessionStorage.removeItem('lastClickedParticipant');
                    return;
                } else {
                    // Show connection required modal
                    showConnectionModal(participant);
                    sessionStorage.removeItem('lastClickedParticipant');
                    return;
                }
            }
        }
        
        // If not found in session storage, try to get from API
        const participants = await getParticipantsData();
        const participant = participants.find(p => 
            (p.id === participantId || p.user_id === participantId)
        );
        
        if (!participant) {
            console.error("Participant not found for ID:", participantId);
            showNotification('Error', 'Participant not found', 'error');
            
            // Try to get basic info from the conversation list
            const conversationItem = document.querySelector(`.conversation-item[data-participant-id="${participantId}"]`);
            if (conversationItem) {
                const participantName = conversationItem.getAttribute('data-participant-name');
                const fallbackParticipant = {
                    id: participantId,
                    user_id: participantId,
                    name: participantName || 'Unknown User'
                };
                
                const isConnected = await checkIfConnected(participantId);
                if (isConnected) {
                    openChat(fallbackParticipant);
                    return;
                } else {
                    showConnectionModal(fallbackParticipant);
                    return;
                }
            }
            
            return;
        }
        
        const isConnected = await checkIfConnected(participantId);
        
        if (isConnected) {
            // Open the chat
            openChat(participant);
        } else {
            // Show connection required modal
            showConnectionModal(participant);
        }
    } catch (error) {
        console.error('Error in verifyConnectionAndOpenChat:', error);
        showNotification('Error', 'Failed to load participant information', 'error');
    }
}

// Open chat with participant
function openChat(participant, conversationId = null) {
    if (!participant) {
        console.error("No participant provided to openChat");
        showNotification('Error', 'Cannot open chat: participant information missing', 'error');
        return;
    }
    
    console.log("Opening chat with:", participant.name, participant);
    
    // Hide "no chat selected" UI
    const noChatSelected = document.getElementById('noChatSelected');
    if (noChatSelected) noChatSelected.style.display = 'none';
    
    // Show chat UI elements
    const chatHeader = document.getElementById('chatHeader');
    const messagesContainer = document.getElementById('messagesContainer');
    const messageInputContainer = document.getElementById('messageInputContainer');
    
    if (chatHeader) chatHeader.style.display = 'flex';
    if (messagesContainer) messagesContainer.style.display = 'block';
    if (messageInputContainer) messageInputContainer.style.display = 'flex';
    
    // Set participant info in chat header
    const chatUserName = document.getElementById('chatUserName');
    const chatUserStatus = document.getElementById('chatUserStatus');
    
    if (chatUserName) chatUserName.textContent = participant.name;
    if (chatUserStatus) chatUserStatus.textContent = 'Online';
    
    // Set participant avatar
    const avatarEl = document.getElementById('chatUserAvatar');
    if (avatarEl) {
        avatarEl.style.backgroundColor = stringToColor(participant.name);
        avatarEl.textContent = getInitials(participant.name);
    }
    
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
    
    if (voiceCallBtn && videoCallBtn) {
        if (participant.phone) {
            voiceCallBtn.onclick = () => initiateCall(participant.phone, 'voice');
            videoCallBtn.onclick = () => initiateCall(participant.phone, 'video');
        } else {
            voiceCallBtn.onclick = () => showNotification('Call', 'No phone number available for this user', 'error');
            videoCallBtn.onclick = () => showNotification('Call', 'No phone number available for this user', 'error');
        }
    }
    
    // Focus on message input for better UX
    const messageInput = document.getElementById('messageInput');
    if (messageInput) messageInput.focus();
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

// Load conversations for the current user
async function loadConversations() {
    const conversationsList = document.getElementById('conversationsList');
    if (!conversationsList) return;
    
    // Show loading state
    conversationsList.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Loading conversations...</p>
        </div>
    `;
    
    try {
        // Get connected participants (these are your conversations)
        const connectedParticipants = await getConnectedParticipants();
        
        if (connectedParticipants.length === 0) {
            conversationsList.innerHTML = `
                <div class="no-conversations">
                    <i class="fas fa-comment-slash"></i>
                    <p>No conversations yet</p>
                    <button class="btn btn-primary" id="startFirstChat">Start a conversation</button>
                </div>
            `;
            
            const startFirstChat = document.getElementById('startFirstChat');
            if (startFirstChat) startFirstChat.addEventListener('click', openNewChatModal);
            return;
        }
        
        renderConversationsList(connectedParticipants);
    } catch (error) {
        console.error('Error loading conversations:', error);
        conversationsList.innerHTML = `
            <div class='no-conversations'>
                <i class='fas fa-exclamation-triangle'></i>
                <p>Error loading conversations</p>
                <button class='btn btn-primary' id='retryLoading'>Retry</button>
            </div>
        `;
        
        const retryLoading = document.getElementById('retryLoading');
        if (retryLoading) retryLoading.addEventListener('click', loadConversations);
    }
}

// Store participants data globally for easy access
let globalParticipantsData = [];

// Render conversations list with real data
async function renderConversationsList(participants) {
    const conversationsList = document.getElementById('conversationsList');
    if (!conversationsList) return;
    
    const currentUserId = window.currentUser.id;
    
    // Store participants globally for later use
    globalParticipantsData = participants;
    
    if (participants.length === 0) {
        conversationsList.innerHTML = `
            <div class='no-conversations'>
                <i class='fas fa-comment-slash'></i>
                <p>No conversations yet</p>
                <button class='btn btn-primary' id='startFirstChat'>Start a conversation</button>
            </div>
        `;
        
        const startFirstChat = document.getElementById('startFirstChat');
        if (startFirstChat) startFirstChat.addEventListener('click', openNewChatModal);
        return;
    }
    
    let html = '';
    
    for (const participant of participants) {
        const participantId = participant.id || participant.user_id;
        
        // Get last message from localStorage (in a real app, this would come from your database)
        const conversationKey = `conversation_${currentUserId}_${participantId}`;
        const messages = JSON.parse(localStorage.getItem(conversationKey) || '[]');
        const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
            
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
        
        // Unread count (in a real app, this would come from your database)
        const unreadCount = messages.filter(
            msg => msg.senderId !== currentUserId && !msg.read
        ).length;
        
        const avatarColor = stringToColor(participant.name);
        const initials = getInitials(participant.name);
        
        html += `
            <div class='conversation-item' data-participant-id='${participantId}' data-participant-name='${participant.name}'>
                <div class='conversation-avatar' style='background-color: ${avatarColor}'>
                    ${initials}
                </div>
                <div class='conversation-info'>
                    <div class='conversation-name'>${participant.name}</div>
                    <div class='conversation-preview'>${messagePreview}</div>
                </div>
                <div class='conversation-meta'>
                    <div class='conversation-time'>${time}</div>
                    ${unreadCount > 0 ? `<div class='conversation-badge'>${unreadCount}</div>` : ''}
                </div>
            </div>
        `;
    }
    
    conversationsList.innerHTML = html;
    
    // Add click event to conversation items - FIXED: Always redirect to DM
    document.querySelectorAll('.conversation-item').forEach(item => {
        item.addEventListener('click', function() {
            const participantId = this.getAttribute('data-participant-id');
            const participantName = this.getAttribute('data-participant-name');
            
            // Store participant data in session storage for the verify function to access
            const participantData = {
                id: participantId,
                user_id: participantId,
                name: participantName,
                // Add other necessary fields if available
            };
            
            sessionStorage.setItem('lastClickedParticipant', JSON.stringify(participantData));
            
            // Always redirect to the DM with this participant
            window.location.href = `chatroom.html?participant=${participantId}`;
        });
    });
}

// Load messages for conversation
async function loadMessages(conversationId, participantId) {
    const messagesContainer = document.getElementById('messages');
    if (!messagesContainer) return;
    
    const currentUserId = window.currentUser.id;
    
    // Show loading state
    messagesContainer.innerHTML = `
        <div class='loading-spinner'>
            <div class='spinner'></div>
            <p>Loading messages...</p>
        </div>
    `;
    
    try {
        // Use a unique key for this conversation
        const conversationKey = `conversation_${currentUserId}_${participantId}`;
        const messages = JSON.parse(localStorage.getItem(conversationKey) || '[]');
        
        renderMessages(messages);
    } catch (error) {
        console.error('Error loading messages:', error);
        messagesContainer.innerHTML = `
            <div class='no-messages'>
                <p>Error loading messages</p>
            </div>
        `;
    }
}

// Render messages in the chat
function renderMessages(messages) {
    const messagesContainer = document.getElementById('messages');
    if (!messagesContainer) return;
    
    const currentUserId = window.currentUser.id;
    
    if (messages.length === 0) {
        messagesContainer.innerHTML = `
            <div class='no-messages'>
                <p>No messages yet. Start the conversation!</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    messages.forEach(message => {
        const isSent = message.senderId === currentUserId;
        
        html += `
            <div class='message ${isSent ? 'sent' : 'received'}'>
                <div class='message-content'>
        `;
        
        // Different content based on message type
        if (message.type === 'text') {
            html += `
                <p class='message-text'>${message.content}</p>
            `;
        } else if (message.type === 'image') {
            html += `
                <img src='${message.content}' alt='Shared image' class='message-image'>
            `;
        } else if (message.type === 'file') {
            html += `
                <div class='message-file'>
                    <i class='fas fa-file'></i>
                    <span>${message.fileName || 'Document'}</span>
                </div>
            `;
        } else if (message.type === 'audio') {
            html += `
                <div class='message-audio'>
                    <audio controls class='audio-player'>
                        <source src='${message.content}' type='audio/webm'>
                        Your browser does not support the audio element.
                    </audio>
                </div>
            `;
        }
        
        // Message time and status
        html += `
                    <div class='message-time'>${formatMessageTime(message.timestamp)}</div>
                    ${isSent ? `
                        <div class='message-status ${message.read ? 'read' : message.delivered ? 'delivered' : 'sent'}'>
                            <i class='fas fa-check${message.read ? '-double' : ''}'></i>
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
    if (!messageInput || !window.currentChat) return;
    
    const messageText = messageInput.value.trim();
    if (!messageText) return;
    
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
    if (!messagesContainer) return;
    
    const isSent = message.senderId === window.currentUser.id;
    
    let messageHtml = `
        <div class='message ${isSent ? 'sent' : 'received'}'>
            <div class='message-content'>
    `;
    
    if (message.type === 'text') {
        messageHtml += `<p class='message-text'>${message.content}</p>`;
    } else if (message.type === 'image') {
        messageHtml += `<img src='${message.content}' alt='Shared image' class='message-image'>`;
    } else if (message.type === 'file') {
        messageHtml += `
            <div class='message-file'>
                <i class='fas fa-file'></i>
                <span>${message.fileName || 'Document'}</span>
            </div>
        `;
    } else if (message.type === 'audio') {
        messageHtml += `
            <div class='message-audio'>
                <audio controls class='audio-player'>
                    <source src='${message.content}' type='audio/webm'>
                    Your browser does not support the audio element.
                </audio>
            </div>
        `;
    }
    
    messageHtml += `
                <div class='message-time'>${formatMessageTime(message.timestamp)}</div>
                ${isSent ? `
                    <div class='message-status sent'>
                        <i class='fas fa-check'></i>
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
        const currentUserId = window.currentUser.id;
        const participantId = window.currentChat.participant.id || window.currentChat.participant.user_id;
        
        // Use a unique key for this conversation
        const conversationKey = `conversation_${currentUserId}_${participantId}`;
        
        // Get existing messages
        const existingMessages = JSON.parse(localStorage.getItem(conversationKey) || '[]');
        
        // Add new message
        existingMessages.push(message);
        
        // Save back to localStorage
        localStorage.setItem(conversationKey, JSON.stringify(existingMessages));
        
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
                statusElement.innerHTML = '<i class=\'fas fa-check-double\'></i>';
                statusElement.classList.remove('sent');
                statusElement.classList.add('delivered');
            } else if (status === 'read' && value) {
                statusElement.innerHTML = '<i class=\'fas fa-check-double\' style=\'color: var(--study-success)\'></i>';
                statusElement.classList.remove('delivered');
                statusElement.classList.add('read');
            }
        }
    });
    
    // Update in storage
    try {
        const currentUserId = window.currentUser.id;
        const participantId = window.currentChat.participant.id || window.currentChat.participant.user_id;
        const conversationKey = `conversation_${currentUserId}_${participantId}`;
        const messages = JSON.parse(localStorage.getItem(conversationKey) || '[]');
        
        for (let i = 0; i < messages.length; i++) {
            if (messages[i].id === messageId) {
                messages[i][status] = value;
                break;
            }
        }
        
        localStorage.setItem(conversationKey, JSON.stringify(messages));
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
    if (!messagesContainer) return;
    
    const progressHtml = `
        <div class='message sent' id='upload-${message.id}'>
            <div class='message-content'>
                <div class='message-file'>
                    <i class='fas fa-file'></i>
                    <span>${file.name}</span>
                </div>
                <div class='upload-progress'>
                    <div class='progress-bar'>
                        <div class='progress-fill' style='width: 0%'></div>
                    </div>
                    <div class='progress-text'>0%</div>
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
    if (!voiceBtn) return;
    
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
        <div class='recording-indicator'>
            <div class='recording-dot'></div>
            <span class='recording-time'>00:00</span>
        </div>
        <div class='recording-actions'>
            <button class='recording-cancel'>
                <i class='fas fa-times'></i>
            </button>
            <button class='recording-send'>
                <i class='fas fa-paper-plane'></i>
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
    const cancelBtn = recordingUI.querySelector('.recording-cancel');
    const sendBtn = recordingUI.querySelector('.recording-send');
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            clearInterval(timerInterval);
            recordingUI.remove();
        });
    }
    
    if (sendBtn) {
        sendBtn.addEventListener('click', () => {
            clearInterval(timerInterval);
            recordingUI.remove();
            
            // Stop recording if still active
            if (window.mediaRecorder && window.mediaRecorder.state === 'recording') {
                window.mediaRecorder.stop();
            }
        });
    }
}

// Hide recording UI
function hideRecordingUI() {
    const recordingUI = document.querySelector('.voice-recorder');
    if (recordingUI) {
        const timerInterval = recordingUI.dataset.timerInterval;
        if (timerInterval) clearInterval(parseInt(timerInterval));
        recordingUI.remove();
    }
}

// Filter conversations in sidebar
function filterConversations() {
    const searchTerm = document.getElementById('conversationSearch')?.value.toLowerCase();
    if (!searchTerm) return;
    
    const conversationItems = document.querySelectorAll('.conversation-item');
    
    conversationItems.forEach(item => {
        const conversationName = item.querySelector('.conversation-name')?.textContent.toLowerCase();
        if (conversationName && conversationName.includes(searchTerm)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// Filter participants in modal
function filterModalParticipants() {
    const searchTerm = document.getElementById('participantSearch')?.value.toLowerCase();
    if (!searchTerm) return;
    
    const participantItems = document.querySelectorAll('.modal-participant-item');
    
    participantItems.forEach(item => {
        const participantName = item.querySelector('.modal-participant-name')?.textContent.toLowerCase();
        if (participantName && participantName.includes(searchTerm)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// Show connection modal
function showConnectionModal(participant) {
    const modal = document.getElementById('connectionModal');
    if (!modal) return;
    
    modal.classList.add('show');
    
    // Update modal content with participant info
    const modalBody = modal.querySelector('.modal-body');
    if (modalBody) {
        modalBody.innerHTML = `
            <i class='fas fa-users-slash'></i>
            <p>You need to be connected with <strong>${participant.name}</strong> to start chatting.</p>
            <p>Would you like to send a connection request?</p>
        `;
    }
    
    // Store participant for later use
    window.pendingParticipant = participant;
}

// Close connection modal
function closeConnectionModal() {
    const modal = document.getElementById('connectionModal');
    if (modal) modal.classList.remove('show');
    window.pendingParticipant = null;
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
        const currentUserId = window.currentUser.id;
        const conversationKey = `conversation_${currentUserId}_${participantId}`;
        const messages = JSON.parse(localStorage.getItem(conversationKey) || '[]');
        
        for (let i = 0; i < messages.length; i++) {
            if (messages[i].senderId !== currentUserId) {
                messages[i].read = true;
            }
        }
        
        localStorage.setItem(conversationKey, JSON.stringify(messages));
        
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
        <i class='fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}'></i>
        <div class='notification-content'>
            <div class='notification-title'>${title}</div>
            <div class='notification-message'>${message}</div>
        </div>
        <button class='notification-close'>
            <i class='fas fa-times'></i>
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
    if (!name) return 'NN';
    return name.split(' ').map(part => part[0]).join('').toUpperCase().substring(0, 2);
}

// Generate color from string
function stringToColor(str) {
    if (!str) return '#3b82f6';
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 60%)`;
}