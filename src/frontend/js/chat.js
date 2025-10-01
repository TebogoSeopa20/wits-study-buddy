// chat.js - Study Group Chat Functionality
document.addEventListener('DOMContentLoaded', function() {
    // API configuration
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const API_BASE_URL = isLocal 
        ? 'http://localhost:3000/api' 
        : 'https://wits-buddy-g9esajarfqe3dmh6.southafricanorth-01.azurewebsites.net/api';
    
    // State management
    let currentUser = null;
    let userGroups = [];
    let currentGroup = null;
    let currentChat = null;
    let messages = [];
    let typingUsers = new Set();
    
    // DOM elements
    const groupsList = document.getElementById('groupsList');
    const welcomeScreen = document.getElementById('welcomeScreen');
    const activeChat = document.getElementById('activeChat');
    const messagesList = document.getElementById('messagesList');
    const messagesScroll = document.getElementById('messagesScroll');
    const messageInput = document.getElementById('messageInput');
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    const groupSearch = document.getElementById('groupSearch');
    const refreshGroupsBtn = document.getElementById('refreshGroupsBtn');
    const backToGroups = document.getElementById('backToGroups');
    const infoSidebar = document.getElementById('infoSidebar');
    const closeInfoSidebar = document.getElementById('closeInfoSidebar');
    const groupInfoBtn = document.getElementById('groupInfoBtn');
    const notesBtn = document.getElementById('notesBtn');
    const membersBtn = document.getElementById('membersBtn');
    const infoContent = document.getElementById('infoContent');
    const typingIndicator = document.getElementById('typingIndicator');
    const typingUsersEl = document.getElementById('typingUsers');
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    
    // Modal elements
    const fileUploadModal = document.getElementById('fileUploadModal');
    const noteUploadModal = document.getElementById('noteUploadModal');
    const attachFileBtn = document.getElementById('attachFileBtn');
    const addNoteBtn = document.getElementById('addNoteBtn');
    const fileInput = document.getElementById('fileInput');
    const noteFile = document.getElementById('noteFile');
    const cancelFileUpload = document.getElementById('cancelFileUpload');
    const confirmFileUpload = document.getElementById('confirmFileUpload');
    const cancelNoteUpload = document.getElementById('cancelNoteUpload');
    const confirmNoteUpload = document.getElementById('confirmNoteUpload');
    
    // Initialize the chat
    init();
    
    async function init() {
        // Get current user from sessionStorage
        if (typeof auth !== 'undefined' && auth.getCurrentUser) {
            currentUser = auth.getCurrentUser();
        } else {
            // Fallback to direct sessionStorage access
            const userData = sessionStorage.getItem('user');
            currentUser = userData ? JSON.parse(userData) : null;
        }
        
        if (!currentUser || !currentUser.id) {
            // Redirect to login if no user data
            window.location.href = '../index.html';
            return;
        }
        
        // Update user info in sidebar
        updateUserInfo();
        
        // Set up event listeners
        setupEventListeners();
        
        // Load user's groups
        await loadUserGroups();
        
        // Check for group parameter in URL
        const urlParams = new URLSearchParams(window.location.search);
        const groupId = urlParams.get('group');
        if (groupId) {
            await joinGroupChat(groupId);
        }
    }
    
    function updateUserInfo() {
        if (currentUser) {
            userAvatar.textContent = getInitials(currentUser.name || currentUser.email);
            userName.textContent = currentUser.name || currentUser.email;
        }
    }
    
    function setupEventListeners() {
        // Group search
        groupSearch.addEventListener('input', debounce(() => {
            filterGroups();
        }, 300));
        
        // Refresh groups
        refreshGroupsBtn.addEventListener('click', loadUserGroups);
        
        // Back to groups (mobile)
        backToGroups.addEventListener('click', showGroupsList);
        
        // Message input
        messageInput.addEventListener('input', handleMessageInput);
        messageInput.addEventListener('keydown', handleMessageKeydown);
        sendMessageBtn.addEventListener('click', sendMessage);
        
        // Sidebar actions
        groupInfoBtn.addEventListener('click', showGroupInfo);
        notesBtn.addEventListener('click', showGroupNotes);
        membersBtn.addEventListener('click', showGroupMembers);
        closeInfoSidebar.addEventListener('click', closeInfoSidebarHandler);
        
        // File and note upload
        attachFileBtn.addEventListener('click', openFileUploadModal);
        addNoteBtn.addEventListener('click', openNoteUploadModal);
        
        // File upload modal
        fileInput.addEventListener('change', handleFileSelect);
        cancelFileUpload.addEventListener('click', closeFileUploadModal);
        confirmFileUpload.addEventListener('click', uploadFile);
        
        // Note upload modal
        noteFile.addEventListener('change', handleNoteFileSelect);
        cancelNoteUpload.addEventListener('click', closeNoteUploadModal);
        confirmNoteUpload.addEventListener('click', uploadNote);
        
        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                closeModal(modal);
            });
        });
        
        // Click outside modals to close
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                closeAllModals();
            }
        });
        
        // Mobile menu (if exists)
        const mobileMenuBtn = document.getElementById('mobile-menu-button');
        const mobileNav = document.getElementById('mobile-nav');
        const mobileNavClose = document.getElementById('mobile-nav-close');
        
        if (mobileMenuBtn && mobileNav) {
            mobileMenuBtn.addEventListener('click', () => {
                mobileNav.classList.add('active');
            });
            
            mobileNavClose.addEventListener('click', () => {
                mobileNav.classList.remove('active');
            });
        }
    }
    
    async function loadUserGroups() {
        try {
            showGroupsLoading();
            
            const response = await fetch(`${API_BASE_URL}/groups/user/${currentUser.id}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            userGroups = data.groups || [];
            
            displayGroups(userGroups);
            
        } catch (error) {
            console.error('Error loading user groups:', error);
            showGroupsError('Failed to load groups. Please try again.');
        }
    }
    
function displayGroups(groups) {
    if (groups.length === 0) {
        showNoGroups();
        return;
    }
    
    groupsList.innerHTML = groups.map(group => createGroupItem(group)).join('');
    
    // Add limited groups class if more than 2 groups
    if (groups.length > 2) {
        groupsList.classList.add('has-many-groups');
    } else {
        groupsList.classList.remove('has-many-groups');
    }
    
    // Add click event listeners to group items
    document.querySelectorAll('.group-item').forEach(item => {
        item.addEventListener('click', async () => {
            const groupId = item.dataset.groupId;
            await joinGroupChat(groupId);
        });
    });
}
    
    function createGroupItem(group) {
        const initials = getInitials(group.group_name || 'G');
        const isActive = currentGroup && currentGroup.id === group.group_id;
        
        return `
            <div class="group-item ${isActive ? 'active' : ''}" data-group-id="${group.group_id}">
                <div class="group-item-header">
                    <div class="group-avatar">${initials}</div>
                    <div class="group-details">
                        <div class="group-name">${group.group_name || 'Unnamed Group'}</div>
                        <div class="group-subject">${group.subject || 'General'}</div>
                    </div>
                </div>
                <div class="group-meta">
                    <div class="member-count">
                        <i class="fas fa-users"></i>
                        ${group.member_count || 0}
                    </div>
                    ${group.unread_count > 0 ? `
                        <div class="unread-badge">${group.unread_count}</div>
                    ` : ''}
                </div>
                <div class="last-message">
                    ${group.last_message || 'No messages yet'}
                </div>
            </div>
        `;
    }
    
    async function joinGroupChat(groupId) {
        try {
            // Find the group in user's groups
            const group = userGroups.find(g => g.group_id === groupId);
            if (!group) {
                throw new Error('Group not found in your groups');
            }
            
            currentGroup = group;
            
            // Update UI to show active chat
            showActiveChat();
            updateChatHeader();
            
            // Load or create chat for this group
            await loadOrCreateChat();
            
            // Load messages
            await loadMessages();
            
            // Update groups list to show active state
            updateGroupsList();
            
            // Update URL without page reload
            const newUrl = `${window.location.pathname}?group=${groupId}`;
            window.history.pushState({}, '', newUrl);
            
        } catch (error) {
            console.error('Error joining group chat:', error);
            showError('Failed to join chat. Please try again.');
        }
    }
    
    async function loadOrCreateChat() {
        try {
            // First, try to get existing chats for this group
            const response = await fetch(`${API_BASE_URL}/groups/${currentGroup.group_id}/chats`);
            
            if (response.ok) {
                const data = await response.json();
                const chats = data.chats || [];
                
                // Use the general chat or create one if none exists
                if (chats.length > 0) {
                    currentChat = chats.find(chat => chat.chat_type === 'general') || chats[0];
                } else {
                    // Create a new general chat
                    await createGeneralChat();
                }
            } else {
                // Create a new general chat
                await createGeneralChat();
            }
            
        } catch (error) {
            console.error('Error loading/creating chat:', error);
            // Create a new general chat as fallback
            await createGeneralChat();
        }
    }
    
async function createGeneralChat() {
    try {
        // First, ensure the user has a profile
        await ensureUserProfile();
        
        const response = await fetch(`${API_BASE_URL}/groups/${currentGroup.group_id}/chats/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: 'General Chat',
                chat_type: 'general',
                created_by: currentUser.id
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            currentChat = data.chat;
        } else {
            // If creation fails due to profile issue, try alternative approach
            await createChatWithFallback();
        }
    } catch (error) {
        console.error('Error creating chat:', error);
        // Try fallback method
        await createChatWithFallback();
    }
}

