const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const fetch = require('node-fetch');

// 添加Base64转16进制的函数
function base64ToHex(base64String) {
  // 将Base64解码为Buffer
  const buffer = Buffer.from(base64String, 'base64');
  // 将Buffer转换为16进制字符串
  return buffer.toString('hex');
}

async function getRestToken() {
  try {
    const now = Date.now();
    
    // Read key file - similar to Java operation
    const keyFilePath = path.resolve(__dirname, 'restAkPrivate_key.key');
    // const keyFilePath = path.resolve(__dirname, 'access.key');
    const signKey = fs.readFileSync(keyFilePath, 'utf8').trim();
    
    const accessId = '80cd5f70-a6fa-4b64-97f1-7b22c2d3d88e';
    // const accessId = 'Y3ugQB8U0148135542';
    
    // Generate signature - matching Java implementation
    const secretBase64 = signData(accessId + now, signKey);
    // 将Base64编码的secret转为16进制编码
    const secret = base64ToHex(secretBase64);
    
    const params = {
      'accessId': accessId,
      'time': now.toString(),
      'secret': secret
    };
    
    const restUrl = 'http://123.57.145.236:8088';
    const apiEndpoint = '/api/contract/shakeHand';
    
    const headers = {
      'Content-Type': 'application/json;charset=UTF-8'
    };
    
    return sendPostRequest(restUrl + apiEndpoint, headers, params);
  } catch (error) {
    console.error('Error in getRestToken:', error);
    return null;
  }
}

// Simulate Java's CertUtil.sign method
function signData(data, privateKey) {
  try {
    // Use RSA-SHA256 algorithm - equivalent to Java's SHA256withRSA
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(data, 'utf8');
    
    // Format private key to proper PEM format
    let formattedKey = privateKey;
    if (!privateKey.includes('-----BEGIN')) {
      // Try PKCS#8 format (commonly used in Java)
      formattedKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`;
    }
    
    // Generate signature in Base64 format (commonly used in Java)
    return sign.sign(formattedKey, 'base64');
  } catch (error) {
    console.error('Signature generation error:', error);
    throw error;
  }
}

async function sendPostRequest(url, headers, params) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(params)
      });
      
      if (response.ok) {
        const responseText = await response.text();
        console.log(`[getRestToken] Response: [${responseText}]`);
        return responseText;
      } else {
        console.error(`HTTP Error: ${response.status} ${response.statusText}`);
        return null;
      }
    } catch (error) {
      console.error('Error sending POST request:', error);
      return null;
    }
}

getRestToken()
  .then(response => {
    if (response) {
      console.log('Successfully obtained response');
      console.log('Raw response:', response);
    } else {
      console.error('Failed to obtain response');
    }
  })
  .catch(error => {
    console.error('Unexpected error:', error);
  });