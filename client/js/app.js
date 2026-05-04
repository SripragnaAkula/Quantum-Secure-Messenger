/**
 * Quantum Secure Messenger - Main Application
 * Integrates all modules and handles application logic
 */

class QuantumMessenger {
    constructor() {
        this.crypto = new QuantumCrypto();
        this.ws = new WebSocketManager();
        this.ui = new UIManager();
        
        this.currentUser = null;
        this.conversations = new Map();
        this.messages = new Map();
        this.currentConversation = null;
        
        this.typingTimer = null;
        this.isTyping = false;
    }

    /**
     * Initialize the application
     */
    async init() {
        console.log('Initializing Quantum Secure Messenger...');
        
        // Initialize UI
        this.ui.init();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Setup WebSocket listeners
        this.setupWebSocketListeners();
        
        // Check for stored credentials
        const storedUser = localStorage.getItem('quantum_user');
        if (storedUser) {
            this.currentUser = JSON.parse(storedUser);
            this.ui.updateUserInfo(this.currentUser.username);
            this.ui.showApp();
            await this.connectAndLoad();
        }
    }

    /**
     * Setup DOM event listeners
     */
    setupEventListeners() {
        // Login form
        this.ui.elements.loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Send message
        this.ui.elements.sendButton.addEventListener('click', () => {
            this.sendMessage();
        });

        this.ui.elements.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Typing indicator
        this.ui.elements.messageInput.addEventListener('input', () => {
            this.handleTyping();
        });

        // Toggle quantum panel
        this.ui.elements.toggleQuantumPanel.addEventListener('click', () => {
            this.ui.toggleQuantumPanel();
        });

        // Refresh quantum key
        this.ui.elements.refreshKeyBtn.addEventListener('click', () => {
            this.refreshQuantumKey();
        });

        // Notification permissions
        this.ui.elements.enableNotifications.addEventListener('click', async () => {
            await this.ui.requestNotificationPermission();
            this.ui.hideNotificationModal();
        });

        this.ui.elements.denyNotifications.addEventListener('click', () => {
            this.ui.hideNotificationModal();
        });

        // Conversation click delegation
        this.ui.elements.conversationsList.addEventListener('click', (e) => {
            const item = e.target.closest('.conversation-item');
            if (item) {
                this.selectConversation(item.dataset.id);
            }
        });
    }

    /**
     * Setup WebSocket event listeners
     */
    setupWebSocketListeners() {
        this.ws.on('connected', () => {
            console.log('Connected to server');
            this.ui.showToast('Connected to server', 'success');
        });

        this.ws.on('disconnected', () => {
            console.log('Disconnected from server');
            this.ui.showToast('Disconnected from server', 'warning');
        });

        this.ws.on('message', (data) => {
            this.handleIncomingMessage(data);
        });

        this.ws.on('typing', (data) => {
            if (data.conversationId === this.currentConversation) {
                if (data.isTyping) {
                    this.ui.showTypingIndicator();
                } else {
                    this.ui.hideTypingIndicator();
                }
            }
        });

        this.ws.on('quantum_key', (data) => {
            this.handleQuantumKey(data);
        });

        this.ws.on('key_refresh', (data) => {
            this.handleKeyRefresh(data);
        });

        this.ws.on('security_alert', (data) => {
            this.handleSecurityAlert(data);
        });

        this.ws.on('ack', (data) => {
            this.handleMessageAck(data);
        });

        this.ws.on('online', (data) => {
            this.updateUserOnlineStatus(data.userId, true);
        });

        this.ws.on('offline', (data) => {
            this.updateUserOnlineStatus(data.userId, false);
        });

        this.ws.on('state_change', (state) => {
            console.log('Connection state:', state);
        });
    }

    /**
     * Handle login
     */
    async handleLogin() {
        const username = this.ui.elements.username.value.trim();
        const password = this.ui.elements.password.value.trim();

        if (!username || !password) {
            this.ui.showToast('Please enter username and password', 'error');
            return;
        }

        // Demo login - accept any credentials
        this.currentUser = {
            id: 'user_' + Date.now(),
            username: username
        };

        // Store credentials
        localStorage.setItem('quantum_user', JSON.stringify(this.currentUser));

        // Update UI
        this.ui.updateUserInfo(username);
        this.ui.showApp();

        // Connect and load data
        await this.connectAndLoad();
    }

    /**
     * Connect to server and load initial data
     */
    async connectAndLoad() {
        try {
            // Connect to WebSocket
            await this.ws.connect();
            
            // Authenticate
            this.ws.send('auth', {
                userId: this.currentUser.id,
                username: this.currentUser.username
            });

            // Load demo conversations
            this.loadDemoConversations();
            
            // Show notification permission modal
            setTimeout(() => {
                if (Notification.permission === 'default') {
                    this.ui.showNotificationModal();
                }
            }, 2000);

        } catch (error) {
            console.error('Failed to connect:', error);
            this.ui.showToast('Failed to connect to server', 'error');
            
            // Load demo data anyway for offline mode
            this.loadDemoConversations();
        }
    }

