/**
 * Quantum Secure Messenger - UI Module
 * Handles all DOM manipulation and rendering
 */

class UIManager {
    constructor() {
        this.elements = {};
        this.currentConversation = null;
        this.typingTimeout = null;
    }

    /**
     * Initialize UI elements
     */
    init() {
        this.elements = {
            loginScreen: document.getElementById('login-screen'),
            app: document.getElementById('app'),
            loginForm: document.getElementById('login-form'),
            username: document.getElementById('username'),
            password: document.getElementById('password'),
            userAvatar: document.getElementById('user-avatar'),
            userName: document.getElementById('user-name'),
            conversationsList: document.getElementById('conversations-list'),
            messagesContainer: document.getElementById('messages-container'),
            messageInput: document.getElementById('message-input'),
            sendButton: document.getElementById('send-button'),
            chatAvatar: document.getElementById('chat-avatar'),
            chatName: document.getElementById('chat-name'),
            quantumPanel: document.getElementById('quantum-panel'),
            toggleQuantumPanel: document.getElementById('toggle-quantum-panel'),
            qberValue: document.getElementById('qber-value'),
            securityAlert: document.getElementById('security-alert'),
            refreshKeyBtn: document.getElementById('refresh-key-btn'),
            toastContainer: document.getElementById('toast-container'),
            notificationModal: document.getElementById('notification-modal'),
            enableNotifications: document.getElementById('enable-notifications'),
            denyNotifications: document.getElementById('deny-notifications')
        };
    }

    /**
     * Show login screen
     */
    showLogin() {
        this.elements.loginScreen.classList.remove('hidden');
        this.elements.app.classList.add('hidden');
    }

    /**
     * Show main app
     */
    showApp() {
        this.elements.loginScreen.classList.add('hidden');
        this.elements.app.classList.remove('hidden');
    }

    /**
     * Update user info
     */
    updateUserInfo(username) {
        this.elements.userAvatar.textContent = username.charAt(0).toUpperCase();
        this.elements.userName.textContent = username;
    }

    /**
     * Render conversations list
     */
    renderConversations(conversations) {
        const html = conversations.map(conv => this.renderConversationItem(conv)).join('');
        this.elements.conversationsList.innerHTML = html;
    }

