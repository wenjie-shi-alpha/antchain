import { ApiResponse } from 'src/deps.ts';


/**
 * Default headers for API requests
 */
export const defaultHeaders = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

/**
 * Generate a UUID
 * @returns A UUID string
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Log request details for debugging
 * @param url API endpoint URL
 * @param method HTTP method
 * @param headers Request headers
 * @param body Request body
 */
export function logRequest(url: string, method: string, headers: Record<string, string>, body?: any): void {
  console.debug(`🚀 Request: ${method} ${url}`);
  console.debug('Headers:', headers);
  if (body) console.debug('Body:', body);
}

/**
 * Log response details for debugging
 * @param status HTTP status code
 * @param body Response body
 */
export function logResponse(status: number, body: any): void {
  console.debug(`📬 Response: ${status}`);
  console.debug('Body:', body);
}

/**
 * Send a request to the blockchain API
 * @param url API endpoint URL
 * @param method HTTP method
 * @param headers Request headers
 * @param body Request body
 * @returns Response data
 */
export async function sendRequest(
  url: string,
  method: string = 'GET',
  headers: Record<string, string> = defaultHeaders,
  body?: any
): Promise<Response> {
  const options: RequestInit = {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  };

  logRequest(url, method, headers, body);
  
  const response = await fetch(url, options);
  return response;
}

/**
 * Parse API response
 * @param response Fetch Response object
 * @returns Parsed API response
 */
export async function parseResponse(response: Response): Promise<ApiResponse> {
  const contentType = response.headers.get('content-type') || '';
  
  if (contentType.includes('application/json')) {
    const data = await response.json();
    logResponse(response.status, data);
    return data;
  } else {
    const text = await response.text();
    logResponse(response.status, text);
    return {
      success: response.ok,
      message: text,
      code: response.ok ? 'SUCCESS' : 'ERROR'
    };
  }
} 