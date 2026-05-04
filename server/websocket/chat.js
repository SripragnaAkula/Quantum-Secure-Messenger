/**
 * Quantum Secure Messenger - WebSocket Chat Handler
 * Handles real-time messaging and quantum key distribution
 */

function setupWebSocket(wss, stores) {
    const { users, sessions, conversations, messages, quantumKeys, quantumSimulator } = stores;

    wss.on('connection', (ws) => {
        console.log('New WebSocket connection');
        let currentUser = null;
        let currentSession = null;

        // Send helper
        const send = (type, payload) => {
            if (ws.readyState === 1) {
                ws.send(JSON.stringify({ type, payload }));
            }
        };

        // Handle incoming messages
        ws.on('message', async (data) => {
            try {
                const message = JSON.parse(data);
                console.log('Received:', message.type);

                switch (message.type) {
                    case 'auth':
                        // Authenticate user
                        const { userId, username } = message.payload;
                        currentUser = { id: userId, username };
                        currentSession = userId;
                        
                        // Add to active users
                        users.set(userId, {
                            id: userId,
                            username,
                            online: true,
                            ws: ws
                        });
                        
                        send('authenticated', { userId, username });
                        console.log(`User ${username} authenticated`);
                        break;

                    case 'message':
                        // Handle chat message
                        await handleMessage(message.payload);
                        break;

                    case 'typing':
                        // Handle typing indicator
                        handleTyping(message.payload);
                        break;

                    case 'read':
                        // Handle read receipt
                        handleReadReceipt(message.payload);
                        break;

                    case 'quantum_key_request':
                        // Handle quantum key request
                        await handleQuantumKeyRequest(message.payload);
                        break;

                    case 'key_refresh':
                        // Handle key refresh
                        await handleKeyRefresh(message.payload);
                        break;

                    default:
                        console.log('Unknown message type:', message.type);
                }
            } catch (error) {
                console.error('Error handling message:', error);
                send('error', { message: error.message });
            }
        });

        // Handle disconnect
        ws.on('close', () => {
            if (currentUser) {
                users.delete(currentUser.id);
                
                // Notify others about offline status
                broadcastToAll({
                    type: 'offline',
                    payload: { userId: currentUser.id }
                }, ws);
            }
            console.log('WebSocket disconnected');
        });

        // Handle errors
        ws.on('error', (error) => {
            console.error('WebSocket error:', error);
        });

        // Handle chat message
        async function handleMessage(payload) {
            const { conversationId, content, encrypted, id } = payload;
            
            // Store message
            if (!messages.has(conversationId)) {
                messages.set(conversationId, []);
            }
            
            const messageData = {
                id,
                conversationId,
                senderId: currentUser.id,
                content,
                encrypted,
                timestamp: Date.now(),
                status: 'delivered'
            };
            
            messages.get(conversationId).push(messageData);
            
            // Send acknowledgment
            send('ack', { messageId: id, status: 'delivered' });
            
            // Broadcast to conversation participants
            broadcastToConversation(conversationId, {
                type: 'message',
                payload: {
                    ...messageData,
                    senderName: currentUser.username
                }
            }, ws);
        }

        // Handle typing indicator
        function handleTyping(payload) {
            const { conversationId, isTyping } = payload;
            
            broadcastToConversation(conversationId, {
                type: 'typing',
                payload: {
                    userId: currentUser.id,
                    username: currentUser.username,
                    conversationId,
                    isTyping
                }
            }, ws);
        }

        // Handle read receipt
        function handleReadReceipt(payload) {
            const { conversationId, messageId } = payload;
            
            // Update message status
            const convMessages = messages.get(conversationId);
            if (convMessages) {
                const message = convMessages.find(m => m.id === messageId);
                if (message) {
                    message.status = 'read';
                }
            }
            
            // Broadcast read receipt
            broadcastToConversation(conversationId, {
                type: 'read',
                payload: {
                    messageId,
                    userId: currentUser.id,
                    timestamp: Date.now()
                }
            }, ws);
        }

        // Handle quantum key request
        async function handleQuantumKeyRequest(payload) {
            const { conversationId } = payload;
            
            try {
                // Generate quantum key
                const result = await quantumSimulator.generateKey(conversationId);
                
                // Store the key
                quantumKeys.set(conversationId, {
                    key: result.key,
                    qber: result.qber,
                    protocol: 'Six-State',
                    timestamp: Date.now()
                });
                
                // Send key to requester
                send('quantum_key', {
                    conversationId,
                    key: result.key,
                    qber: result.qber,
                    protocol: 'Six-State'
                });
                
                console.log(`Quantum key generated for conversation ${conversationId}, QBER: ${result.qber}%`);
            } catch (error) {
                console.error('Quantum key generation failed:', error);
                send('error', { message: 'Failed to generate quantum key' });
            }
        }

        // Handle key refresh
        async function handleKeyRefresh(payload) {
            const { conversationId } = payload;
            
            try {
                // Generate new key (simulating refresh)
                const result = await quantumSimulator.generateKey(conversationId, true);
                
                // Update stored key
                quantumKeys.set(conversationId, {
                    key: result.key,
                    qber: result.qber,
                    protocol: 'Six-State',
                    timestamp: Date.now()
                });
                
                // Check for security alert
                if (result.qber > 11) {
                    // Send security alert
                    broadcastToConversation(conversationId, {
                        type: 'security_alert',
                        payload: {
                            conversationId,
                            qber: result.qber,
                            message: 'Security Warning: Possible eavesdropping detected! QBER exceeds threshold.'
                        }
                    }, ws);
                }
                
                // Send new key
                send('key_refresh', {
                    conversationId,
                    key: result.key,
                    qber: result.qber,
                    protocol: 'Six-State'
                });
                
                console.log(`Quantum key refreshed for conversation ${conversationId}, QBER: ${result.qber}%`);
            } catch (error) {
                console.error('Key refresh failed:', error);
                send('error', { message: 'Failed to refresh quantum key' });
            }
        }

        // Broadcast to all connected clients except sender
        function broadcastToAll(message, excludeWs) {
            wss.clients.forEach((client) => {
                if (client !== excludeWs && client.readyState === 1) {
                    client.send(JSON.stringify(message));
                }
            });
        }

        // Broadcast to participants in a conversation
        function broadcastToConversation(conversationId, message, excludeWs) {
            // For demo, broadcast to all users
            // In production, filter by conversation participants
            wss.clients.forEach((client) => {
                if (client !== excludeWs && client.readyState === 1) {
                    client.send(JSON.stringify(message));
                }
            });
        }
    });

    console.log('WebSocket handlers initialized');
}

module.exports = { setupWebSocket };