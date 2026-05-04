/**
 * Quantum Secure Messenger - Server
 * Express + WebSocket server for real-time messaging
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const { setupWebSocket } = require('./websocket/chat');
const { QuantumSimulator } = require('./quantum/simulator');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));

// Initialize quantum simulator
const quantumSimulator = new QuantumSimulator();

// Store active users and conversations
const users = new Map();
const sessions = new Map();
const conversations = new Map();
const messages = new Map();
const quantumKeys = new Map();

// Make these available to routes
app.set('users', users);
app.set('sessions', sessions);
app.set('conversations', conversations);
app.set('messages', messages);
app.set('quantumKeys', quantumKeys);
app.set('quantumSimulator', quantumSimulator);

// Routes
app.use('/api/auth', authRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        quantum: quantumSimulator.getStatus()
    });
});

// Quantum key generation endpoint
app.post('/api/quantum/key', async (req, res) => {
    try {
        const { conversationId, userId } = req.body;
        
        // Generate quantum key using Six-State Protocol
        const result = await quantumSimulator.generateKey(conversationId);
        
        // Store the key
        quantumKeys.set(conversationId, {
            key: result.key,
            qber: result.qber,
            protocol: 'Six-State',
            timestamp: Date.now()
        });
        
        res.json({
            success: true,
            key: result.key,
            qber: result.qber,
            protocol: 'Six-State'
        });
    } catch (error) {
        console.error('Quantum key generation error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Quantum key refresh endpoint
app.post('/api/quantum/refresh', async (req, res) => {
    try {
        const { conversationId } = req.body;
        
        // Generate new key with potential eavesdropping simulation
        const result = await quantumSimulator.generateKey(conversationId, true);
        
        // Update the key
        quantumKeys.set(conversationId, {
            key: result.key,
            qber: result.qber,
            protocol: 'Six-State',
            timestamp: Date.now()
        });
        
        res.json({
            success: true,
            key: result.key,
            qber: result.qber,
            protocol: 'Six-State'
        });
    } catch (error) {
        console.error('Quantum key refresh error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get quantum status
app.get('/api/quantum/status/:conversationId', (req, res) => {
    const { conversationId } = req.params;
    const keyData = quantumKeys.get(conversationId);
    
    if (keyData) {
        res.json({
            active: true,
            qber: keyData.qber,
            protocol: keyData.protocol,
            keyLength: 256,
            established: keyData.timestamp
        });
    } else {
        res.json({
            active: false
        });
    }
});

// Setup WebSocket handlers
setupWebSocket(wss, {
    users,
    sessions,
    conversations,
    messages,
    quantumKeys,
    quantumSimulator
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║     █████╗  ██████╗ ██████╗  █████╗ ██████╗  ██████╗     ║
║    ██╔══██╗██╔════╝ ██╔══██╗██╔══██╗██╔══██╗██╔═══██╗    ║
║    ███████║██║  ███╗██████╔╝███████║██████╔╝██║   ██║    ║
║    ██╔══██║██║   ██║██╔══██╗██╔══██║██╔══██╗██║   ██║    ║
║    ██║  ██║╚██████╔╝██║  ██║██║  ██║██║  ██║╚██████╔╝    ║
║    ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝     ║
║                    SECURE MESSENGER                        ║
║                                                           ║
╠═══════════════════════════════════════════════════════════╣
║  Server running on http://localhost:${PORT}                 ║
║  Quantum simulator initialized                            ║
║  WebSocket ready for connections                           ║
╚═══════════════════════════════════════════════════════════╝
    `);
});

module.exports = { app, server, wss };