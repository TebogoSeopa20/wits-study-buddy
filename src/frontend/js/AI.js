// Ultra-fast AI Chat with Streaming
class AIChat {
  constructor() {
    this.conversationHistory = [];
    this.isProcessing = false;
    this.currentMessageId = null;
    
    this.initializeElements();
    this.attachEventListeners();
  }

  initializeElements() {
    this.aiModal = document.getElementById('aiChatModal');
    this.openAIBtn = document.getElementById('openAIChatBtn');
    this.closeAIBtn = this.aiModal?.querySelector('.modal-close');
    this.aiMessages = document.getElementById('aiMessages');
    this.aiMessageInput = document.getElementById('aiMessageInput');
    this.sendAIBtn = document.getElementById('sendAIMessageBtn');
    this.aiTypingIndicator = document.getElementById('aiTypingIndicator');
    this.suggestionBtns = document.querySelectorAll('.ai-suggestion-btn');
  }

  attachEventListeners() {
    this.openAIBtn?.addEventListener('click', () => this.openAIChat());
    this.closeAIBtn?.addEventListener('click', () => this.closeAIChat());
    this.sendAIBtn?.addEventListener('click', () => this.sendMessage());
    
    this.aiMessageInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
    
    this.aiMessageInput?.addEventListener('input', () => this.autoResizeTextarea());
    
    this.suggestionBtns?.forEach(btn => {
      btn.addEventListener('click', () => {
        this.aiMessageInput.value = btn.getAttribute('data-question');
        this.sendMessage();
      });
    });
    
    this.aiModal?.addEventListener('click', (e) => {
      if (e.target === this.aiModal) this.closeAIChat();
    });
  }

  openAIChat() {
    this.aiModal?.classList.add('active');
    this.aiMessageInput?.focus();
    this.scrollToBottom();
  }

  closeAIChat() {
    this.aiModal?.classList.remove('active');
    if (this.aiMessageInput) this.aiMessageInput.value = '';
    this.autoResizeTextarea();
  }

  autoResizeTextarea() {
    if (!this.aiMessageInput) return;
    this.aiMessageInput.style.height = 'auto';
    this.aiMessageInput.style.height = Math.min(this.aiMessageInput.scrollHeight, 120) + 'px';
  }

  async sendMessage() {
    if (!this.aiMessageInput || !this.sendAIBtn) return;
    
    const message = this.aiMessageInput.value.trim();
    if (!message || this.isProcessing) return;
    
    this.addMessage(message, 'user');
    this.aiMessageInput.value = '';
    this.autoResizeTextarea();
    this.sendAIBtn.disabled = true;
    this.showTypingIndicator();
    
    try {
      this.isProcessing = true;
      await this.streamAIResponse(message);
    } catch (error) {
      console.error('AI Error:', error);
      this.addMessage('Sorry, an error occurred. Please try again.', 'assistant');
    } finally {
      this.isProcessing = false;
      this.hideTypingIndicator();
      this.sendAIBtn.disabled = false;
    }
  }

  async streamAIResponse(message) {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          context: 'Academic assistance'
        })
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      this.currentMessageId = `msg-${Date.now()}`;
      this.addMessage('', 'assistant', this.currentMessageId);
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          
          try {
            const data = JSON.parse(line.slice(6));
            
            if (data.chunk) {
              fullText += data.chunk;
              this.updateMessage(this.currentMessageId, fullText);
            }
            
            if (data.done) {
              this.hideTypingIndicator();
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }

      this.scrollToBottom();

    } catch (error) {
      console.error('Stream error:', error);
      this.hideTypingIndicator();
      
      const fallback = this.getFallback(message);
      if (this.currentMessageId) {
        this.updateMessage(this.currentMessageId, fallback);
      } else {
        this.addMessage(fallback, 'assistant');
      }
    }
  }

  getFallback(msg) {
    const m = msg.toLowerCase();
    if (m.includes('math')) return "I can help with math! What problem are you working on?";
    if (m.includes('science')) return "Science questions? I'm here to help!";
    if (m.includes('code') || m.includes('program')) return "Programming help available!";
    if (m.includes('study')) return "Study tips: Use active recall and spaced repetition!";
    if (m.includes('writing') || m.includes('essay')) return "Writing help: Start with a clear thesis!";
    return "I'm here to help with your academic questions!";
  }

  addMessage(text, sender, id = null) {
    if (!this.aiMessages) return;
    
    const msgDiv = document.createElement('div');
    msgDiv.className = `ai-message ${sender}`;
    if (id) msgDiv.id = id;
    
    const avatar = document.createElement('div');
    avatar.className = 'ai-avatar';
    avatar.innerHTML = sender === 'user' 
      ? '<i class="fas fa-user"></i>' 
      : '<i class="fas fa-robot"></i>';
    
    const bubble = document.createElement('div');
    bubble.className = 'ai-message-bubble';
    
    const textDiv = document.createElement('div');
    textDiv.className = 'ai-message-text';
    textDiv.innerHTML = this.formatText(text);
    
    const time = document.createElement('div');
    time.className = 'ai-message-time';
    time.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    bubble.appendChild(textDiv);
    bubble.appendChild(time);
    msgDiv.appendChild(avatar);
    msgDiv.appendChild(bubble);
    
    if (sender === 'user') {
      const welcome = this.aiMessages.querySelector('.ai-welcome-message');
      if (welcome) welcome.remove();
    }
    
    this.aiMessages.appendChild(msgDiv);
    this.scrollToBottom();
  }

  updateMessage(id, text) {
    const msgDiv = document.getElementById(id);
    if (!msgDiv) return;
    
    const textDiv = msgDiv.querySelector('.ai-message-text');
    if (textDiv) {
      textDiv.innerHTML = this.formatText(text);
      this.scrollToBottom();
    }
  }

  formatText(text) {
    return text
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<div class="ai-code-block">$2</div>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\$\$([^$]+)\$\$/g, '<div class="ai-math-block">$1</div>')
      .replace(/\n/g, '<br>');
  }

  showTypingIndicator() {
    if (this.aiTypingIndicator) {
      this.aiTypingIndicator.style.display = 'flex';
      this.scrollToBottom();
    }
  }

  hideTypingIndicator() {
    if (this.aiTypingIndicator) {
      this.aiTypingIndicator.style.display = 'none';
    }
  }

  scrollToBottom() {
    if (this.aiMessages) {
      requestAnimationFrame(() => {
        this.aiMessages.scrollTop = this.aiMessages.scrollHeight;
      });
    }
  }

  clearHistory() {
    this.conversationHistory = [];
    if (this.aiMessages) {
      this.aiMessages.innerHTML = `
        <div class="ai-welcome-message">
          <div class="ai-avatar"><i class="fas fa-robot"></i></div>
          <div class="ai-message-content">
            <h4>Hello! I'm your AI Study Assistant</h4>
            <p>Ask me anything about:</p>
            <ul>
              <li>Math & Science problems</li>
              <li>Programming & Code</li>
              <li>Writing & Essays</li>
              <li>Study strategies</li>
            </ul>
          </div>
        </div>
      `;
    }
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  window.aiChat = new AIChat();
  
  // Ctrl+K shortcut
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      window.aiChat?.openAIChat();
    }
  });
});

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AIChat;
}
