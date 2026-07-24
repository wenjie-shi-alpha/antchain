import { BlockchainConfig, defaultConfig, blockChainEndpoint } from 'src/config/blockchain.ts';
import * as path from 'std/path/mod.ts';
import { BaseContract } from '@antchain/myassembly';

// Constants
// Path to the private key file (relative to project root)
const PRIVATE_KEY_PATH = './certs/restAkPrivate_key.key';

/**
 * Function to convert Base64 to Hex
 * @param base64String Base64 encoded string
 * @returns Hex encoded string
 */
function base64ToHex(base64String: string): string {
  // In Deno, we can convert from base64 to Uint8Array, then to hex
  const binaryString = atob(base64String);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return Array.from(bytes)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Sign data with private key
 * @param data Data to sign
 * @param privateKey Private key in PEM format
 * @returns Base64 encoded signature
 */
async function signData(data: string, privateKey: string): Promise<string> {
  try {
    // Format private key to proper PEM format
    let formattedKey = privateKey;
    if (!privateKey.includes('-----BEGIN')) {
      // Try PKCS#8 format (commonly used in Java)
      formattedKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`;
    }
    
    // Convert formatted key string to Uint8Array (required by Deno's crypto)
    const pemHeader = '-----BEGIN PRIVATE KEY-----';
    const pemFooter = '-----END PRIVATE KEY-----';
    const pemContents = formattedKey
      .replace(pemHeader, '')
      .replace(pemFooter, '')
      .replace(/\s/g, '');
    
    const binaryKey = atob(pemContents);
    const keyBuffer = new Uint8Array(binaryKey.length);
    for (let i = 0; i < binaryKey.length; i++) {
      keyBuffer[i] = binaryKey.charCodeAt(i);
    }
    
    // Import the private key
    const privateKeyObj = await crypto.subtle.importKey(
      'pkcs8',
      keyBuffer,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    // Convert data string to Uint8Array
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    // Sign the data
    const signature = await crypto.subtle.sign(
      { name: 'RSASSA-PKCS1-v1_5' },
      privateKeyObj,
      dataBuffer
    );
    
    // Convert signature to Base64
    return btoa(String.fromCharCode(...new Uint8Array(signature)));
  } catch (error) {
    console.error('Signature generation error:', error);
    throw error;
  }
}

/**
 * Class for handling blockchain authentication
 */
export class BlockchainAuth {
  private config: BlockchainConfig;
  private tokenCache: {
    token: string | null;
    expiresAt: number;
  } = { token: null, expiresAt: 0 };
  private privateKey: string | null = null;
  private keyPath: string;

  /**
   * Create a new BlockchainAuth instance
   * @param config Configuration options (optional)
   * @param keyPath Path to the private key file (optional)
   */
  constructor(config?: Partial<BlockchainConfig>, keyPath?: string) {
    this.config = { ...defaultConfig, ...config };
    this.keyPath = keyPath || PRIVATE_KEY_PATH;
  }

  /**
   * Load the private key from environment variable or certs folder
   * @returns Promise that resolves when the key is loaded
   */
  async loadPrivateKey(): Promise<void> {
    try {
      // First, try to load from environment variable (priority)
      const envPrivateKey = Deno.env.get('BLOCKCHAIN_PRIVATE_KEY');
      if (envPrivateKey) {
        this.privateKey = envPrivateKey.trim();
        console.log('Private key loaded successfully from environment variable');
        return;
      }
      
      // If not found in environment, load from file
      console.log(`Attempting to load private key from file: ${this.keyPath}`);
      const privateKey = await Deno.readTextFile(this.keyPath);
      this.privateKey = privateKey.trim();
      console.log('Private key loaded successfully from file');
    } catch (error) {
      console.error('Error loading private key:', error);
      throw error;
    }
  }

  /**
   * Set the private key for signing
   * @param privateKey Private key for signing
   */
  setPrivateKey(privateKey: string): void {
    this.privateKey = privateKey;
  }

  /**
   * Get an authentication token
   * @param refresh Whether to force a refresh of the token
   * @returns Authentication token
   */
  async getToken(refresh = false): Promise<string | null> {
    const now = Date.now();
    
    // Return cached token if it's still valid
    if (!refresh && this.tokenCache.token && this.tokenCache.expiresAt > now) {
      return this.tokenCache.token;
    }
    
    try {
      // Make sure private key is loaded
      if (!this.privateKey) {
        await this.loadPrivateKey();
      }
      
      if (!this.privateKey) {
        throw new Error('Failed to load private key');
      }
      
      const response = await this.requestToken();
      if (response) {
        // Parse the response
        const data = JSON.parse(response);
        if (data.success && data.data) {
          // Calculate expiration time (typically 2 hours from now)
          const expiresAt = now + (20 * 60 * 1000);
          
          this.tokenCache = {
            token: data.data,
            expiresAt
          };
          return data.data;
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting authentication token:', error);
      return null;
    }
  }

  /**
   * Request a new token from the blockchain API
   * @returns API response with token data
   */
  private async requestToken(): Promise<string | null> {
    try {
      const now = Date.now();
      
      if (!this.privateKey) {
        throw new Error('Private key is not available');
      }
      
      // Generate signature
      const accessId = this.config.accessId;
      const secretBase64 = await signData(accessId + now, this.privateKey);
      // Convert Base64 encoded secret to hex
      const secret = base64ToHex(secretBase64);
      
      const params = {
        'accessId': accessId,
        'time': now.toString(),
        'secret': secret
      };
      
      const url = `${this.config.restUrl}${blockChainEndpoint.contract.shakeHand}`;
      
      const headers = {
        'Content-Type': 'application/json;charset=UTF-8'
      };
      
      // Use Deno fetch
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(params)
      });
      
      if (response.ok) {
        const responseText = await response.text();
        console.log(`[getToken] Response: [${responseText}]`);
        return responseText;
      } else {
        console.error(`HTTP Error: ${response.status} ${response.statusText}`);
        return null;
      }
    } catch (error) {
      console.error('Error requesting token:', error);
      return null;
    }
  }

  /**
   * Invalidate the current token
   */
  invalidateToken(): void {
    this.tokenCache = { token: null, expiresAt: 0 };
  }
} 