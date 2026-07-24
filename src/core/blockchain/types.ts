/**
 * Common types used across the blockchain modules
 */

/**
 * Blockchain transaction status
 */
export enum TransactionStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCESSFUL = 'SUCCESSFUL',
  FAILED = 'FAILED'
}

/**
 * Privacy computation types
 */
export enum PrivacyComputeType {
  TEE = 'TEE',         // Trusted Execution Environment
  MPC = 'MPC',         // Multi-Party Computation
  FHE = 'FHE',         // Fully Homomorphic Encryption
  FEDERATED = 'FEDERATED', // Federated Learning
  SMPC = 'SMPC'        // Secure Multi-Party Computation
} 