    /**
     * Render a single conversation item
     */
    renderConversationItem(conv) {
        const isActive = this.currentConversation === conv.id;
        const lastMessageTime = this.formatTime(conv.lastMessage?.timestamp);
        
        return `
            <div class="conversation-item ${isActive ? 'active' : ''}" data-id="${conv.id}">
                <div class="flex items-center gap-3">
                    <div class="relative flex-shrink-0">
                        <div class="w-12 h-12 rounded-full bg-q-quantum/30 flex items-center justify-center text-q-quantum font-semibold">
                            ${conv.name.charAt(0).toUpperCase()}
                        </div>
                        <div class="absolute bottom-0 right-0 w-3 h-3 ${conv.online ? 'bg-q-success' : 'bg-q-bg-tertiary'} rounded-full border-2 border-q-bg-secondary"></div>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between">
                            <h4 class="font-medium text-white truncate">${conv.name}</h4>
                            <span class="text-xs text-q-bg-tertiary">${lastMessageTime}</span>
                        </div>
                        <div class="flex items-center justify-between mt-1">
                            <p class="text-sm text-q-bg-tertiary truncate">${conv.lastMessage?.content || 'No messages yet'}</p>
                            ${conv.unread > 0 ? `<span class="unread-badge">${conv.unread}</span>` : ''}
                        </div>
                    </div>
                    ${conv.quantumKey ? `
                        <svg class="w-4 h-4 text-q-quantum flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                        </svg>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Select a conversation
     */
    selectConversation(conversationId) {
        this.currentConversation = conversationId;
        
        // Update active state in list
        document.querySelectorAll('.conversation-item').forEach(item => {
            item.classList.toggle('active', item.dataset.id === conversationId);
        });
    }

    /**
     * Render messages in chat area
     */
    renderMessages(messages, currentUserId) {
        if (!messages || messages.length === 0) {
            this.elements.messagesContainer.innerHTML = `
                <div class="text-center py-8">
                    <p class="text-q-bg-tertiary">No messages yet. Start the conversation!</p>
                </div>
            `;
            return;
        }

        const html = messages.map(msg => this.renderMessage(msg, msg.senderId === currentUserId)).join('');
        this.elements.messagesContainer.innerHTML = html;
        
        // Scroll to bottom
        this.scrollToBottom();
    }

    /**
     * Render a single message
     */
    renderMessage(msg, isSent) {
        const time = this.formatTime(msg.timestamp);
        const status = isSent ? this.getMessageStatus(msg.status) : '';
        
        return `
            <div class="message ${isSent ? 'message-sent' : 'message-received'}">
                <p>${this.escapeHtml(msg.content)}</p>
                <div class="flex items-center justify-end gap-2">
                    <span class="message-time">${time}</span>
                    ${status}
                </div>
            </div>
        `;
    }

    /**
     * Get message status icon
     */
    getMessageStatus(status) {
        switch (status) {
            case 'sent':
                return '<span class="message-status">✓</span>';
            case 'delivered':
                return '<span class="message-status">✓✓</span>';
            case 'read':
                return '<span class="message-status text-q-accent">✓✓</span>';
            default:
                return '';
        }
    }

    /**
     * Add a new message to the chat
     */
    addMessage(msg, isSent) {
        const container = this.elements.messagesContainer;
        
        // Remove empty state if present
        const emptyState = container.querySelector('.text-center');
        if (emptyState) {
            emptyState.remove();
        }

        const messageDiv = document.createElement('div');
        messageDiv.innerHTML = this.renderMessage(msg, isSent);
        container.appendChild(messageDiv.firstElementChild);
        
        this.scrollToBottom();
    }

    /**
     * Scroll messages to bottom
     */
    scrollToBottom() {
        this.elements.messagesContainer.scrollTop = this.elements.messagesContainer.scrollHeight;
    }

    /**
     * Update chat header
     */
    updateChatHeader(conversation) {
        if (conversation) {
            this.elements.chatAvatar.textContent = conversation.name.charAt(0).toUpperCase();
            this.elements.chatName.textContent = conversation.name;
        }
    }

    /**
     * Toggle quantum panel
     */
    toggleQuantumPanel() {
        this.elements.quantumPanel.classList.toggle('hidden');
    }

    /**
     * Update QBER value
     */
    updateQBER(value) {
        this.elements.qberValue.textContent = value.toFixed(1) + '%';
        
        // Update color based on value
        if (value > 11) {
            this.elements.qberValue.className = 'text-q-danger font-mono';
            this.showSecurityAlert(true);
        } else if (value > 7) {
            this.elements.qberValue.className = 'text-q-warning font-mono';
            this.showSecurityAlert(false);
        } else {
            this.elements.qberValue.className = 'text-q-success font-mono';
            this.showSecurityAlert(false);
        }
    }

    /**
     * Show/hide security alert
     */
    showSecurityAlert(show) {
        this.elements.securityAlert.classList.toggle('hidden', !show);
    }

    /**
     * Show typing indicator
     */
    showTypingIndicator() {
        const container = this.elements.messagesContainer;
        
        // Remove existing indicator
        const existing = container.querySelector('.typing-indicator');
        if (existing) {
            existing.remove();
        }

        const indicator = document.createElement('div');
        indicator.className = 'typing-indicator';
        indicator.innerHTML = '<span></span><span></span><span></span>';
        container.appendChild(indicator);
        
        this.scrollToBottom();
    }

    /**
     * Hide typing indicator
     */
    hideTypingIndicator() {
        const indicator = this.elements.messagesContainer.querySelector('.typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <p class="text-sm text-white">${this.escapeHtml(message)}</p>
        `;
        
        this.elements.toastContainer.appendChild(toast);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    /**
     * Show notification permission modal
     */
    showNotificationModal() {
        this.elements.notificationModal.classList.remove('hidden');
    }

    /**
     * Hide notification permission modal
     */
    hideNotificationModal() {
        this.elements.notificationModal.classList.add('hidden');
    }

    /**
     * Request browser notification permission
     */
    async requestNotificationPermission() {
        if (!('Notification' in window)) {
            console.log('Browser does not support notifications');
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }

        return false;
    }

    /**
     * Show browser notification
     */
    showBrowserNotification(title, body) {
        if (Notification.permission === 'granted') {
            new Notification(title, {
                body: body,
                icon: '/icon.png',
                badge: '/badge.png'
            });
        }
    }

    /**
     * Format timestamp
     */
    formatTime(timestamp) {
        if (!timestamp) return '';
        
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        // Today
        if (diff < 24 * 60 * 60 * 1000) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        
        // Yesterday
        if (diff < 48 * 60 * 60 * 1000) {
            return 'Yesterday';
        }
        
        // This week
        if (diff < 7 * 24 * 60 * 60 * 1000) {
            return date.toLocaleDateString([], { weekday: 'short' });
        }
        
        // Older
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Set input value
     */
    setMessageInput(value) {
        this.elements.messageInput.value = value;
    }

    /**
     * Get input value
     */
    getMessageInput() {
        return this.elements.messageInput.value;
    }

    /**
     * Focus message input
     */
    focusMessageInput() {
        this.elements.messageInput.focus();
    }

    /**
     * Clear message input
     */
    clearMessageInput() {
        this.elements.messageInput.value = '';
    }

    /**
     * Enable/disable send button
     */
    setSendButtonEnabled(enabled) {
        this.elements.sendButton.disabled = !enabled;
        this.elements.sendButton.classList.toggle('opacity-50', !enabled);
        this.elements.sendButton.classList.toggle('cursor-not-allowed', !enabled);
    }

    /**
     * Animate send button
     */
    animateSendButton() {
        this.elements.sendButton.classList.add('scale-95');
        setTimeout(() => {
            this.elements.sendButton.classList.remove('scale-95');
        }, 100);
    }
}

// Export for use in other modules
window.UIManager = UIManager;