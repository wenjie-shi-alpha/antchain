import { PrivacyComputeType } from '../types.ts';

/**
 * Parameters for privacy computation
 */
export interface PrivacyComputeParams {
  computeType: PrivacyComputeType;
  inputData: any;
  encryptionLevel?: string;
  timeoutSeconds?: number;
  parties?: string[];
  resultEncrypted?: boolean;
}

/**
 * Configuration for privacy computation results
 */
export interface ResultConfig {
  callbackUrl?: string;
  saveToBlockchain?: boolean;
  notifyParties?: boolean;
}

/**
 * Options for getting privacy computation results
 */
export interface ResultOptions {
  withProof?: boolean;
  format?: 'json' | 'raw' | 'encrypted';
} 