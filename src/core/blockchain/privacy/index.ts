import { ApiResponse } from 'src/deps.ts';
import { 
  defaultHeaders, 
  generateUUID, 
  sendRequest, 
  parseResponse
} from '../base.ts';
import { BlockchainConfig, defaultConfig } from 'src/config/blockchain.ts';
import { BlockchainAuth } from '../auth/index.ts';
import { PrivacyComputeParams, ResultConfig, ResultOptions } from './types.ts';

/**
 * Legacy class for the removed /privacy/task blockchain endpoints.
 * New privacy-computing execution uses the TCS workflow in src/core/tcs.
 */
export class BlockchainPrivacy {
  private config: BlockchainConfig;
  private auth: BlockchainAuth;

  /**
   * Create a new BlockchainPrivacy instance
   * @param config Configuration options (optional)
   */
  constructor(config?: Partial<BlockchainConfig>) {
    this.config = { ...defaultConfig, ...config };
    this.auth = new BlockchainAuth(config);
  }

  /**
   * Create a privacy computation task
   * @param params Privacy computation parameters
   * @param resultConfig Result configuration (optional)
   * @param token Authentication token (optional)
   * @returns Response containing task ID
   */
  async createPrivacyTask(
    params: PrivacyComputeParams,
    resultConfig?: ResultConfig,
    token?: string
  ): Promise<ApiResponse> {
    try {
      // Get token if not provided
      if (!token) {
        const authToken = await this.auth.getToken();
        if (!authToken) {
          return {
            success: false,
            message: 'Authentication failed',
            code: 'AUTH_ERROR'
          };
        }
        token = authToken;
      }

      const url = `${this.config.restUrl}/privacy/task`;
      
      // Prepare request body
      const requestBody = {
        ...params,
        taskId: generateUUID(), // Generate task ID
        timestamp: new Date().toISOString(),
        resultConfig: resultConfig || {}
      };
      
      // Prepare headers
      const headers = {
        ...defaultHeaders,
        'Authorization': `Bearer ${token}`
      };
      
      // Send request
      const response = await sendRequest(
        url,
        'POST',
        headers,
        requestBody
      );
      
      return await parseResponse(response);
    } catch (error) {
      console.error('Error creating privacy task:', error);
      return {
        success: false,
        message: 'Failed to create privacy task',
        code: 'REQUEST_ERROR'
      };
    }
  }

  /**
   * Push data to a privacy computation task
   * @param taskId Task ID
   * @param data Data to push
   * @param token Authentication token (optional)
   * @returns Response indicating success
   */
  async pushData(
    taskId: string,
    data: any,
    token?: string
  ): Promise<ApiResponse> {
    try {
      // Get token if not provided
      if (!token) {
        const authToken = await this.auth.getToken();
        if (!authToken) {
          return {
            success: false,
            message: 'Authentication failed',
            code: 'AUTH_ERROR'
          };
        }
        token = authToken;
      }

      const url = `${this.config.restUrl}/privacy/task/${taskId}/data`;
      
      // Prepare request body
      const requestBody = {
        data,
        timestamp: new Date().toISOString()
      };
      
      // Prepare headers
      const headers = {
        ...defaultHeaders,
        'Authorization': `Bearer ${token}`
      };
      
      // Send request
      const response = await sendRequest(
        url,
        'POST',
        headers,
        requestBody
      );
      
      return await parseResponse(response);
    } catch (error) {
      console.error('Error pushing data to privacy task:', error);
      return {
        success: false,
        message: 'Failed to push data',
        code: 'REQUEST_ERROR'
      };
    }
  }

  /**
   * Query the status of a privacy computation task
   * @param taskId Task ID
   * @param token Authentication token (optional)
   * @returns Response containing task status
   */
  async queryTaskStatus(
    taskId: string,
    token?: string
  ): Promise<ApiResponse> {
    try {
      // Get token if not provided
      if (!token) {
        const authToken = await this.auth.getToken();
        if (!authToken) {
          return {
            success: false,
            message: 'Authentication failed',
            code: 'AUTH_ERROR'
          };
        }
        token = authToken;
      }

      const url = `${this.config.restUrl}/privacy/task/${taskId}/status`;
      
      // Prepare headers
      const headers = {
        ...defaultHeaders,
        'Authorization': `Bearer ${token}`
      };
      
      // Send request
      const response = await sendRequest(
        url,
        'GET',
        headers
      );
      
      return await parseResponse(response);
    } catch (error) {
      console.error('Error querying privacy task status:', error);
      return {
        success: false,
        message: 'Failed to query task status',
        code: 'REQUEST_ERROR'
      };
    }
  }

  /**
   * Get the result of a privacy computation task
   * @param taskId Task ID
   * @param options Result options (optional)
   * @param token Authentication token (optional)
   * @returns Response containing computation result
   */
  async getPrivacyResult(
    taskId: string,
    options?: ResultOptions,
    token?: string
  ): Promise<ApiResponse> {
    try {
      // Get token if not provided
      if (!token) {
        const authToken = await this.auth.getToken();
        if (!authToken) {
          return {
            success: false,
            message: 'Authentication failed',
            code: 'AUTH_ERROR'
          };
        }
        token = authToken;
      }

      // Build query string from options
      const queryParams = new URLSearchParams();
      if (options?.withProof) queryParams.set('withProof', 'true');
      if (options?.format) queryParams.set('format', options.format);
      
      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
      const url = `${this.config.restUrl}/privacy/task/${taskId}/result${queryString}`;
      
      // Prepare headers
      const headers = {
        ...defaultHeaders,
        'Authorization': `Bearer ${token}`
      };
      
      // Send request
      const response = await sendRequest(
        url,
        'GET',
        headers
      );
      
      return await parseResponse(response);
    } catch (error) {
      console.error('Error getting privacy result:', error);
      return {
        success: false,
        message: 'Failed to get privacy result',
        code: 'REQUEST_ERROR'
      };
    }
  }

  /**
   * Cancel a privacy computation task
   * @param taskId Task ID
   * @param reason Cancellation reason
   * @param token Authentication token (optional)
   * @returns Response indicating success
   */
  async cancelTask(
    taskId: string,
    reason: string,
    token?: string
  ): Promise<ApiResponse> {
    try {
      // Get token if not provided
      if (!token) {
        const authToken = await this.auth.getToken();
        if (!authToken) {
          return {
            success: false,
            message: 'Authentication failed',
            code: 'AUTH_ERROR'
          };
        }
        token = authToken;
      }

      const url = `${this.config.restUrl}/privacy/task/${taskId}/cancel`;
      
      // Prepare request body
      const requestBody = {
        reason,
        timestamp: new Date().toISOString()
      };
      
      // Prepare headers
      const headers = {
        ...defaultHeaders,
        'Authorization': `Bearer ${token}`
      };
      
      // Send request
      const response = await sendRequest(
        url,
        'POST',
        headers,
        requestBody
      );
      
      return await parseResponse(response);
    } catch (error) {
      console.error('Error cancelling privacy task:', error);
      return {
        success: false,
        message: 'Failed to cancel task',
        code: 'REQUEST_ERROR'
      };
    }
  }
} 
