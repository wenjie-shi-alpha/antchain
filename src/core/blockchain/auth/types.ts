/**
 * Types for authentication operations
 */

/**
 * User role for access control
 */
export enum UserRole {
  ADMIN = "admin",
  NODE = "node",
  USER = "user"
}

/**
 * Authentication token response
 */
export interface AuthToken {
  token: string;
  expiresAt: number; // Timestamp in milliseconds
}

/**
 * Token request parameters
 */
export interface TokenRequest {
  accessId: string;
  tenantId: string;
  account?: string;
  bizId?: string;
} 