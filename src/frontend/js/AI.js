// AI Chat Functionality with Gemini 2.5 Integration
class AIChat {
    constructor() {
        this.apiKey = 'apiKey';
        this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
        this.conversationHistory = [];
        this.isProcessing = false;
        
        this.initializeElements();
        this.attachEventListeners();
    }

    initializeElements() {
        // Modal elements
        this.aiModal = document.getElementById('aiChatModal');
        this.openAIBtn = document.getElementById('openAIChatBtn');
        this.closeAIBtn = this.aiModal.querySelector('.modal-close');
        
        // Chat elements
        this.aiMessages = document.getElementById('aiMessages');
        this.aiMessageInput = document.getElementById('aiMessageInput');
        this.sendAIBtn = document.getElementById('sendAIMessageBtn');
        this.aiTypingIndicator = document.getElementById('aiTypingIndicator');
        
        // Suggestion buttons
        this.suggestionBtns = document.querySelectorAll('.ai-suggestion-btn');
    }

    attachEventListeners() {
        // Open AI Chat
        this.openAIBtn.addEventListener('click', () => this.openAIChat());
        
        // Close AI Chat
        this.closeAIBtn.addEventListener('click', () => this.closeAIChat());
        
        // Send message
        this.sendAIBtn.addEventListener('click', () => this.sendMessage());
        
        // Enter key to send
        this.aiMessageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Auto-resize textarea
        this.aiMessageInput.addEventListener('input', () => this.autoResizeTextarea());
        
        // Suggestion buttons
        this.suggestionBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const question = btn.getAttribute('data-question');
                this.aiMessageInput.value = question;
                this.sendMessage();
            });
        });
        
        // Close modal on outside click
        this.aiModal.addEventListener('click', (e) => {
            if (e.target === this.aiModal) {
                this.closeAIChat();
            }
        });
    }

    openAIChat() {
        this.aiModal.classList.add('active');
        this.aiMessageInput.focus();
        this.scrollToBottom();
    }

    closeAIChat() {
        this.aiModal.classList.remove('active');
        this.aiMessageInput.value = '';
        this.autoResizeTextarea();
    }

    autoResizeTextarea() {
        const textarea = this.aiMessageInput;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }

    async sendMessage() {
        const message = this.aiMessageInput.value.trim();
        
        if (!message || this.isProcessing) return;
        
        // Add user message to chat
        this.addMessage(message, 'user');
        this.aiMessageInput.value = '';
        this.autoResizeTextarea();
        this.sendAIBtn.disabled = true;
        
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
            this.isProcessing = true;
            const response = await this.getAIResponse(message);
            this.addMessage(response, 'assistant');
        } catch (error) {
            console.error('AI Error:', error);
            this.addMessage('Sorry, I encountered an error. Please try again.', 'assistant');
        } finally {
            this.isProcessing = false;
            this.hideTypingIndicator();
            this.sendAIBtn.disabled = false;
            this.scrollToBottom();
        }
    }

    async getAIResponse(userMessage) {
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: userMessage,
                    context: 'Study assistance and academic support'
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const data = await response.json();
            
            if (!data.message) {
                throw new Error('Invalid response format from AI');
            }

            return data.message;

        } catch (error) {
            console.error('API Error:', error);
            
            // Fallback responses if API fails
            const fallbackResponses = {
                math: "I'd be happy to help with math problems! For algebra, remember to isolate the variable. For calculus, focus on understanding the fundamental concepts. Could you provide the specific problem you're working on?",
                science: "Science concepts can be complex but fascinating! Whether it's physics, chemistry, or biology, breaking down concepts into smaller parts helps understanding. What specific topic are you studying?",
                programming: "Programming requires practice and patience. Start with understanding the basics like variables, loops, and functions. Debugging is a normal part of the process. What language or concept are you working on?",
                study: "Effective studying involves active recall and spaced repetition. Try explaining concepts in your own words and take regular breaks using the Pomodoro technique (25 min study, 5 min break).",
                writing: "For academic writing, start with a clear thesis statement and outline. Make sure each paragraph supports your main argument with evidence. Proofread carefully for clarity and grammar.",
                default: "I'm here to help with your academic questions! Whether it's math, science, programming, or study strategies, I can provide explanations and guidance. What specific topic would you like help with?"
            };

            const message = userMessage.toLowerCase();
            let fallbackMessage = fallbackResponses.default;

            if (message.includes('math') || message.includes('calculate') || message.includes('equation')) {
                fallbackMessage = fallbackResponses.math;
            } else if (message.includes('science') || message.includes('physics') || message.includes('chemistry') || message.includes('biology')) {
                fallbackMessage = fallbackResponses.science;
            } else if (message.includes('programming') || message.includes('code') || message.includes('algorithm')) {
                fallbackMessage = fallbackResponses.programming;
            } else if (message.includes('study') || message.includes('learn') || message.includes('memorize')) {
                fallbackMessage = fallbackResponses.study;
            } else if (message.includes('writing') || message.includes('essay') || message.includes('thesis')) {
                fallbackMessage = fallbackResponses.writing;
            }

            return fallbackMessage;
        }
    }

    addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `ai-message ${sender}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'ai-avatar';
        
        if (sender === 'user') {
            avatar.innerHTML = '<i class="fas fa-user"></i>';
        } else {
            avatar.innerHTML = '<i class="fas fa-robot"></i>';
        }
        
        const messageBubble = document.createElement('div');
        messageBubble.className = 'ai-message-bubble';
        
        const messageText = document.createElement('div');
        messageText.className = 'ai-message-text';
        
        // Format the message text (handle code blocks, math, etc.)
        const formattedText = this.formatMessage(text);
        messageText.innerHTML = formattedText;
        
        const messageTime = document.createElement('div');
        messageTime.className = 'ai-message-time';
        messageTime.textContent = this.getCurrentTime();
        
        messageBubble.appendChild(messageText);
        messageBubble.appendChild(messageTime);
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageBubble);
        
        // Remove welcome message if it's the first user message
        if (sender === 'user') {
            const welcomeMessage = this.aiMessages.querySelector('.ai-welcome-message');
            if (welcomeMessage) {
                welcomeMessage.remove();
            }
        }
        
        this.aiMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    formatMessage(text) {
        // Simple formatting for code blocks (between ```)
        let formattedText = text.replace(/```(\w+)?\n([\s\S]*?)```/g, '<div class="ai-code-block">$2</div>');
        
        // Format inline code (between `)
        formattedText = formattedText.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // Format mathematical expressions (between $$)
        formattedText = formattedText.replace(/\$\$([^$]+)\$\$/g, '<div class="ai-math-block">$1</div>');
        
        // Convert line breaks to <br>
        formattedText = formattedText.replace(/\n/g, '<br>');
        
        return formattedText;
    }

    showTypingIndicator() {
        this.aiTypingIndicator.style.display = 'flex';
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        this.aiTypingIndicator.style.display = 'none';
    }

    scrollToBottom() {
        setTimeout(() => {
            this.aiMessages.scrollTop = this.aiMessages.scrollHeight;
        }, 100);
    }

    getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // Utility method to clear conversation history
    clearHistory() {
        this.conversationHistory = [];
        this.aiMessages.innerHTML = `
            <div class="ai-welcome-message">
                <div class="ai-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="ai-message-content">
                    <h4>Hello! I'm your AI Study Assistant</h4>
                    <p>I can help you with:</p>
                    <ul>
                        <li>Explaining complex concepts</li>
                        <li>Solving math and science problems</li>
                        <li>Proofreading and editing</li>
                        <li>Study strategies and tips</li>
                        <li>Research assistance</li>
                    </ul>
                    <p>What would you like to know today?</p>
                </div>
            </div>
        `;
    }
}

// Initialize AI Chat when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.aiChat = new AIChat();
    
    // Add keyboard shortcut to open AI chat (Ctrl + K)
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            window.aiChat.openAIChat();
        }
    });
});

// Export for global access
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIChat;
}
