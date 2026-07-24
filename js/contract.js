const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid'); // 添加UUID库

// 发送请求函数
async function sendPostRequest(url, headers, params) {
    try {
      console.log('发送POST请求:', url);
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(params)
      });
      
      if (response.ok) {
        const responseText = await response.text();
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

// 调用WASM合约函数
async function callWasmContract(token) {
    try {
      // 设置API端点
      const restUrl = 'http://123.57.145.236:8088';
      const apiEndpoint = '/api/contract/chainCallForBiz'; // WASM合约调用接口
      
      // 生成唯一的orderId
      const orderId = uuidv4();
      console.log('生成GetName请求的orderId:', orderId);
      
      // 按照图片中的示例顺序组织请求参数
      const requestData = {
        'accessId': '80cd5f70-a6fa-4b64-97f1-7b22c2d3d88e',
        'account': 'shi',
        'bizid': 'M250226181949',
        'gas': 0,
        'inputParamListStr': '[]',
        'method': 'CALLWASMCONTRACTASYNC',
        'methodSignature': 'GetName()',
        'mykmsKeyId': '80cd5f70-a6fa-4b64-97f1-7b22c2d3d88e_1741933298091_key',
        'orderId': orderId, // 使用新生成的UUID'
        'outTypes': '[string]',
        'tenantid': '80cd5f70-a6fa-4b64-97f1-7b22c2d3d88e',
        'token': token,
        'withGasHold': false,
        'contractName': 'tiangong_fist_test_contract_swj' // 根据合约代码添加
      };
  
      const headers = {
        'Content-Type': 'application/json;charset=UTF-8',
      };
      
      console.log('发送WASM合约调用请求，参数:', JSON.stringify(requestData, null, 2));
      
      const responseText = await sendPostRequest(restUrl + apiEndpoint, headers, requestData);
      
      if (responseText) {
        console.log('合约调用响应:', responseText);
        try {
          const responseObj = JSON.parse(responseText);
          
          if (responseObj.success) {
            console.log('合约调用成功');
            console.log('返回数据:', responseObj.data);
          } else {
            console.error('合约调用失败');
            console.error('状态码:', responseObj.code);
          }
          
          return responseObj;
        } catch (e) {
          console.error('解析响应失败:', e);
          console.log('原始响应:', responseText);
          return null;
        }
      } else {
        console.error('未能获取合约调用响应');
        return null;
      }
    } catch (error) {
      console.error('callWasmContract 函数出错:', error);
      return null;
    }
}

// 设置合约名称函数
async function setContractName(token, newName) {
    try {
      // 设置API端点
      const restUrl = 'http://123.57.145.236:8088';
      const apiEndpoint = '/api/contract/chainCallForBiz'; // WASM合约调用接口
      
      // 生成唯一的orderId
      const orderId = uuidv4();
      console.log('生成GetName请求的orderId:', orderId);
      
      // 按照图片中的示例顺序组织请求参数
      const requestData = {
        'accessId': '80cd5f70-a6fa-4b64-97f1-7b22c2d3d88e',
        'account': 'shi',
        'bizid': 'M250226181949',
        'gas': 0,
        'inputParamListStr': '[]',
        'method': 'CALLWASMCONTRACTASYNC',
        'methodSignature': 'setName(string)',
        'isLocalTransaction':true,
        'mykmsKeyId': '80cd5f70-a6fa-4b64-97f1-7b22c2d3d88e_1741933298091_key',
        'orderId': orderId, // 使用新生成的UUID'
        'outTypes': '[]',
        'tenantid': '80cd5f70-a6fa-4b64-97f1-7b22c2d3d88e',
        'token': token,
        'withGasHold': false,
        'contractName': 'tiangong_fist_test_contract_swj' // 根据合约代码添加
      };
  
      const headers = {
        'Content-Type': 'application/json;charset=UTF-8',
      };
      
      console.log('发送设置合约名称请求，参数:', JSON.stringify(requestData, null, 2));
      
      const responseText = await sendPostRequest(restUrl + apiEndpoint, headers, requestData);
      
      if (responseText) {
        console.log('设置名称响应:', responseText);
        try {
          const responseObj = JSON.parse(responseText);
          
          if (responseObj.success) {
            console.log('设置合约名称成功');
          } else {
            console.error('设置合约名称失败');
            console.error('状态码:', responseObj.code);
          }
          
          return responseObj;
        } catch (e) {
          console.error('解析响应失败:', e);
          console.log('原始响应:', responseText);
          return null;
        }
      } else {
        console.error('未能获取设置名称响应');
        return null;
      }
    } catch (error) {
      console.error('setContractName 函数出错:', error);
      return null;
    }
}

// 主函数
async function main() {
  // 需要先安装uuid库: npm install uuid
  
  // 替换为实际的认证令牌
  const token = 'eyJhbGciOiJub25lIn0.eyJzdWIiOiI4MGNkNWY3MC1hNmZhLTRiNjQtOTdmMS03YjIyYzJkM2Q4OGUiLCJpYXQiOjE3NDIzNTA1MTUsImV4cCI6MTc0MjM1MjMxNSwiZXh0ZW5kIjoie1wiYWNjZXNzSWRcIjpcIjgwY2Q1ZjcwLWE2ZmEtNGI2NC05N2YxLTdiMjJjMmQzZDg4ZVwiLFwiZmxhZ1wiOjAsXCJ0ZW5hbnRJZFwiOlwiODBjZDVmNzAtYTZmYS00YjY0LTk3ZjEtN2IyMmMyZDNkODhlXCJ9In0.';
  
  console.log('开始调用合约GetName方法...');
  const getResult = await callWasmContract(token);
  
  if (getResult && getResult.success) {
    console.log('GetName调用完成，结果:', JSON.stringify(getResult, null, 2));
    
    // 接下来设置新名称

    console.log('开始调用合约SetName方法...');
    const newName = 'newFishName';
    const setResult = await setContractName(token, newName);
    
    if (setResult && setResult.success) {
      console.log('SetName调用完成，结果:', JSON.stringify(setResult, null, 2));
      
      // 再次调用GetName查看是否设置成功
      console.log('再次调用GetName验证名称是否更新...');
      const verifyResult = await callWasmContract(token); // 这里会再次生成新的UUID
      
      if (verifyResult && verifyResult.success) {
        console.log('名称验证结果:', JSON.stringify(verifyResult, null, 2));
      } else {
        console.error('名称验证失败');
      }
    } else {
      console.error('SetName操作失败');
    }
  } else {
    console.error('GetName操作失败');
  }
}

// 执行主函数
main();