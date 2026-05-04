/**
 * Quantum Secure Messenger - WebSocket Module
 * Handles real-time communication with the server
 */

class WebSocketManager {
    constructor() {
        this.ws = null;
        this.url = 'ws://localhost:3000';
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.listeners = new Map();
        this.connectionState = 'disconnected';
        this.messageQueue = [];
    }

    /**
     * Connect to the WebSocket server
     */
    connect() {
        return new Promise((resolve, reject) => {
            try {
                this.updateConnectionState('connecting');
                
                this.ws = new WebSocket(this.url);

                this.ws.onopen = (event) => {
                    console.log('WebSocket connected');
                    this.reconnectAttempts = 0;
                    this.updateConnectionState('connected');
                    this.flushMessageQueue();
                    this.emit('connected', event);
                    resolve();
                };

                this.ws.onclose = (event) => {
                    console.log('WebSocket disconnected', event.code, event.reason);
                    this.updateConnectionState('disconnected');
                    this.emit('disconnected', event);
                    this.attemptReconnect();
                };

                this.ws.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    this.updateConnectionState('error');
                    this.emit('error', error);
                    reject(error);
                };

                this.ws.onmessage = (event) => {
                    this.handleMessage(event);
                };
            } catch (error) {
                this.updateConnectionState('error');
                reject(error);
            }
        });
    }

    /**
     * Handle incoming WebSocket messages
     */
    handleMessage(event) {
        try {
            const data = JSON.parse(event.data);
            console.log('Received message:', data.type);

            switch (data.type) {
                case 'message':
                    this.emit('message', data.payload);
                    break;
                case 'typing':
                    this.emit('typing', data.payload);
                    break;
                case 'online':
                    this.emit('online', data.payload);
                    break;
                case 'offline':
                    this.emit('offline', data.payload);
                    break;
                case 'read':
                    this.emit('read', data.payload);
                    break;
                case 'quantum_key':
                    this.emit('quantum_key', data.payload);
                    break;
                case 'key_refresh':
                    this.emit('key_refresh', data.payload);
                    break;
                case 'security_alert':
                    this.emit('security_alert', data.payload);
                    break;
                case 'call':
                    this.emit('call', data.payload);
                    break;
                case 'ack':
                    this.emit('ack', data.payload);
                    break;
                case 'error':
                    this.emit('server_error', data.payload);
                    break;
                default:
                    console.log('Unknown message type:', data.type);
            }
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    }

    /**
     * Send a message through WebSocket
     */
    send(type, payload) {
        const message = JSON.stringify({
            type: type,
            payload: payload,
            timestamp: Date.now()
        });

        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(message);
            return true;
        } else {
            // Queue message for later
            this.messageQueue.push({ type, payload });
            return false;
        }
    }

    /**
     * Flush queued messages
     */
    flushMessageQueue() {
        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            this.send(message.type, message.payload);
        }
    }

    /**
     * Attempt to reconnect to the server
     */
    attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('Max reconnect attempts reached');
            this.updateConnectionState('failed');
            this.emit('reconnect_failed', { attempts: this.reconnectAttempts });
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
        
        console.log(`Attempting reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
        this.updateConnectionState('reconnecting');

        setTimeout(() => {
            this.connect().catch((error) => {
                console.error('Reconnect failed:', error);
            });
        }, delay);
    }

    /**
     * Update connection state
     */
    updateConnectionState(state) {
        this.connectionState = state;
        this.emit('state_change', state);
    }

    /**
     * Get current connection state
     */
    getConnectionState() {
        return this.connectionState;
    }

    /**
     * Register an event listener
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    /**
     * Remove an event listener
     */
    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    /**
     * Emit an event to all listeners
     */
    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('Error in event listener:', error);
                }
            });
        }
    }

    /**
     * Send a chat message
     */
    sendMessage(conversationId, content, encrypted = false) {
        return this.send('message', {
            conversationId,
            content,
            encrypted,
            id: this.generateMessageId()
        });
    }

    /**
     * Send typing indicator
     */
    sendTyping(conversationId, isTyping) {
        return this.send('typing', {
            conversationId,
            isTyping
        });
    }

    /**
     * Mark message as read
     */
    markAsRead(conversationId, messageId) {
        return this.send('read', {
            conversationId,
            messageId
        });
    }

    /**
     * Request quantum key for a conversation
     */
    requestQuantumKey(conversationId) {
        return this.send('quantum_key_request', {
            conversationId
        });
    }

    /**
     * Refresh quantum key
     */
    refreshQuantumKey(conversationId) {
        return this.send('key_refresh', {
            conversationId
        });
    }

    /**
     * Generate a unique message ID
     */
    generateMessageId() {
        return 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Disconnect from the server
     */
    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.updateConnectionState('disconnected');
    }

    /**
     * Check if connected
     */
    isConnected() {
        return this.ws && this.ws.readyState === WebSocket.OPEN;
    }
}

// Export for use in other modules
window.WebSocketManager = WebSocketManager;