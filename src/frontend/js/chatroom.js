// Chatroom Application with Real API Integration
class ChatroomApp {
    constructor() {
        this.currentChat = null;
        this.currentTab = 'direct';
        this.isCallActive = false;
        this.callStartTime = null;
        this.callInterval = null;
        this.messages = {};
        this.connectedParticipants = [];
        this.conversations = [];
        this.groups = [];
        this.currentUser = null;
        this.currentUserProfile = null;
        
        // API configuration
        this.isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        this.API_BASE_URL = this.isLocal 
            ? 'http://localhost:3000/api' 
            : 'https://wits-buddy-g9esajarfqe3dmh6.southafricanorth-01.azurewebsites.net/api';
        
        // Initialize the app
        this.init();
    }
    
    async init() {
        // Check if user is logged in
        if (typeof auth === 'undefined' || !auth.isLoggedIn()) {
            window.location.href = 'login.html';
            return;
        }
        
        this.currentUser = auth.getCurrentUser();
        
        await this.loadCurrentUserProfile();
        await this.loadConnectedParticipants();
        await this.loadConversations();
        await this.loadUserGroups();
        this.bindEvents();
        this.renderChatList();
        this.setupMessageInput();
    }
    
    async loadCurrentUserProfile() {
        try {
            const response = await fetch(`${this.API_BASE_URL}/profiles`, {
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${auth.getAccessToken()}`
                }
            });
            
            if (response.ok) {
                const profiles = await response.json();
                this.currentUserProfile = profiles.find(p => p.email === this.currentUser.email);
                
                if (!this.currentUserProfile) {
                    console.error('Current user profile not found');
                }
            } else if (response.status === 401) {
                window.location.href = 'login.html';
            } else {
                console.error('Failed to fetch user profile');
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
        }
    }
    
    async loadUserGroups() {
        if (!this.currentUserProfile) {
            console.error('Cannot load groups: user profile not available');
            return;
        }
        
        try {
            const response = await fetch(`${this.API_BASE_URL}/groups/user/${this.currentUserProfile.user_id}`, {
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${auth.getAccessToken()}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.groups = data.groups || [];
                console.log('User groups loaded:', this.groups);
            } else if (response.status === 401) {
                window.location.href = 'login.html';
            } else {
                console.log('No groups found or error loading groups');
                this.groups = [];
            }
        } catch (error) {
            console.error('Error loading user groups:', error);
            this.groups = [];
        }
    }
    
    async loadConversations() {
        try {
            const response = await fetch(`${this.API_BASE_URL}/chat/conversations`, {
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${auth.getAccessToken()}`
                }
            });
            
            if (response.ok) {
                this.conversations = await response.json();
            } else if (response.status === 401) {
                window.location.href = 'login.html';
            } else {
                console.log('No conversations found, starting fresh');
                this.conversations = [];
            }
        } catch (error) {
            console.error('Error loading conversations:', error);
            this.showNotification('Error', 'Failed to load conversations.');
            this.conversations = [];
        }
    }
    
    async loadConnectedParticipants() {
        try {
            if (!this.currentUserProfile) {
                throw new Error('Current user profile not available');
            }
            
            // Now get connections for this user
            const connectionsResponse = await fetch(`${this.API_BASE_URL}/connections/${this.currentUserProfile.user_id}/details`, {
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${auth.getAccessToken()}`
                }
            });
            
            if (connectionsResponse.ok) {
                const connectionsData = await connectionsResponse.json();
                
                // Filter to only accepted connections (friends)
                this.connectedParticipants = connectionsData.connections.filter(
                    conn => conn.status === 'accepted'
                );
                
                console.log('Connected participants:', this.connectedParticipants);
            } else if (connectionsResponse.status === 401) {
                window.location.href = 'login.html';
            } else {
                console.log('No connections found or error loading connections');
                this.connectedParticipants = [];
            }
        } catch (error) {
            console.error('Error loading connected participants:', error);
            this.connectedParticipants = [];
        }
    }
    
    bindEvents() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });
        
        // Search functionality
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.searchChats(e.target.value);
        });
        
        // New chat/group buttons
        document.getElementById('newChatBtn').addEventListener('click', () => {
            this.showNewChatDialog();
        });
        
        
        // Call buttons
        document.getElementById('voiceCallBtn').addEventListener('click', () => {
            this.startCall('voice');
        });
        
        document.getElementById('videoCallBtn').addEventListener('click', () => {
            this.startCall('video');
        });
        
        // Chat info button
        document.getElementById('chatInfoBtn').addEventListener('click', () => {
            this.toggleParticipantsPanel();
        });
        
        // Message input
        document.getElementById('sendBtn').addEventListener('click', () => {
            this.sendMessage();
        });
        
        // File attachment
        document.getElementById('attachmentBtn').addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });
        
        document.getElementById('fileInput').addEventListener('change', (e) => {
            this.handleFileUpload(e.target.files);
        });
        
        // Emoji picker
        document.getElementById('emojiBtn').addEventListener('click', () => {
            this.toggleEmojiPicker();
        });
        
        document.querySelectorAll('.emoji').forEach(emoji => {
            emoji.addEventListener('click', (e) => {
                this.insertEmoji(e.target.dataset.emoji);
            });
        });
        
        // Call modal controls
        document.getElementById('muteBtn').addEventListener('click', () => {
            this.toggleMute();
        });
        
        document.getElementById('videoToggleBtn').addEventListener('click', () => {
            this.toggleVideo();
        });
        
        document.getElementById('endCallBtn').addEventListener('click', () => {
            this.endCall();
        });
        
        // Modal controls
        document.getElementById('closeGroupModalBtn').addEventListener('click', () => {
            this.closeModal('newGroupModal');
        });
        
        document.getElementById('cancelGroupBtn').addEventListener('click', () => {
            this.closeModal('newGroupModal');
        });
        
        document.getElementById('createGroupBtn').addEventListener('click', () => {
            this.createGroup();
        });
        
        document.getElementById('closePanelBtn').addEventListener('click', () => {
            this.toggleParticipantsPanel();
        });
        
        // Close modals on backdrop click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target.id);
            }
            
            // Close emoji picker when clicking outside
            if (!e.target.closest('.emoji-picker') && !e.target.closest('.emoji-btn')) {
                document.getElementById('emojiPicker').classList.remove('active');
            }
        });
    }
    
    switchTab(tab) {
        this.currentTab = tab;
        
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        
        this.renderChatList();
    }
    
    renderChatList() {
        const chatList = document.getElementById('chatList');
        chatList.innerHTML = '';
        
        if (this.currentTab === 'direct') {
            // Render direct chats from conversations and connected participants
            if (this.conversations.length === 0 && this.connectedParticipants.length === 0) {
                chatList.innerHTML = '<p class="text-muted">No conversations yet. Connect with other students to start chatting!</p>';
                return;
            }
            
            // First render existing conversations
            this.conversations.forEach(conversation => {
                const lastMessage = conversation.lastMessage || { content: 'Start a conversation', timestamp: conversation.createdAt };
                const timestamp = this.formatTime(lastMessage.timestamp);
                const unreadCount = conversation.unreadCount > 0 ? conversation.unreadCount : 0;
                
                const chatItem = this.createChatItem({
                    id: conversation._id,
                    name: conversation.participant.name,
                    avatar: null,
                    status: 'online',
                    lastMessage: lastMessage.content,
                    timestamp: lastMessage.timestamp,
                    unreadCount: unreadCount,
                    type: 'direct'
                });
                
                chatList.appendChild(chatItem);
            });
            
            // Then render connected participants who don't have conversations yet
            this.connectedParticipants.forEach(participant => {
                // Check if this participant already has a conversation
                const existingConversation = this.conversations.find(c => 
                    c.participant && c.participant._id === participant.user_id
                );
                
                if (!existingConversation) {
                    const chatItem = this.createChatItem({
                        id: `new_${participant.user_id}`,
                        name: participant.name,
                        avatar: null,
                        status: 'online',
                        lastMessage: 'Start a conversation',
                        timestamp: new Date(),
                        unreadCount: 0,
                        type: 'direct'
                    });
                    
                    chatList.appendChild(chatItem);
                }
            });
        } else {
            // Render groups the user is a member of
            if (this.groups.length === 0) {
                chatList.innerHTML = '<p class="text-muted">You are not a member of any groups yet.</p>';
                return;
            }
            
            this.groups.forEach(group => {
                const chatItem = this.createChatItem({
                    id: group.group_id,
                    name: group.group_name,
                    avatar: null,
                    status: 'online',
                    lastMessage: group.description || 'Group conversation',
                    timestamp: group.created_at,
                    unreadCount: 0,
                    type: 'group',
                    memberCount: group.member_count,
                    maxMembers: group.max_members
                });
                
                chatList.appendChild(chatItem);
            });
        }
    }
    
    createChatItem(data) {
        const chatItem = document.createElement('div');
        chatItem.className = 'chat-item';
        chatItem.dataset.chatId = data.id;
        chatItem.dataset.chatType = data.type;
        
        // For groups, show member count
        const groupInfo = data.type === 'group' ? 
            `<div class="group-meta">${data.memberCount}/${data.maxMembers} members</div>` : '';
        
        chatItem.innerHTML = `
            <div class="chat-avatar">
                ${data.type === 'group' ? 
                    `<i class="fas fa-users" style="color: ${this.stringToColor(data.name)};"></i>` :
                    data.avatar ? `<img src="${data.avatar}" alt="${data.name}">` : 
                    `<span style="color: ${this.stringToColor(data.name)}; font-weight: bold;">${this.getInitials(data.name)}</span>`
                }
                ${data.type === 'direct' ? `<div class="status-indicator ${data.status}"></div>` : ''}
            </div>
            <div class="chat-info">
                <div class="chat-name">${data.name}</div>
                <div class="chat-last-message">${data.lastMessage}</div>
                ${groupInfo}
            </div>
            <div class="chat-meta">
                <div class="chat-time">${this.formatTime(data.timestamp)}</div>
                ${data.unreadCount > 0 ? `<div class="unread-badge">${data.unreadCount}</div>` : ''}
            </div>
        `;
        
        chatItem.addEventListener('click', () => {
            if (data.id.startsWith('new_')) {
                // This is a new chat with a connected user
                this.startNewChat(data.id.replace('new_', ''), data.name);
            } else {
                // This is an existing conversation or group
                this.selectChat(data.id, data.type);
            }
        });
        
        return chatItem;
    }
    
    async startNewChat(userId, userName) {
        try {
            if (!this.currentUserProfile) {
                throw new Error('Current user profile not available');
            }
            
            // Create a new conversation
            const response = await fetch(`${this.API_BASE_URL}/chat/conversation`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${auth.getAccessToken()}`
                },
                credentials: 'include',
                body: JSON.stringify({
                    participantId: userId
                })
            });
            
            if (response.ok) {
                const newConversation = await response.json();
                
                // Add to conversations list
                this.conversations.push(newConversation);
                this.renderChatList();
                
                // Select the new conversation
                this.selectChat(newConversation._id, 'direct');
                
                this.showNotification('Success', `Started a new chat with ${userName}`);
            } else if (response.status === 401) {
                window.location.href = 'login.html';
            } else {
                this.showNotification('Error', 'Failed to start new conversation.');
            }
        } catch (error) {
            console.error('Error starting new chat:', error);
            this.showNotification('Error', 'Failed to start new conversation.');
        }
    }
    
    async selectChat(chatId, chatType) {
        if (chatType === 'direct') {
            // Find the conversation
            const conversation = this.conversations.find(c => c._id === chatId);
            if (!conversation) return;
            
            this.currentChat = { id: chatId, type: chatType, conversation: conversation };
            
            // Update active chat item
            document.querySelectorAll('.chat-item').forEach(item => {
                item.classList.toggle('active', item.dataset.chatId === chatId);
            });
            
            // Update chat header
            this.updateChatHeader();
            
            // Load messages
            await this.loadMessages();
            
            // Update participants panel
            this.updateParticipantsPanel();
        } else if (chatType === 'group') {
            // Find the group
            const group = this.groups.find(g => g.group_id === chatId);
            if (!group) return;
            
            this.currentChat = { id: chatId, type: chatType, group: group };
            
            // Update active chat item
            document.querySelectorAll('.chat-item').forEach(item => {
                item.classList.toggle('active', item.dataset.chatId === chatId);
            });
            
            // Update chat header
            this.updateChatHeader();
            
            // Load group messages (you'll need to implement this)
            await this.loadGroupMessages();
            
            // Update participants panel with group members
            this.updateGroupParticipantsPanel();
        }
    }
    
    updateChatHeader() {
        const chatHeader = document.getElementById('chatHeader');
        const userInfo = chatHeader.querySelector('.chat-user-info');
        
        if (!this.currentChat) {
            userInfo.innerHTML = `
                <div class="user-avatar">
                    <i class="fas fa-user-circle"></i>
                </div>
                <div class="user-details">
                    <h3 class="user-name">Select a conversation</h3>
                    <span class="user-status">to start chatting</span>
                </div>
            `;
            return;
        }
        
        if (this.currentChat.type === 'direct') {
            const { conversation } = this.currentChat;
            const name = conversation.participant.name;
            const status = 'Online'; // This would come from real-time status
            
            userInfo.innerHTML = `
                <div class="user-avatar" style="background-color: ${this.stringToColor(name)};">
                    <span style="color: white; font-weight: bold;">${this.getInitials(name)}</span>
                </div>
                <div class="user-details">
                    <h3 class="user-name">${name}</h3>
                    <span class="user-status">${status}</span>
                </div>
            `;
        } else if (this.currentChat.type === 'group') {
            const { group } = this.currentChat;
            const name = group.group_name;
            const memberCount = `${group.member_count || 0} members`;
            
            userInfo.innerHTML = `
                <div class="user-avatar" style="background-color: ${this.stringToColor(name)};">
                    <i class="fas fa-users" style="color: white;"></i>
                </div>
                <div class="user-details">
                    <h3 class="user-name">${name}</h3>
                    <span class="user-status">${memberCount}</span>
                </div>
            `;
        }
    }
    
    async loadMessages() {
        const messagesContainer = document.getElementById('messagesContainer');
        
        if (!this.currentChat || this.currentChat.type !== 'direct') {
            messagesContainer.innerHTML = `
                <div class="welcome-message">
                    <div class="welcome-icon">
                        <i class="fas fa-comments"></i>
                    </div>
                    <h3>Welcome to Wits ChatRoom</h3>
                    <p>Connect with fellow students, share files, and collaborate on your studies.</p>
                </div>
            `;
            return;
        }
        
        try {
            const response = await fetch(`${this.API_BASE_URL}/chat/messages/${this.currentChat.id}`, {
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${auth.getAccessToken()}`
                }
            });
            
            if (response.ok) {
                const messages = await response.json();
                this.renderMessages(messages);
            } else if (response.status === 401) {
                window.location.href = 'login.html';
            } else {
                messagesContainer.innerHTML = '<p class="text-muted">No messages yet. Start the conversation!</p>';
            }
        } catch (error) {
            console.error('Error loading messages:', error);
            messagesContainer.innerHTML = '<p class="text-muted">Error loading messages.</p>';
        }
    }
    
    async loadGroupMessages() {
        const messagesContainer = document.getElementById('messagesContainer');
        
        if (!this.currentChat || this.currentChat.type !== 'group') {
            messagesContainer.innerHTML = `
                <div class="welcome-message">
                    <div class="welcome-icon">
                        <i class="fas fa-comments"></i>
                    </div>
                    <h3>Welcome to Wits ChatRoom</h3>
                    <p>Connect with fellow students, share files, and collaborate on your studies.</p>
                </div>
            `;
            return;
        }
        
        // For now, show a placeholder message since group messaging
        // would need a different API endpoint
        messagesContainer.innerHTML = `
            <div class="welcome-message">
                <div class="welcome-icon">
                    <i class="fas fa-users"></i>
                </div>
                <h3>${this.currentChat.group.group_name}</h3>
                <p>${this.currentChat.group.description || 'Group conversation'}</p>
                <p>Group messaging functionality coming soon.</p>
            </div>
        `;
    }
    
    renderMessages(messagesData) {
        const messagesContainer = document.getElementById('messagesContainer');
        messagesContainer.innerHTML = '';
        
        if (messagesData.length === 0) {
            messagesContainer.innerHTML = '<p class="text-muted">No messages yet. Start the conversation!</p>';
            return;
        }
        
        messagesData.forEach(message => {
            const messageElement = this.createMessageElement(message);
            messagesContainer.appendChild(messageElement);
        });
        
        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    createMessageElement(message) {
        const messageDiv = document.createElement('div');
        const isSent = message.sender._id === this.currentUser.id;
        messageDiv.className = `message ${isSent ? 'sent' : 'received'}`;
        
        let content = '';
        if (message.type === 'text') {
            content = `<p class="message-text">${this.escapeHtml(message.content)}</p>`;
        } else if (message.type === 'image') {
            content = `
                <div class="message-file">
                    <div class="file-icon">
                        <i class="fas fa-image"></i>
                    </div>
                    <div class="file-info">
                        <h4>Image</h4>
                        <span class="file-size">Click to view</span>
                    </div>
                </div>
            `;
        } else if (message.type === 'file') {
            content = `
                <div class="message-file">
                    <div class="file-icon">
                        <i class="fas fa-file"></i>
                    </div>
                    <div class="file-info">
                        <h4>${message.metadata?.originalName || 'File'}</h4>
                        <span class="file-size">${message.metadata?.size ? this.formatFileSize(message.metadata.size) : 'Download'}</span>
                    </div>
                </div>
            `;
        } else if (message.type === 'audio') {
            content = `
                <div class="message-audio">
                    <audio controls class="audio-player">
                        <source src="${message.content}" type="audio/webm">
                        Your browser does not support the audio element.
                    </audio>
                </div>
            `;
        }
        
        messageDiv.innerHTML = `
            <div class="message-avatar" style="background-color: ${this.stringToColor(message.sender.name)};">
                <span style="color: white; font-weight: bold;">${this.getInitials(message.sender.name)}</span>
            </div>
            <div class="message-content">
                ${content}
                <div class="message-time">${this.formatTime(message.timestamp)}</div>
            </div>
        `;
        
        return messageDiv;
    }
    
    setupMessageInput() {
        const messageInput = document.getElementById('messageInput');
        
        // Auto-resize textarea
        messageInput.addEventListener('input', () => {
            messageInput.style.height = 'auto';
            messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
            
            // Enable/disable send button
            const sendBtn = document.getElementById('sendBtn');
            sendBtn.disabled = !messageInput.value.trim();
        });
        
        // Send on Enter (but not Shift+Enter)
        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
    }
    
    async sendMessage() {
        const messageInput = document.getElementById('messageInput');
        const content = messageInput.value.trim();
        
        if (!content || !this.currentChat) return;
        
        // For now, only support direct messages
        if (this.currentChat.type !== 'direct') {
            this.showNotification('Info', 'Group messaging coming soon.');
            return;
        }
        
        try {
            const response = await fetch(`${this.API_BASE_URL}/chat/message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${auth.getAccessToken()}`
                },
                credentials: 'include',
                body: JSON.stringify({
                    conversationId: this.currentChat.id,
                    content: content,
                    type: 'text'
                })
            });
            
            if (response.ok) {
                // Clear input
                messageInput.value = '';
                messageInput.style.height = 'auto';
                document.getElementById('sendBtn').disabled = true;
                
                // Reload messages
                await this.loadMessages();
                
                // Update conversation list
                await this.loadConversations();
                this.renderChatList();
            } else if (response.status === 401) {
                window.location.href = 'login.html';
            } else {
                this.showNotification('Error', 'Failed to send message.');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            this.showNotification('Error', 'Failed to send message.');
        }
    }
    
    async handleFileUpload(files) {
        if (!files.length || !this.currentChat) return;
        
        // For now, only support direct messages
        if (this.currentChat.type !== 'direct') {
            this.showNotification('Info', 'Group file sharing coming soon.');
            return;
        }
        
        try {
            const formData = new FormData();
            formData.append('file', files[0]);
            formData.append('conversationId', this.currentChat.id);
            formData.append('type', this.getFileType(files[0].type));
            
            const response = await fetch(`${this.API_BASE_URL}/chat/upload`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${auth.getAccessToken()}`
                },
                body: formData
            });
            
            if (response.ok) {
                // Reload messages
                await this.loadMessages();
                
                // Update conversation list
                await this.loadConversations();
                this.renderChatList();
                
                // Clear file input
                document.getElementById('fileInput').value = '';
            } else if (response.status === 401) {
                window.location.href = 'login.html';
            } else {
                this.showNotification('Error', 'Failed to upload file.');
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            this.showNotification('Error', 'Failed to upload file.');
        }
    }
    
    toggleEmojiPicker() {
        const emojiPicker = document.getElementById('emojiPicker');
        emojiPicker.classList.toggle('active');
    }
    
    insertEmoji(emoji) {
        const messageInput = document.getElementById('messageInput');
        const currentValue = messageInput.value;
        const cursorPos = messageInput.selectionStart;
        
        const newValue = currentValue.slice(0, cursorPos) + emoji + currentValue.slice(cursorPos);
        messageInput.value = newValue;
        messageInput.setSelectionRange(cursorPos + emoji.length, cursorPos + emoji.length);
        messageInput.focus();
        
        // Hide emoji picker
        document.getElementById('emojiPicker').classList.remove('active');
        
        // Update send button state
        document.getElementById('sendBtn').disabled = !messageInput.value.trim();
    }
    
    startCall(type) {
        if (!this.currentChat) {
            this.showNotification('Info', 'Please select a conversation to start a call.');
            return;
        }
        
        if (this.currentChat.type === 'group') {
            this.showNotification('Info', 'Group calls coming soon.');
            return;
        }
        
        this.isCallActive = true;
        this.callStartTime = new Date();
        
        const callModal = document.getElementById('callModal');
        const callTitle = document.getElementById('callTitle');
        const callUserName = document.getElementById('callUserName');
        const callStatus = document.getElementById('callStatus');
        
        callTitle.textContent = type === 'voice' ? 'Voice Call' : 'Video Call';
        
        if (this.currentChat.type === 'direct') {
            callUserName.textContent = this.currentChat.conversation.participant.name;
        } else {
            callUserName.textContent = this.currentChat.group.group_name;
        }
        
        callStatus.textContent = 'Connecting...';
        
        callModal.classList.add('active');
        
        // Simulate call connection
        setTimeout(() => {
            if (this.isCallActive) {
                callStatus.textContent = 'Connected';
                this.startCallTimer();
            }
        }, 2000);
        
        // Update video button based on call type
        const videoBtn = document.getElementById('videoToggleBtn');
        const videoIcon = videoBtn.querySelector('i');
        if (type === 'video') {
            videoIcon.className = 'fas fa-video';
            videoBtn.classList.add('active');
        } else {
            videoIcon.className = 'fas fa-video-slash';
            videoBtn.classList.remove('active');
        }
    }
    
    startCallTimer() {
        this.callInterval = setInterval(() => {
            if (!this.isCallActive) return;
            
            const duration = new Date() - this.callStartTime;
            const minutes = Math.floor(duration / 60000);
            const seconds = Math.floor((duration % 60000) / 1000);
            
            document.getElementById('callDuration').textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }
    
    toggleMute() {
        const muteBtn = document.getElementById('muteBtn');
        const icon = muteBtn.querySelector('i');
        
        muteBtn.classList.toggle('active');
        
        if (muteBtn.classList.contains('active')) {
            icon.className = 'fas fa-microphone-slash';
            muteBtn.title = 'Unmute';
        } else {
            icon.className = 'fas fa-microphone';
            muteBtn.title = 'Mute';
        }
    }
    
    toggleVideo() {
        const videoBtn = document.getElementById('videoToggleBtn');
        const icon = videoBtn.querySelector('i');
        
        videoBtn.classList.toggle('active');
        
        if (videoBtn.classList.contains('active')) {
            icon.className = 'fas fa-video';
            videoBtn.title = 'Turn off Video';
        } else {
            icon.className = 'fas fa-video-slash';
            videoBtn.title = 'Turn on Video';
        }
    }
    
    endCall() {
        this.isCallActive = false;
        
        if (this.callInterval) {
            clearInterval(this.callInterval);
            this.callInterval = null;
        }
        
        document.getElementById('callModal').classList.remove('active');
        
        // Reset call controls
        document.getElementById('muteBtn').classList.remove('active');
        document.getElementById('videoToggleBtn').classList.remove('active');
        document.getElementById('callDuration').textContent = '00:00';
    }
    
    toggleParticipantsPanel() {
        const panel = document.getElementById('participantsPanel');
        panel.classList.toggle('active');
        
        if (panel.classList.contains('active')) {
            if (this.currentChat?.type === 'direct') {
                this.updateParticipantsPanel();
            } else if (this.currentChat?.type === 'group') {
                this.updateGroupParticipantsPanel();
            }
        }
    }
    
    updateParticipantsPanel() {
        if (!this.currentChat || this.currentChat.type !== 'direct') return;
        
        const participantsList = document.getElementById('participantsList');
        participantsList.innerHTML = '';
        
        // For direct chats, show the other participant
        const participant = this.currentChat.conversation.participant;
        
        const participantItem = document.createElement('div');
        participantItem.className = 'participant-item';
        
        participantItem.innerHTML = `
            <div class="participant-avatar" style="background-color: ${this.stringToColor(participant.name)};">
                <span style="color: white; font-weight: bold;">${this.getInitials(participant.name)}</span>
            </div>
            <div class="participant-info">
                <h4>${participant.name}</h4>
                <span class="participant-role">${participant.course || 'Student'}</span>
            </div>
        `;
        
        participantsList.appendChild(participantItem);
    }
    
    async updateGroupParticipantsPanel() {
        if (!this.currentChat || this.currentChat.type !== 'group') return;
        
        const participantsList = document.getElementById('participantsList');
        participantsList.innerHTML = '';
        
        try {
            // Fetch group members
            const response = await fetch(`${this.API_BASE_URL}/groups/${this.currentChat.id}/members`, {
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${auth.getAccessToken()}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                const members = data.members || [];
                
                if (members.length === 0) {
                    participantsList.innerHTML = '<p class="text-muted">No members found.</p>';
                    return;
                }
                
                members.forEach(member => {
                    const participantItem = document.createElement('div');
                    participantItem.className = 'participant-item';
                    
                    participantItem.innerHTML = `
                        <div class="participant-avatar" style="background-color: ${this.stringToColor(member.name)};">
                            <span style="color: white; font-weight: bold;">${this.getInitials(member.name)}</span>
                        </div>
                        <div class="participant-info">
                            <h4>${member.name}</h4>
                            <span class="participant-role">${member.role} • ${member.member_status}</span>
                        </div>
                    `;
                    
                    participantsList.appendChild(participantItem);
                });
            } else {
                participantsList.innerHTML = '<p class="text-muted">Error loading group members.</p>';
            }
        } catch (error) {
            console.error('Error loading group members:', error);
            participantsList.innerHTML = '<p class="text-muted">Error loading group members.</p>';
        }
    }
    
    showNewChatDialog() {
        // Show modal with connected participants
        const modal = document.getElementById('newGroupModal'); // Reusing group modal for now
        const participantsSelector = document.getElementById('participantsSelector');
        
        // Clear previous data
        document.getElementById('groupName').value = '';
        document.getElementById('groupDescription').value = '';
        participantsSelector.innerHTML = '';
        
        // Set title for new chat
        document.querySelector('#newGroupModal .modal-header h3').textContent = 'Start New Chat';
        
        // Hide group-specific fields
        document.getElementById('groupName').closest('.form-group').style.display = 'none';
        document.getElementById('groupDescription').closest('.form-group').style.display = 'none';
        
        // Populate participants selector with connected users
        this.connectedParticipants.forEach(participant => {
            // Check if conversation already exists
            const existingConversation = this.conversations.find(c => 
                c.participant && c.participant._id === participant.user_id
            );
            
            const option = document.createElement('div');
            option.className = 'participant-option';
            option.innerHTML = `
                <input type="radio" name="participant" id="participant_${participant.user_id}" value="${participant.user_id}">
                <label for="participant_${participant.user_id}">${participant.name} ${existingConversation ? '(Existing chat)' : ''}</label>
            `;
            
            participantsSelector.appendChild(option);
        });
        
        // Update button text
        document.getElementById('createGroupBtn').textContent = 'Start Chat';
        
        modal.classList.add('active');
    }
    
    showNewGroupDialog() {
        const modal = document.getElementById('newGroupModal');
        const participantsSelector = document.getElementById('participantsSelector');
        
        // Clear previous data
        document.getElementById('groupName').value = '';
        document.getElementById('groupDescription').value = '';
        participantsSelector.innerHTML = '';
        
        // Set title for new group
        document.querySelector('#newGroupModal .modal-header h3').textContent = 'Create New Group';
        
        // Show group-specific fields
        document.getElementById('groupName').closest('.form-group').style.display = 'block';
        document.getElementById('groupDescription').closest('.form-group').style.display = 'block';
        
        // Populate participants selector
        this.connectedParticipants.forEach(participant => {
            const option = document.createElement('div');
            option.className = 'participant-option';
            option.innerHTML = `
                <input type="checkbox" id="participant_${participant.user_id}" value="${participant.user_id}">
                <label for="participant_${participant.user_id}">${participant.name}</label>
            `;
            
            participantsSelector.appendChild(option);
        });
        
        // Update button text
        document.getElementById('createGroupBtn').textContent = 'Create Group';
        
        modal.classList.add('active');
    }
    
    async createGroup() {
        if (!this.currentUserProfile) {
            this.showNotification('Error', 'User profile not available. Please try again.');
            return;
        }
        
        const groupName = document.getElementById('groupName').value.trim();
        const groupDescription = document.getElementById('groupDescription').value.trim();
        
        if (!groupName) {
            this.showNotification('Error', 'Please enter a group name.');
            return;
        }
        
        try {
            const response = await fetch(`${this.API_BASE_URL}/groups/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${auth.getAccessToken()}`
                },
                credentials: 'include',
                body: JSON.stringify({
                    name: groupName,
                    description: groupDescription,
                    subject: 'General', // Default subject
                    creator_id: this.currentUserProfile.user_id,
                    max_members: 10, // Default max members
                    is_private: false // Default to public
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                this.showNotification('Success', `Group "${data.group.name}" created successfully!`);
                
                // Reload groups
                await this.loadUserGroups();
                this.renderChatList();
                
                this.closeModal('newGroupModal');
            } else {
                const errorData = await response.json();
                this.showNotification('Error', errorData.error || 'Failed to create group.');
            }
        } catch (error) {
            console.error('Error creating group:', error);
            this.showNotification('Error', 'Failed to create group.');
        }
    }
    
    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    }
    
    searchChats(query) {
        const chatItems = document.querySelectorAll('.chat-item');
        
        chatItems.forEach(item => {
            const name = item.querySelector('.chat-name').textContent.toLowerCase();
            const lastMessage = item.querySelector('.chat-last-message').textContent.toLowerCase();
            
            const matches = name.includes(query.toLowerCase()) || 
                           lastMessage.includes(query.toLowerCase());
            
            item.style.display = matches ? 'flex' : 'none';
        });
    }
    
    // Utility functions
    getInitials(name) {
        return name.split(' ').map(part => part[0]).join('').toUpperCase().substring(0, 2);
    }
    
    stringToColor(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        const hue = hash % 360;
        return `hsl(${hue}, 70%, 60%)`;
    }
    
    formatTime(timestamp) {
        const now = new Date();
        const date = new Date(timestamp);
        const diff = now - date;
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
        
        return date.toLocaleDateString();
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    getFileType(mimeType) {
        if (mimeType.startsWith('image/')) return 'image';
        if (mimeType.startsWith('video/')) return 'video';
        if (mimeType.startsWith('audio/')) return 'audio';
        return 'file';
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    showNotification(title, message) {
        // Create a simple notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            padding: 15px;
            border-radius: 5px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 10000;
            border-left: 4px solid var(--study-blue);
        `;
        
        notification.innerHTML = `
            <strong>${title}</strong>
            <p style="margin: 5px 0 0;">${message}</p>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
}

// Initialize the chatroom app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const chatroomApp = new ChatroomApp();
    
    // Logout functionality
    const logoutButtons = document.querySelectorAll('#logoutButton, #mobileLogoutButton');
    logoutButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (typeof auth !== 'undefined') {
                auth.handleLogout();
            } else {
                window.location.href = 'login.html';
            }
        });
    });
    
    // Set up real-time updates (using polling for simplicity)
    setInterval(() => {
        if (chatroomApp.currentChat) {
            chatroomApp.loadConversations().then(() => {
                chatroomApp.renderChatList();
            });
            
            // Also update groups list periodically
            chatroomApp.loadUserGroups().then(() => {
                chatroomApp.renderChatList();
            });
        }
    }, 30000); // Check every 30 seconds
});