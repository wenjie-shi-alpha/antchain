import { blockchain } from 'src/core/blockchain/index.ts';

/**
 * Example for blockchain data operations
 * Demonstrates how to deposit data to blockchain and query it
 */
async function run() {
  try {
    console.log('Blockchain Data Operations Example');
    console.log('==================================');
    
    // Step 1: Get authentication token
    console.log('\n1. Authenticating...');
    const token = await blockchain.auth.getToken();
    if (!token) {
      throw new Error('Failed to get authentication token');
    }
    console.log('Authentication successful');
    
    // Step 2: Deposit data to blockchain
    console.log('\n2. Depositing data to blockchain...');
    const depositResult = await blockchain.data.depositData({
      data: {
        sampleKey: 'Sample value',
        timestamp: new Date().toISOString(),
        numbers: [1, 2, 3, 4, 5],
        nested: {
          property: 'Test nested property'
        }
      },
      metadata: {
        description: 'Example data',
        category: 'test',
        tags: ['example', 'test', 'blockchain']
      }
    });
    
    // 记录完整的响应以便调试
    console.log('===== Raw deposit response =====');
    console.log(JSON.stringify(depositResult, null, 2));
    console.log('================================');
    
    if (!depositResult.success) {
      if (depositResult.rawResponse) {
        console.error('Raw response from server:', depositResult.rawResponse);
      }
      throw new Error(`Data deposit failed: ${depositResult.message} (Code: ${depositResult.code})`);
    }
    
    console.log('Data deposit successful!');
    console.log('Deposit result:', JSON.stringify(depositResult.data, null, 2));
    
    // 尝试从响应中获取交易ID或哈希
    let txHash = null;
    if (typeof depositResult.data === 'string') {
      // 如果数据是字符串，直接使用
      txHash = depositResult.data;
    } else if (depositResult.data && typeof depositResult.data === 'object') {
      // 如果数据是对象，尝试获取txHash或orderId
      txHash = depositResult.data.txHash || depositResult.data.hash || depositResult.data;
    }
    
    if (!txHash) {
      throw new Error('No transaction hash returned from deposit operation');
    }
    
    console.log(`\nTransaction Hash for Query: ${txHash}`);
    
    // 等待3秒，确保交易已经被处理
    console.log('Waiting 3 seconds for transaction to be processed...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Step 3: Query data from blockchain
    console.log(`\n3. Querying data from blockchain (Hash: ${txHash})...`);
    const queryResult = await blockchain.data.queryData({
      dataId: txHash  // 我们的实现会将dataId作为hash参数
    });
    
    // 记录完整的响应以便调试
    console.log('===== Raw query response =====');
    console.log(JSON.stringify(queryResult, null, 2));
    console.log('================================');
    
    if (!queryResult.success) {
      if (queryResult.rawResponse) {
        console.error('Raw response from server:', queryResult.rawResponse);
      }
      throw new Error(`Data query failed: ${queryResult.message} (Code: ${queryResult.code})`);
    }
    
    console.log('Data query successful!');
    console.log('Query result:', JSON.stringify(queryResult.data, null, 2));
    
    // 在成功查询后添加以下代码
    if (queryResult.success && queryResult.data) {
      try {
        // 解析JSON字符串（如果结果是字符串形式）
        const resultObj = typeof queryResult.data === 'string' 
          ? JSON.parse(queryResult.data) 
          : queryResult.data;
        
        // 获取base64编码的数据
        const base64Data = resultObj.transactionDO?.data;
        
        if (base64Data) {
          // 解码base64数据
          // 在Deno中使用:
          const decodedText = new TextDecoder().decode(
            base64ToUint8Array(base64Data)
          );
          
          // 解析为JSON对象
          const originalData = JSON.parse(decodedText);
          console.log('Original stored data:', originalData);
        }
      } catch (error) {
        console.error('Error decoding data:', error);
      }
    }
    
    console.log('\nAll operations completed successfully!');
    
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    }
  }
}

// 辅助函数：转换base64为Uint8Array
function base64ToUint8Array(base64Str: string): Uint8Array {
  const binary = atob(base64Str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
} 

// Run the example
run();

// Execute with:
// deno run -A src/examples/blockchain-data-example.ts 