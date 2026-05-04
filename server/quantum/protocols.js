/**
 * Quantum Secure Messenger - Quantum Protocols
 * Implementation of various QKD protocols
 */

class QuantumProtocols {
    /**
     * BB84 Protocol (Bennett-Brassard 1984)
     * The first and most well-known QKD protocol
     */
    static bb84() {
        return {
            name: 'BB84',
            bases: 2, // + and x bases
            states: 4, // |0⟩, |1⟩, |+⟩, |−⟩
            description: 'Original quantum key distribution protocol'
        };
    }

    /**
     * Six-State Protocol
     * Uses 3 bases (6 states) for higher key rate
     */
    static sixState() {
        return {
            name: 'Six-State',
            bases: 3, // Z, X, Y bases
            states: 6, // 6 quantum states
            description: 'Enhanced protocol with higher key generation rate'
        };
    }

    /**
     * SARG04 Protocol
     * Variant of BB84 with improved robustness
     */
    static sarg04() {
        return {
            name: 'SARG04',
            bases: 2,
            states: 4,
            description: 'Self-referenced argument protocol'
        };
    }

    /**
     * Decoy State Protocol
     * Used for practical quantum communication
     */
    static decoyState() {
        return {
            name: 'Decoy-State',
            bases: 2,
            states: 4,
            description: 'Protocol with decoy states for photon number split attack protection'
        };
    }

    /**
     * Get all available protocols
     */
    static getAll() {
        return [
            this.bb84(),
            this.sixState(),
            this.sarg04(),
            this.decoyState()
        ];
    }

    /**
     * Get protocol by name
     */
    static getProtocol(name) {
        const protocols = this.getAll();
        return protocols.find(p => p.name.toLowerCase() === name.toLowerCase());
    }
}

/**
 * Noise Models for Quantum Channel Simulation
 */
class NoiseModels {
    /**
     * Bit-flip noise model
     * Simulates random bit flips in the quantum channel
     */
    static bitFlip(bits, probability) {
        return bits.map(bit => {
            if (Math.random() < probability) {
                return bit === 0 ? 1 : 0;
            }
            return bit;
        });
    }

    /**
     * Phase-flip noise model
     * Simulates random phase errors
     */
    static phaseFlip(bits, probability) {
        // Phase flip is equivalent to bit flip in the computational basis
        return this.bitFlip(bits, probability);
    }

    /**
     * Depolarizing noise model
     * Complete randomization with probability p
     */
    static depolarizing(bits, probability) {
        return bits.map(bit => {
            if (Math.random() < probability) {
                return Math.random() < 0.5 ? 0 : 1;
            }
            return bit;
        });
    }

    /**
     * Amplitude damping noise
     * Simulates photon loss in the channel
     */
    static amplitudeDamping(bits, probability) {
        return bits.map(bit => {
            if (bit === 1 && Math.random() < probability) {
                // |1⟩ can decay to |0⟩
                return 0;
            }
            return bit;
        });
    }

    /**
     * Combined noise model
     * Applies multiple noise types
     */
    static combined(bits, options = {}) {
        let result = bits;
        
        if (options.bitFlip) {
            result = this.bitFlip(result, options.bitFlip);
        }
        if (options.phaseFlip) {
            result = this.phaseFlip(result, options.phaseFlip);
        }
        if (options.depolarizing) {
            result = this.depolarizing(result, options.depolarizing);
        }
        if (options.amplitudeDamping) {
            result = this.amplitudeDamping(result, options.amplitudeDamping);
        }
        
        return result;
    }
}

/**
 * Security Analysis Tools
 */
class SecurityAnalysis {
    /**
     * Calculate QBER (Quantum Bit Error Rate)
     */
    static calculateQBER(original, measured) {
        if (original.length !== measured.length) {
            throw new Error('Bit sequences must have equal length');
        }
        
        let errors = 0;
        for (let i = 0; i < original.length; i++) {
            if (original[i] !== measured[i]) {
                errors++;
            }
        }
        
        return (errors / original.length) * 100;
    }

    /**
     * Estimate information leakage
     */
    static estimateLeakage(qber) {
        // Simplified estimation based on QBER
        // In practice, use more sophisticated methods
        return Math.min(qber * 2, 100);
    }

    /**
     * Check if key is secure
     */
    static isSecure(qber, threshold = 11) {
        return qber < threshold;
    }

    /**
     * Calculate key rate
     */
    static calculateKeyRate(rawKeyLength, qber, errorCorrectionOverhead = 1.5) {
        const netKeyRate = 1 - errorCorrectionOverhead * qber / 100;
        return Math.max(0, netKeyRate * rawKeyLength);
    }

    /**
     * Privacy amplification amount
     */
    static calculatePrivacyAmplification(rawKeyLength, qber) {
        const securityParameter = 0.1; // 10% security margin
        const leaked = qber * 1.5; // Conservative estimate
        return Math.floor(rawKeyLength * (leaked / 100 + securityParameter));
    }
}

module.exports = {
    QuantumProtocols,
    NoiseModels,
    SecurityAnalysis
};