import { blockchain } from 'src/core/blockchain/index.ts';

/**
 * Example showing specific blockchain data use cases
 */

// Store a document hash on the blockchain with metadata
async function storeDocumentHash() {
  console.log('\n=== Storing Document Hash ===');
  
  // In a real application, you would calculate this hash from a document
  const documentHash = '8d7f8e7f8a7d8f7e8a7f8d7e8a7f8d7e8a7f8d7e8a7f8d7e';
  
  try {
    const result = await blockchain.data.depositData({
      data: {
        documentType: 'Contract',
        documentName: 'Service Agreement',
        hashAlgorithm: 'SHA-256',
        hash: documentHash
      },
      metadata: {
        createdBy: 'user123',
        department: 'Legal',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        isConfidential: true
      }
    });
    
    if (result.success) {
      console.log('Document hash stored successfully');
      console.log('Transaction ID:', result.data?.txId);
      console.log('Data ID:', result.data?.dataId);
      return result.data?.dataId;
    } else {
      console.error('Failed to store document hash:', result.message);
      return null;
    }
  } catch (error) {
    console.error('Error storing document hash:', error instanceof Error ? error.message : String(error));
    return null;
  }
}

// Verify a document hash against blockchain record
async function verifyDocumentHash(dataId: string, documentHash: string) {
  console.log('\n=== Verifying Document Hash ===');
  
  try {
    const result = await blockchain.data.queryData({
      dataId: dataId
    });
    
    if (result.success && result.data) {
      console.log('Document record retrieved successfully');
      
      // Extract the stored hash from the blockchain record
      const storedHash = result.data.hash || result.data.data?.hash;
      
      if (storedHash === documentHash) {
        console.log('✅ Document verification PASSED - hash matches blockchain record');
        return true;
      } else {
        console.log('❌ Document verification FAILED - hash does not match blockchain record');
        console.log('Stored hash:', storedHash);
        console.log('Provided hash:', documentHash);
        return false;
      }
    } else {
      console.error('Failed to retrieve document record:', result.message);
      return false;
    }
  } catch (error) {
    console.error('Error verifying document hash:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

// Record a transaction with timestamp
async function recordTransaction() {
  console.log('\n=== Recording Transaction ===');
  
  const transactionId = `TRX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  
  try {
    const result = await blockchain.data.depositData({
      txId: transactionId,
      data: {
        type: 'PAYMENT',
        amount: 1250.75,
        currency: 'CNY',
        sender: 'wallet_123456',
        recipient: 'wallet_789012',
        status: 'COMPLETED'
      },
      metadata: {
        channel: 'mobile_app',
        deviceId: 'iPhone13-XYZ',
        ipAddress: '203.0.113.195',
        location: {
          latitude: 39.9042,
          longitude: 116.4074
        }
      },
      timestamp: new Date().toISOString()
    });
    
    if (result.success) {
      console.log('Transaction recorded successfully');
      console.log('Transaction ID:', transactionId);
      console.log('Blockchain confirmation:', result.data);
      return result.data?.dataId;
    } else {
      console.error('Failed to record transaction:', result.message);
      return null;
    }
  } catch (error) {
    console.error('Error recording transaction:', error instanceof Error ? error.message : String(error));
    return null;
  }
}

// Query transaction history for an account
async function queryTransactionHistory(accountId: string) {
  console.log(`\n=== Querying Transaction History for ${accountId} ===`);
  
  // Get transactions from the last 30 days
  const endTime = new Date().toISOString();
  const startTime = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  
  try {
    // In a real application, filtering would be handled server-side
    // Here we're just using the basic parameters supported by our interface
    const result = await blockchain.data.queryData({
      startTime,
      endTime,
      limit: 20
    });
    
    if (result.success && result.data) {
      // Filter locally for our example (in real app, this would be done server-side)
      let transactions = Array.isArray(result.data) ? result.data : [result.data];
      
      // Apply client-side filtering for the account
      transactions = transactions.filter(tx => {
        const txData = tx.data || {};
        return txData.sender === accountId || txData.recipient === accountId;
      });
      
      console.log(`Retrieved ${transactions.length} transactions`);
      
      // Process and display transaction summary
      transactions.forEach((tx, index) => {
        console.log(`\nTransaction #${index + 1}:`);
        console.log(`- ID: ${tx.txId}`);
        console.log(`- Type: ${tx.data?.type}`);
        console.log(`- Amount: ${tx.data?.amount} ${tx.data?.currency}`);
        console.log(`- Date: ${tx.timestamp || tx.data?.timestamp}`);
        console.log(`- Status: ${tx.data?.status}`);
      });
      
      return transactions;
    } else {
      console.error('Failed to retrieve transaction history:', result.message);
      return [];
    }
  } catch (error) {
    console.error('Error querying transaction history:', error instanceof Error ? error.message : String(error));
    return [];
  }
}

// Main function to run the examples
async function runExamples() {
  try {
    // First, ensure we have a valid token
    const token = await blockchain.auth.getToken();
    if (!token) {
      throw new Error('Failed to get authentication token');
    }
    console.log('Authentication successful');
    
    // Example 1: Store and verify a document hash
    const documentHash = '8d7f8e7f8a7d8f7e8a7f8d7e8a7f8d7e8a7f8d7e8a7f8d7e';
    const dataId = await storeDocumentHash();
    
    if (dataId) {
      await verifyDocumentHash(dataId, documentHash);
      // Test with an incorrect hash
      await verifyDocumentHash(dataId, 'incorrect_hash_123');
    }
    
    // Example 2: Record a transaction
    const transactionDataId = await recordTransaction();
    
    // Example 3: Query transaction history
    if (transactionDataId) {
      await queryTransactionHistory('wallet_123456');
    }
    
    console.log('\n=== All examples completed ===');
  } catch (error) {
    console.error('Error in examples:', error instanceof Error ? error.message : String(error));
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    }
  }
}

// Run the examples
runExamples();

// Execute with:
// deno run -A src/examples/blockchain-data-usage.ts 