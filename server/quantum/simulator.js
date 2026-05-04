/**
 * Quantum Secure Messenger - Quantum Simulator
 * Simulates Six-State Protocol with noise models
 * 
 * Note: This is a classical simulation of quantum key distribution
 * In production, this would interface with actual quantum hardware or Qiskit
 */

const crypto = require('crypto');

class QuantumSimulator {
    constructor() {
        // Protocol parameters
        this.protocol = 'Six-State';
        this.keyLength = 256; // bits
        
        // Noise parameters
        this.bitFlipProbability = 0.01; // 1% bit flip noise
        this.depolarizingProbability = 0.02; // 2% depolarizing noise
        
        // Security threshold (QBER > 11% indicates eavesdropping)
        this.qberThreshold = 11;
        
        // Track active key generations
        this.activeGenerations = new Map();
        
        console.log('Quantum Simulator initialized');
        console.log(`  Protocol: ${this.protocol}`);
        console.log(`  Bit flip probability: ${this.bitFlipProbability * 100}%`);
        console.log(`  Depolarizing probability: ${this.depolarizingProbability * 100}%`);
        console.log(`  QBER threshold: ${this.qberThreshold}%`);
    }

    /**
     * Generate a quantum key using Six-State Protocol
     * @param {string} conversationId - Conversation identifier
     * @param {boolean} simulateEavesdropping - Whether to simulate eavesdropping
     * @returns {Promise<Object>} - Generated key and QBER
     */
    async generateKey(conversationId, simulateEavesdropping = false) {
        console.log(`\n🔐 Generating quantum key for ${conversationId}...`);
        
        // Step 1: Generate random basis choices (6-state uses 3 bases)
        const aliceBasis = this.generateBasisSequence(this.keyLength, 3);
        const bobBasis = this.generateBasisSequence(this.keyLength, 3);
        
        // Step 2: Generate random bits
        const aliceBits = this.generateRandomBits(this.keyLength);
        
        // Step 3: Simulate quantum transmission with noise
        let transmittedBits = [...aliceBits];
        
        // Apply bit-flip noise
        transmittedBits = this.applyBitFlipNoise(transmittedBits, this.bitFlipProbability);
        
        // Apply depolarizing noise
        transmittedBits = this.applyDepolarizingNoise(transmittedBits, this.depolarizingProbability);
        
        // Step 4: Simulate eavesdropping if requested
        if (simulateEavesdropping && Math.random() > 0.7) {
            console.log('  ⚠️ Simulating eavesdropping attack...');
            transmittedBits = this.applyEavesdroppingNoise(transmittedBits, 0.15);
        }
        
        // Step 5: Bob measures in his basis
        const bobBits = this.measureInBasis(transmittedBits, bobBasis, aliceBasis);
        
        // Step 6: Basis sifting (keep bits where bases match)
        const siftedKey = this.siftKey(aliceBits, bobBits, aliceBasis, bobBasis);
        
        // Step 7: Calculate QBER
        const qber = this.calculateQBER(aliceBits, bobBits, aliceBasis, bobBasis);
        
        // Step 8: Error correction and privacy amplification
        const finalKey = this.privacyAmplification(siftedKey, qber);
        
        // Convert to base64 for transmission
        const keyBase64 = this.bitsToBase64(finalKey);
        
        console.log(`  ✓ Key generated: ${keyBase64.substring(0, 16)}...`);
        console.log(`  📊 QBER: ${qber.toFixed(2)}%`);
        console.log(`  🔒 Protocol: ${this.protocol}`);
        
        if (qber > this.qberThreshold) {
            console.log(`  ⚠️ SECURITY ALERT: QBER exceeds threshold!`);
        }
        
        return {
            key: keyBase64,
            qber: qber,
            protocol: this.protocol,
            keyLength: finalKey.length
        };
    }

    /**
     * Generate random basis choices
     */
    generateBasisSequence(length, numBases) {
        const basis = [];
        for (let i = 0; i < length; i++) {
            basis.push(Math.floor(Math.random() * numBases));
        }
        return basis;
    }

    /**
     * Generate random bits
     */
    generateRandomBits(length) {
        const bits = [];
        for (let i = 0; i < length; i++) {
            bits.push(Math.random() < 0.5 ? 0 : 1);
        }
        return bits;
    }