    /**
     * Load demo conversations
     */
    loadDemoConversations() {
        const demoConversations = [
            {
                id: 'conv_1',
                name: 'Alice',
                lastMessage: { content: 'The quantum key looks good!', timestamp: Date.now() - 300000 },
                unread: 2,
                online: true,
                quantumKey: true
            },
            {
                id: 'conv_2',
                name: 'Bob',
                lastMessage: { content: 'See you at the meeting', timestamp: Date.now() - 3600000 },
                unread: 0,
                online: false,
                quantumKey: true
            },
            {
                id: 'conv_3',
                name: 'Charlie',
                lastMessage: { content: 'Thanks for the update', timestamp: Date.now() - 86400000 },
                unread: 0,
                online: true,
                quantumKey: false
            },
            {
                id: 'conv_4',
                name: 'Diana',
                lastMessage: { content: 'Let me check the logs', timestamp: Date.now() - 172800000 },
                unread: 0,
                online: false,
                quantumKey: true
            }
        ];

        demoConversations.forEach(conv => {
            this.conversations.set(conv.id, conv);
        });

        // Render conversations
        this.ui.renderConversations(demoConversations);

        // Load demo messages for first conversation
        this.loadDemoMessages('conv_1');
    }

    /**
     * Load demo messages for a conversation
     */
    loadDemoMessages(conversationId) {
        const demoMessages = {
            conv_1: [
                { id: 'msg_1', senderId: 'user_alice', content: 'Hey! Did you get the quantum key?', timestamp: Date.now() - 600000 },
                { id: 'msg_2', senderId: 'user_me', content: 'Yes, just generated it. The QBER looks good at 2.1%', timestamp: Date.now() - 540000 },
                { id: 'msg_3', senderId: 'user_alice', content: 'Great! This new protocol is much more efficient', timestamp: Date.now() - 480000 },
                { id: 'msg_4', senderId: 'user_me', content: 'Agreed. The Six-State protocol gives us better key rates', timestamp: Date.now() - 420000 },
                { id: 'msg_5', senderId: 'user_alice', content: 'The quantum key looks good!', timestamp: Date.now() - 300000 }
            ],
            conv_2: [
                { id: 'msg_6', senderId: 'user_bob', content: 'Hi! Are you free for a call?', timestamp: Date.now() - 7200000 },
                { id: 'msg_7', senderId: 'user_me', content: 'Sure, give me 10 minutes', timestamp: Date.now() - 6900000 },
                { id: 'msg_8', senderId: 'user_bob', content: 'See you at the meeting', timestamp: Date.now() - 3600000 }
            ],
            conv_3: [
                { id: 'msg_9', senderId: 'user_charlie', content: 'The security audit is complete', timestamp: Date.now() - 172800000 },
                { id: 'msg_10', senderId: 'user_me', content: 'Any issues found?', timestamp: Date.now() - 169200000 },
                { id: 'msg_11', senderId: 'user_charlie', content: 'Thanks for the update', timestamp: Date.now() - 86400000 }
            ],
            conv_4: [
                { id: 'msg_12', senderId: 'user_diana', content: 'I noticed some unusual activity', timestamp: Date.now() - 259200000 },
                { id: 'msg_13', senderId: 'user_me', content: 'Can you send me the logs?', timestamp: Date.now() - 255600000 },
                { id: 'msg_14', senderId: 'user_diana', content: 'Let me check the logs', timestamp: Date.now() - 172800000 }
            ]
        };

        this.messages.set(conversationId, demoMessages[conversationId] || []);
    }

    /**
     * Select a conversation
     */
    selectConversation(conversationId) {
        this.currentConversation = conversationId;
        
        const conversation = this.conversations.get(conversationId);
        if (!conversation) return;

        // Update UI
        this.ui.selectConversation(conversationId);
        this.ui.updateChatHeader(conversation);

        // Load messages
        const convMessages = this.messages.get(conversationId) || [];
        this.ui.renderMessages(convMessages, this.currentUser.id);

        // Mark as read
        conversation.unread = 0;
        this.ui.renderConversations([...this.conversations.values()]);

        // Request quantum key if needed
        if (conversation.quantumKey && !this.crypto.getConversationKey(conversationId)) {
            this.requestQuantumKey(conversationId);
        }
    }

    /**
     * Send a message
     */
    async sendMessage() {
        const content = this.ui.getMessageInput().trim();
        if (!content || !this.currentConversation) return;

        // Clear input
        this.ui.clearMessageInput();

        // Create message object
        const message = {
            id: 'msg_' + Date.now(),
            senderId: this.currentUser.id,
            content: content,
            timestamp: Date.now(),
            status: 'sent'
        };

        // Get or generate quantum key
        let keyData = this.crypto.getConversationKey(this.currentConversation);
        if (!keyData) {
            keyData = await this.crypto.generateQuantumKey();
            this.crypto.setConversationKey(this.currentConversation, keyData);
        }

        // Encrypt message
        try {
            const encrypted = await this.crypto.encrypt(content, keyData);
            
            // Add to local messages
            const convMessages = this.messages.get(this.currentConversation) || [];
            convMessages.push(message);
            this.messages.set(this.currentConversation, convMessages);

            // Render message
            this.ui.addMessage(message, true);

            // Send via WebSocket
            this.ws.sendMessage(this.currentConversation, encrypted, true);

            // Update conversation last message
            const conversation = this.conversations.get(this.currentConversation);
            if (conversation) {
                conversation.lastMessage = {
                    content: content,
                    timestamp: Date.now()
                };
                this.ui.renderConversations([...this.conversations.values()]);
            }

        } catch (error) {
            console.error('Failed to send message:', error);
            this.ui.showToast('Failed to send message', 'error');
        }
    }

