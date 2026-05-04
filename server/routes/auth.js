/**
 * Quantum Secure Messenger - Authentication Routes
 * Simple demo authentication
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// In-memory user store (demo)
const demoUsers = new Map([
    ['alice', { id: 'user_alice', username: 'Alice', password: 'demo' }],
    ['bob', { id: 'user_bob', username: 'Bob', password: 'demo' }],
    ['charlie', { id: 'user_charlie', username: 'Charlie', password: 'demo' }],
    ['diana', { id: 'user_diana', username: 'Diana', password: 'demo' }]
]);

// Login endpoint
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ 
            success: false, 
            error: 'Username and password required' 
        });
    }
    
    // Demo mode - accept any credentials
    const userId = 'user_' + username.toLowerCase().replace(/[^a-z0-9]/g, '');
    const sessionId = uuidv4();
    
    // Create session
    const sessions = req.app.get('sessions');
    sessions.set(sessionId, {
        userId,
        username,
        createdAt: Date.now()
    });
    
    // Add to active users
    const users = req.app.get('users');
    users.set(userId, {
        id: userId,
        username,
        sessionId,
        online: true
    });
    
    res.json({
        success: true,
        user: {
            id: userId,
            username,
            sessionId
        }
    });
});

// Logout endpoint
router.post('/logout', (req, res) => {
    const { sessionId } = req.body;
    
    if (sessionId) {
        const sessions = req.app.get('sessions');
        const session = sessions.get(sessionId);
        
        if (session) {
            const users = req.app.get('users');
            users.delete(session.userId);
            sessions.delete(sessionId);
        }
    }
    
    res.json({ success: true });
});

// Verify session
router.get('/verify/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    const sessions = req.app.get('sessions');
    const session = sessions.get(sessionId);
    
    if (session) {
        res.json({
            valid: true,
            user: {
                id: session.userId,
                username: session.username
            }
        });
    } else {
        res.json({ valid: false });
    }
});

// Get online users
router.get('/users', (req, res) => {
    const users = req.app.get('users');
    const userList = Array.from(users.values()).map(u => ({
        id: u.id,
        username: u.username,
        online: u.online
    }));
    
    res.json({ users: userList });
});

module.exports = router;