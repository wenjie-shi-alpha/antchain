/**
 * Types for blockchain data operations
 */

/**
 * Data deposit parameters
 */
export interface DataDepositParams {
  data: any; // The data to deposit
  hash?: string; // Optional hash of the data
  metadata?: Record<string, any>; // Additional metadata
  txId?: string; // Optional transaction ID
  timestamp?: string; // Optional timestamp
  bizId?: string; // Optional business ID
  account?: string; // Optional account
}

/**
 * Data query parameters
 */
export interface DataQueryParams {
  dataId?: string; // Optional data ID
  hash?: string; // Optional hash to query
  startTime?: string; // Optional start time for range queries
  endTime?: string; // Optional end time for range queries
  limit?: number; // Optional limit of results
  page?: number; // Optional page number
  bizId?: string; // Optional business ID
  account?: string; // Optional account
} 