    /**
     * Handle incoming message
     */
    async handleIncomingMessage(data) {
        const { conversationId, content, encrypted, senderId } = data;
        
        let messageContent = content;
        
        // Decrypt if encrypted
        if (encrypted) {
            try {
                const keyData = this.crypto.getConversationKey(conversationId);
                if (keyData) {
                    messageContent = await this.crypto.decrypt(content, keyData);
                }
            } catch (error) {
                console.error('Failed to decrypt message:', error);
                messageContent = '[Encrypted message]';
            }
        }

        // Create message object
        const message = {
            id: data.id || 'msg_' + Date.now(),
            senderId: senderId,
            content: messageContent,
            timestamp: data.timestamp || Date.now(),
            status: 'received'
        };

        // Add to local messages
        const convMessages = this.messages.get(conversationId) || [];
        convMessages.push(message);
        this.messages.set(conversationId, convMessages);

        // Render if this is the current conversation
        if (conversationId === this.currentConversation) {
            this.ui.addMessage(message, false);
        }

        // Update conversation
        const conversation = this.conversations.get(conversationId);
        if (conversation) {
            conversation.lastMessage = {
                content: messageContent,
                timestamp: message.timestamp
            };
            if (conversationId !== this.currentConversation) {
                conversation.unread = (conversation.unread || 0) + 1;
            }
            this.ui.renderConversations([...this.conversations.values()]);
        }

        // Show notification
        if (conversationId !== this.currentConversation) {
            this.ui.showToast(`New message from ${conversation?.name || 'Unknown'}`, 'info');
            this.ui.showBrowserNotification('New Message', messageContent);
        }
    }

    /**
     * Handle typing
     */
    handleTyping() {
        if (this.typingTimer) {
            clearTimeout(this.typingTimer);
        }

        if (!this.isTyping && this.currentConversation) {
            this.isTyping = true;
            this.ws.sendTyping(this.currentConversation, true);
        }

        this.typingTimer = setTimeout(() => {
            this.isTyping = false;
            if (this.currentConversation) {
                this.ws.sendTyping(this.currentConversation, false);
            }
        }, 2000);
    }

    /**
     * Request quantum key
     */
    requestQuantumKey(conversationId) {
        this.ws.requestQuantumKey(conversationId);
    }

    /**
     * Handle quantum key from server
     */
    async handleQuantumKey(data) {
        const { conversationId, key, qber } = data;
        
        // Store the key
        this.crypto.setConversationKey(conversationId, key);
        
        // Update UI
        this.ui.updateQBER(qber);
        this.ui.showToast('Quantum key established', 'success');
        
        // Update conversation
        const conversation = this.conversations.get(conversationId);
        if (conversation) {
            conversation.quantumKey = true;
            this.ui.renderConversations([...this.conversations.values()]);
        }
    }

    /**
     * Handle key refresh
     */
    async handleKeyRefresh(data) {
        const { conversationId, key, qber } = data;
        
        this.crypto.setConversationKey(conversationId, key);
        this.ui.updateQBER(qber);
        this.ui.showToast('Quantum key refreshed', 'success');
    }

    /**
     * Refresh quantum key
     */
    refreshQuantumKey() {
        if (this.currentConversation) {
            this.ws.refreshQuantumKey(this.currentConversation);
            this.ui.showToast('Refreshing quantum key...', 'info');
        }
    }

    /**
     * Handle security alert
     */
    handleSecurityAlert(data) {
        const { conversationId, qber, message } = data;
        
        this.ui.updateQBER(qber);
        this.ui.showToast(message || 'Security alert: Possible eavesdropping detected!', 'warning');
    }

    /**
     * Handle message acknowledgment
     */
    handleMessageAck(data) {
        const { messageId, status } = data;
        
        // Update message status in UI
        const convMessages = this.messages.get(this.currentConversation);
        if (convMessages) {
            const message = convMessages.find(m => m.id === messageId);
            if (message) {
                message.status = status;
            }
        }
    }

    /**
     * Update user online status
     */
    updateUserOnlineStatus(userId, online) {
        this.conversations.forEach(conv => {
            if (conv.name.toLowerCase() === userId.replace('user_', '').toLowerCase()) {
                conv.online = online;
            }
        });
        this.ui.renderConversations([...this.conversations.values()]);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new QuantumMessenger();
    app.init();
});