async function ensureUserProfile() {
    try {
        // Check if user has a profile
        const response = await fetch(`${API_BASE_URL}/profiles/user/${currentUser.id}`);
        if (!response.ok) {
            // Create a basic profile if it doesn't exist
            await fetch(`${API_BASE_URL}/profiles`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: currentUser.id,
                    name: currentUser.name || currentUser.email,
                    email: currentUser.email,
                    role: 'student',
                    faculty: 'Not specified',
                    course: 'Not specified',
                    year_of_study: '1st Year',
                    phone: 'Not provided',
                    terms_agreed: true
                })
            });
        }
    } catch (error) {
        console.error('Error ensuring user profile:', error);
    }
}

async function createChatWithFallback() {
    try {
        // Alternative: Use a system user or group creator as fallback
        const groupResponse = await fetch(`${API_BASE_URL}/groups/${currentGroup.group_id}`);
        if (groupResponse.ok) {
            const groupData = await groupResponse.json();
            const creatorId = groupData.group.creator_id;
            
            const response = await fetch(`${API_BASE_URL}/groups/${currentGroup.group_id}/chats/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: 'General Chat',
                    chat_type: 'general',
                    created_by: creatorId // Use group creator as fallback
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                currentChat = data.chat;
            }
        }
    } catch (fallbackError) {
        console.error('Fallback chat creation also failed:', fallbackError);
        throw fallbackError;
    }
}
    
    async function loadMessages() {
        try {
            if (!currentChat) return;
            
            showMessagesLoading();
            
            const response = await fetch(`${API_BASE_URL}/chats/${currentChat.id}/messages?user_id=${currentUser.id}&limit=100`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            messages = data.messages || [];
            
            displayMessages(messages);
            
        } catch (error) {
            console.error('Error loading messages:', error);
            showMessagesError('Failed to load messages.');
        }
    }
    
    function displayMessages(messages) {
        if (messages.length === 0) {
            showNoMessages();
            return;
        }
        
        messagesList.innerHTML = messages.map(message => createMessageElement(message)).join('');
        scrollToBottom();
    }
    
    function createMessageElement(message) {
        const isOwn = message.sender_id === currentUser.id;
        const senderInitials = getInitials(message.sender_name || 'U');
        const messageTime = formatMessageTime(message.created_at);
        
        let messageContent = '';
        
        if (message.message_type === 'text') {
            messageContent = `
                <div class="message-text">${escapeHtml(message.content)}</div>
            `;
        } else if (message.message_type === 'document' || message.message_type === 'note') {
            const fileSize = message.document_size ? formatFileSize(message.document_size) : 'Unknown size';
            messageContent = `
                <div class="file-message">
                    <div class="file-preview">
                        <div class="file-icon">
                            <i class="fas fa-file${message.message_type === 'note' ? '-alt' : ''}"></i>
                        </div>
                        <div class="file-info">
                            <div class="file-name">${escapeHtml(message.document_name || 'File')}</div>
                            <div class="file-size">${fileSize}</div>
                        </div>
                        <button class="download-btn" onclick="downloadFile('${message.document_url}', '${message.document_name}')">
                            <i class="fas fa-download"></i> Download
                        </button>
                    </div>
                    ${message.content ? `<div class="message-text" style="margin-top: 0.5rem;">${escapeHtml(message.content)}</div>` : ''}
                </div>
            `;
        }
        
        return `
            <div class="message ${isOwn ? 'own' : 'other'}">
                <div class="message-avatar">${senderInitials}</div>
                <div class="message-content">
                    <div class="message-header">
                        <div class="message-sender">${isOwn ? 'You' : escapeHtml(message.sender_name || 'Unknown')}</div>
                        <div class="message-time">${messageTime}</div>
                    </div>
                    ${messageContent}
                </div>
            </div>
        `;
    }
    
    async function sendMessage() {
        const content = messageInput.value.trim();
        if (!content || !currentChat) return;
        
        try {
            const messageData = {
                chat_id: currentChat.id,
                sender_id: currentUser.id,
                content: content,
                message_type: 'text'
            };
            
            const response = await fetch(`${API_BASE_URL}/chats/${currentChat.id}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(messageData)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            // Clear input
            messageInput.value = '';
            adjustTextareaHeight();
            updateSendButtonState();
            
            // Reload messages to show the new one
            await loadMessages();
            
        } catch (error) {
            console.error('Error sending message:', error);
            showError('Failed to send message. Please try again.');
        }
    }
    
    async function uploadFile() {
        const file = fileInput.files[0];
        if (!file || !currentChat) return;
        
        try {
            // In a real implementation, you would upload the file to a storage service first
            // For now, we'll simulate the file upload and create a message
            
            const fileDescription = document.getElementById('fileDescription').value.trim();
            
            const messageData = {
                chat_id: currentChat.id,
                sender_id: currentUser.id,
                content: fileDescription || `Shared file: ${file.name}`,
                message_type: 'document',
                document_name: file.name,
                document_size: file.size,
                document_type: file.type,
                document_url: URL.createObjectURL(file) // Temporary URL for demo
            };
            
            const response = await fetch(`${API_BASE_URL}/chats/${currentChat.id}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(messageData)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            closeFileUploadModal();
            await loadMessages();
            showSuccess('File shared successfully!');
            
        } catch (error) {
            console.error('Error uploading file:', error);
            showError('Failed to share file. Please try again.');
        }
    }
    
    async function uploadNote() {
        const file = noteFile.files[0];
        const noteTitle = document.getElementById('noteTitle').value.trim();
        
        if (!file || !noteTitle || !currentChat) return;
        
        try {
            const noteData = {
                chat_id: currentChat.id,
                uploaded_by: currentUser.id,
                title: noteTitle,
                description: document.getElementById('noteDescription').value.trim(),
                file_name: file.name,
                file_size: file.size,
                file_type: file.type,
                file_url: URL.createObjectURL(file), // Temporary URL for demo
                subject_area: document.getElementById('noteSubject').value.trim()
            };
            
            const response = await fetch(`${API_BASE_URL}/chats/${currentChat.id}/share-note`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(noteData)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            closeNoteUploadModal();
            await loadMessages();
            showSuccess('Note shared successfully!');
            
        } catch (error) {
            console.error('Error uploading note:', error);
            showError('Failed to share note. Please try again.');
        }
    }
    
    // UI Management Functions
    function showActiveChat() {
        welcomeScreen.style.display = 'none';
        activeChat.style.display = 'flex';
        
        // On mobile, hide groups list
        if (window.innerWidth <= 768) {
            document.querySelector('.chat-sidebar').classList.remove('active');
        }
    }
    
    function showGroupsList() {
        // On mobile, show groups list
        if (window.innerWidth <= 768) {
            document.querySelector('.chat-sidebar').classList.add('active');
        }
    }
    
    function updateChatHeader() {
        if (!currentGroup) return;
        
        document.getElementById('chatGroupName').textContent = currentGroup.group_name || 'Unnamed Group';
        document.getElementById('chatMemberCount').textContent = `${currentGroup.member_count || 0} members`;
        document.getElementById('chatGroupAvatar').textContent = getInitials(currentGroup.group_name || 'G');
    }
    
    function updateGroupsList() {
        document.querySelectorAll('.group-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.groupId === currentGroup.group_id) {
                item.classList.add('active');
            }
        });
    }
    
    function showGroupInfo() {
        if (!currentGroup) return;
        
        infoContent.innerHTML = `
            <div class="group-info-section">
                <h4>Group Details</h4>
                <div class="group-detail-item">
                    <span class="detail-label">Name:</span>
                    <span class="detail-value">${escapeHtml(currentGroup.group_name || 'Unnamed Group')}</span>
                </div>
                <div class="group-detail-item">
                    <span class="detail-label">Subject:</span>
                    <span class="detail-value">${escapeHtml(currentGroup.subject || 'Not specified')}</span>
                </div>
                <div class="group-detail-item">
                    <span class="detail-label">Faculty:</span>
                    <span class="detail-value">${escapeHtml(currentGroup.faculty || 'Not specified')}</span>
                </div>
                <div class="group-detail-item">
                    <span class="detail-label">Members:</span>
                    <span class="detail-value">${currentGroup.member_count || 0}</span>
                </div>
                <div class="group-detail-item">
                    <span class="detail-label">Created:</span>
                    <span class="detail-value">${formatDate(currentGroup.created_at)}</span>
                </div>
            </div>
        `;
        
        infoSidebar.classList.add('active');
    }
    
    async function showGroupMembers() {
        if (!currentGroup) return;
        
        try {
            const response = await fetch(`${API_BASE_URL}/groups/${currentGroup.group_id}/members`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            const members = data.members || [];
            
            infoContent.innerHTML = `
                <div class="group-info-section">
                    <h4>Group Members (${members.length})</h4>
                    <div class="members-list">
                        ${members.map(member => `
                            <div class="member-item">
                                <div class="member-avatar">${getInitials(member.name || 'U')}</div>
                                <div class="member-details">
                                    <div class="member-name">${escapeHtml(member.name || 'Unknown User')}</div>
                                    <div class="member-role">${member.role}</div>
                                </div>
                                <div class="member-status">
                                    <span class="online-indicator"></span>
                                    <span>Online</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            
            infoSidebar.classList.add('active');
            
        } catch (error) {
            console.error('Error loading group members:', error);
            infoContent.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Failed to load members</p>
                </div>
            `;
            infoSidebar.classList.add('active');
        }
    }
    
    async function showGroupNotes() {
        if (!currentChat) return;
        
        try {
            const response = await fetch(`${API_BASE_URL}/chats/${currentChat.id}/notes?user_id=${currentUser.id}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            const notes = data.notes || [];
            
            infoContent.innerHTML = `
                <div class="group-info-section">
                    <h4>Shared Notes (${notes.length})</h4>
                    ${notes.length === 0 ? `
                        <div class="empty-state">
                            <i class="fas fa-file-alt"></i>
                            <p>No notes shared yet</p>
                        </div>
                    ` : `
                        <div class="members-list">
                            ${notes.map(note => `
                                <div class="member-item">
                                    <div class="file-icon">
                                        <i class="fas fa-file-alt"></i>
                                    </div>
                                    <div class="member-details">
                                        <div class="member-name">${escapeHtml(note.title)}</div>
                                        <div class="member-role">By ${escapeHtml(note.profiles?.name || 'Unknown')}</div>
                                    </div>
                                    <button class="download-btn" onclick="downloadFile('${note.file_url}', '${note.file_name}')">
                                        <i class="fas fa-download"></i>
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
            `;
            
            infoSidebar.classList.add('active');
            
        } catch (error) {
            console.error('Error loading group notes:', error);
            infoContent.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Failed to load notes</p>
                </div>
            `;
            infoSidebar.classList.add('active');
        }
    }
    
    // Modal Management
    function openFileUploadModal() {
        if (!currentChat) {
            showError('Please select a chat first.');
            return;
        }
        openModal(fileUploadModal);
    }
    
    function closeFileUploadModal() {
        closeModal(fileUploadModal);
        document.getElementById('fileUploadForm').reset();
        document.getElementById('filePreview').style.display = 'none';
    }
    
    function openNoteUploadModal() {
        if (!currentChat) {
            showError('Please select a chat first.');
            return;
        }
        openModal(noteUploadModal);
    }
    
    function closeNoteUploadModal() {
        closeModal(noteUploadModal);
        document.getElementById('noteUploadForm').reset();
        document.getElementById('notePreview').style.display = 'none';
    }
    
    function openModal(modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    function closeModal(modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
    
    function closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            closeModal(modal);
        });
    }
    
    function closeInfoSidebarHandler() {
        infoSidebar.classList.remove('active');
    }
    
    // Event Handlers
    function handleMessageInput() {
        adjustTextareaHeight();
        updateSendButtonState();
        
        // Handle typing indicators (simplified)
        if (messageInput.value.trim()) {
            // In a real app, you would send a typing indicator to the server
        }
    }
    
    function handleMessageKeydown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    }
    
    function handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            document.getElementById('fileName').textContent = file.name;
            document.getElementById('fileSize').textContent = formatFileSize(file.size);
            document.getElementById('filePreview').style.display = 'flex';
            confirmFileUpload.disabled = false;
        }
    }
    
    function handleNoteFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            document.getElementById('noteFileName').textContent = file.name;
            document.getElementById('noteFileSize').textContent = formatFileSize(file.size);
            document.getElementById('notePreview').style.display = 'flex';
            confirmNoteUpload.disabled = !document.getElementById('noteTitle').value.trim();
        }
    }
    
    // Utility Functions
    function adjustTextareaHeight() {
        messageInput.style.height = 'auto';
        messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
    }
    
    function updateSendButtonState() {
        sendMessageBtn.disabled = !messageInput.value.trim();
    }
    
    function scrollToBottom() {
        messagesScroll.scrollTop = messagesScroll.scrollHeight;
    }
    
    function filterGroups() {
        const searchTerm = groupSearch.value.toLowerCase();
        const filteredGroups = userGroups.filter(group => 
            group.group_name.toLowerCase().includes(searchTerm) ||
            group.subject.toLowerCase().includes(searchTerm) ||
            group.faculty.toLowerCase().includes(searchTerm)
        );
        displayGroups(filteredGroups);
    }
    
    function getInitials(name) {
        if (!name) return '?';
        return name.split(' ')
            .map(part => part.charAt(0))
            .join('')
            .toUpperCase()
            .substring(0, 2);
    }
    
    function formatMessageTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) { // Less than 1 minute
            return 'Just now';
        } else if (diff < 3600000) { // Less than 1 hour
            return Math.floor(diff / 60000) + 'm ago';
        } else if (diff < 86400000) { // Less than 1 day
            return Math.floor(diff / 3600000) + 'h ago';
        } else {
            return date.toLocaleDateString();
        }
    }
    
    function formatDate(timestamp) {
        return new Date(timestamp).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
    
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    
    // Loading States
    function showGroupsLoading() {
        groupsList.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Loading your groups...</p>
            </div>
        `;
    }
    
    function showGroupsError(message) {
        groupsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <h3>Error</h3>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="loadUserGroups()">Try Again</button>
            </div>
        `;
    }
    
    function showNoGroups() {
        groupsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <h3>No Groups Joined</h3>
                <p>You haven't joined any study groups yet. Join a group from the Groups page to start chatting!</p>
                <button class="btn btn-primary" onclick="window.location.href='student-groups.html'">
                    Browse Groups
                </button>
            </div>
        `;
    }
    
    function showMessagesLoading() {
        messagesList.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Loading messages...</p>
            </div>
        `;
    }
    
    function showMessagesError(message) {
        messagesList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>${message}</p>
                <button class="btn btn-outline" onclick="loadMessages()">Retry</button>
            </div>
        `;
    }
    
    function showNoMessages() {
        messagesList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-comments"></i>
                <h3>No Messages Yet</h3>
                <p>Start the conversation by sending the first message!</p>
            </div>
        `;
    }
    
    // Notification Functions
    function showError(message) {
        showToast(message, 'error');
    }
    
    function showSuccess(message) {
        showToast(message, 'success');
    }
    
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast-notification ${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
            <button class="toast-close">&times;</button>
        `;
        
        document.body.appendChild(toast);
        
        // Add close button functionality
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.remove();
        });
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 5000);
    }
    
    // Global function for file downloads
    window.downloadFile = function(url, filename) {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };
    
    // Utility function for debouncing
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // Handle browser back/forward buttons
    window.addEventListener('popstate', function(event) {
        const urlParams = new URLSearchParams(window.location.search);
        const groupId = urlParams.get('group');
        if (groupId) {
            joinGroupChat(groupId);
        } else {
            welcomeScreen.style.display = 'flex';
            activeChat.style.display = 'none';
            currentGroup = null;
            updateGroupsList();
        }
    });
});