    /**
     * Apply bit-flip noise
     */
    applyBitFlipNoise(bits, probability) {
        return bits.map(bit => {
            if (Math.random() < probability) {
                return bit === 0 ? 1 : 0;
            }
            return bit;
        });
    }

    /**
     * Apply depolarizing noise
     */
    applyDepolarizingNoise(bits, probability) {
        return bits.map(bit => {
            if (Math.random() < probability) {
                // Randomize the bit completely
                return Math.random() < 0.5 ? 0 : 1;
            }
            return bit;
        });
    }

    /**
     * Apply eavesdropping noise (higher error rate)
     */
    applyEavesdroppingNoise(bits, errorRate) {
        return bits.map(bit => {
            if (Math.random() < errorRate) {
                return bit === 0 ? 1 : 0;
            }
            return bit;
        });
    }

    /**
     * Measure in basis (simulates quantum measurement)
     */
    measureInBasis(transmittedBits, bobBasis, aliceBasis) {
        return transmittedBits.map((bit, i) => {
            // In Six-State, if bases match, measurement is accurate
            // If bases don't match, result is random
            if (bobBasis[i] === aliceBasis[i]) {
                return bit;
            } else {
                return Math.random() < 0.5 ? 0 : 1;
            }
        });
    }

    /**
     * Sift key - keep bits where bases match
     */
    siftKey(aliceBits, bobBits, aliceBasis, bobBasis) {
        const sifted = [];
        for (let i = 0; i < aliceBits.length; i++) {
            if (aliceBasis[i] === bobBasis[i]) {
                sifted.push(aliceBits[i]);
            }
        }
        return sifted;
    }

    /**
     * Calculate Quantum Bit Error Rate
     */
    calculateQBER(aliceBits, bobBits, aliceBasis, bobBasis) {
        let errors = 0;
        let total = 0;
        
        for (let i = 0; i < aliceBits.length; i++) {
            if (aliceBasis[i] === bobBasis[i]) {
                total++;
                if (aliceBits[i] !== bobBits[i]) {
                    errors++;
                }
            }
        }
        
        return total > 0 ? (errors / total) * 100 : 0;
    }

    /**
     * Privacy amplification - reduce key length based on QBER
     */
    privacyAmplification(siftedKey, qber) {
        // Estimate information leaked to eavesdropper
        const leakedInfo = qber * 1.5; // Conservative estimate
        
        // Reduce key length to ensure security
        const secureLength = Math.max(16, Math.floor(siftedKey.length * (1 - leakedInfo / 100)));
        
        // Take subset of key
        return siftedKey.slice(0, secureLength);
    }

    /**
     * Convert bit array to base64 string
     * Always produces exactly 32 bytes (256 bits) for AES-256
     */
    bitsToBase64(bits) {
        // Ensure exactly 32 bytes (256 bits)
        const keyBytes = new Array(32).fill(0);
        
        for (let i = 0; i < 256; i++) {
            const bitIndex = i % bits.length;
            const byteIndex = Math.floor(i / 8);
            const bitPosition = 7 - (i % 8);
            keyBytes[byteIndex] |= (bits[bitIndex] << bitPosition);
        }
        
        // Convert to base64
        return Buffer.from(keyBytes).toString('base64');
    }

    /**
     * Get simulator status
     */
    getStatus() {
        return {
            protocol: this.protocol,
            keyLength: this.keyLength,
            bitFlipProbability: this.bitFlipProbability,
            depolarizingProbability: this.depolarizingProbability,
            qberThreshold: this.qberThreshold,
            activeGenerations: this.activeGenerations.size
        };
    }

    /**
     * Simulate key distillation process
     */
    async distillKey(rawKey) {
        console.log('  🔬 Running key distillation...');
        
        // Simulate error correction
        const correctedKey = this.errorCorrection(rawKey);
        
        // Simulate privacy amplification
        const amplifiedKey = this.privacyAmplification(correctedKey, 2.5);
        
        return amplifiedKey;
    }

    /**
     * Error correction (simplified)
     */
    errorCorrection(key) {
        // In real implementation, use cascade or LDPC codes
        // Here we just return the key with minor corrections
        return key.slice(0, Math.min(key.length, 32));
    }
}

module.exports = { QuantumSimulator };