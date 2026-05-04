/**
 * Quantum Secure Messenger - Cryptography Module
 * Handles AES-256 encryption/decryption using Web Crypto API
 */

class QuantumCrypto {
    constructor() {
        this.algorithm = 'AES-GCM';
        this.keyLength = 256;
        this.ivLength = 12;
        this.tagLength = 128;
        this.conversationKeys = new Map();
    }

    /**
     * Generate a random encryption key
     */
    async generateKey() {
        const key = await window.crypto.subtle.generateKey(
            {
                name: this.algorithm,
                length: this.keyLength
            },
            true,
            ['encrypt', 'decrypt']
        );
        return key;
    }

    /**
     * Import a key from raw bytes (for quantum-generated keys)
     * Ensures the key is exactly 256 bits (32 bytes) for AES-256
     */
    async importKey(keyData) {
        const keyBuffer = this.base64ToArrayBuffer(keyData);
        
        // Ensure exactly 32 bytes for AES-256
        const normalizedKey = new Uint8Array(32);
        const sourceArray = new Uint8Array(keyBuffer);
        for (let i = 0; i < 32; i++) {
            normalizedKey[i] = sourceArray[i % sourceArray.length];
        }
        
        return await window.crypto.subtle.importKey(
            'raw',
            normalizedKey,
            { name: this.algorithm, length: this.keyLength },
            true,
            ['encrypt', 'decrypt']
        );
    }

    /**
     * Export key to base64 string
     */
    async exportKey(key) {
        const exported = await window.crypto.subtle.exportKey('raw', key);
        return this.arrayBufferToBase64(exported);
    }

    /**
     * Encrypt a message
     */
    async encrypt(plaintext, keyData) {
        try {
            let key;
            if (typeof keyData === 'string') {
                key = await this.importKey(keyData);
            } else {
                key = keyData;
            }

            const iv = window.crypto.getRandomValues(new Uint8Array(this.ivLength));
            const encoder = new TextEncoder();
            const data = encoder.encode(plaintext);

            const encrypted = await window.crypto.subtle.encrypt(
                {
                    name: this.algorithm,
                    iv: iv,
                    tagLength: this.tagLength
                },
                key,
                data
            );

            // Combine IV and encrypted data
            const combined = new Uint8Array(iv.length + encrypted.byteLength);
            combined.set(iv, 0);
            combined.set(new Uint8Array(encrypted), iv.length);

            return this.arrayBufferToBase64(combined.buffer);
        } catch (error) {
            console.error('Encryption error:', error);
            throw new Error('Failed to encrypt message');
        }
    }

    /**
     * Decrypt a message
     */
    async decrypt(ciphertext, keyData) {
        try {
            let key;
            if (typeof keyData === 'string') {
                key = await this.importKey(keyData);
            } else {
                key = keyData;
            }

            const combined = new Uint8Array(this.base64ToArrayBuffer(ciphertext));
            const iv = combined.slice(0, this.ivLength);
            const encrypted = combined.slice(this.ivLength);

            const decrypted = await window.crypto.subtle.decrypt(
                {
                    name: this.algorithm,
                    iv: iv,
                    tagLength: this.tagLength
                },
                key,
                encrypted
            );

            const decoder = new TextDecoder();
            return decoder.decode(decrypted);
        } catch (error) {
            console.error('Decryption error:', error);
            throw new Error('Failed to decrypt message');
        }
    }

    /**
     * Store encryption key for a conversation
     */
    setConversationKey(conversationId, keyData) {
        this.conversationKeys.set(conversationId, keyData);
    }

    /**
     * Get encryption key for a conversation
     */
    getConversationKey(conversationId) {
        return this.conversationKeys.get(conversationId);
    }

    /**
     * Remove encryption key for a conversation
     */
    removeConversationKey(conversationId) {
        this.conversationKeys.delete(conversationId);
    }

    /**
     * Convert ArrayBuffer to Base64 string
     */
    arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    /**
     * Convert Base64 string to ArrayBuffer
     */
    base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }

    /**
     * Generate a random quantum key simulation
     * This simulates the quantum key distribution
     */
    async generateQuantumKey(length = 32) {
        const array = new Uint8Array(length);
        window.crypto.getRandomValues(array);
        return this.arrayBufferToBase64(array.buffer);
    }

    /**
     * Hash a string (for message integrity)
     */
    async hash(data) {
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(data);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);
        return this.arrayBufferToBase64(hashBuffer);
    }
}

// Export for use in other modules
window.QuantumCrypto = QuantumCrypto;