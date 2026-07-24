const fetch = require('node-fetch');

// 发送请求函数
async function sendPostRequest(url, headers, params) {
    try {
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

// 读取交易请求函数
async function sendDepositRequest(token) {
    try {
      // 设置API端点
      const restUrl = 'http://123.57.145.236:8088';
      const apiEndpoint = '/api/contract/chainCall'; // 假设存证接口为这个，需要根据实际情况修改
      
      
      // 按照图片中的顺序组织请求参数
      const requestData = {
        'accessId': '80cd5f70-a6fa-4b64-97f1-7b22c2d3d88e',
        'bizid': 'M250226181949',
        'hash': '00a7d87deb6d5d1eecbc782b416b74ddc457f5a4e254a34be33fe1872f030323',
        'method': 'QUERYTRANSACTION',
        'token': token,
      };
  
      const headers = {
        'Content-Type': 'application/json;charset=UTF-8'
      };
      
      console.log('Sending deposit request with params:', JSON.stringify(requestData, null, 2));
      
      const responseText = await sendPostRequest(restUrl + apiEndpoint, headers, requestData);
      
      if (responseText) {
        console.log('Deposit response:', responseText);
        try {
          const responseObj = JSON.parse(responseText);
          
          if (responseObj.success) {
            console.log('存证请求成功');
            console.log('交易hash:', responseObj.data);
          } else {
            console.error('存证请求失败');
            console.error('状态码:', responseObj.code);
          }
          
          return responseObj;
        } catch (e) {
          console.error('Failed to parse response:', e);
          console.log('Raw response:', responseText);
          return null;
        }
      } else {
        console.error('Failed to get deposit response');
        return null;
      }
    } catch (error) {
      console.error('Error in sendDepositRequest:', error);
      return null;
    }
}

// 主函数 - 假设token已经获取到
async function main() {
  // 假设您已经获取到的token
  const token = 'eyJhbGciOiJub25lIn0.eyJzdWIiOiI4MGNkNWY3MC1hNmZhLTRiNjQtOTdmMS03YjIyYzJkM2Q4OGUiLCJpYXQiOjE3NDIwNDIyMzIsImV4cCI6MTc0MjA0NDAzMiwiZXh0ZW5kIjoie1wiYWNjZXNzSWRcIjpcIjgwY2Q1ZjcwLWE2ZmEtNGI2NC05N2YxLTdiMjJjMmQzZDg4ZVwiLFwiZmxhZ1wiOjAsXCJ0ZW5hbnRJZFwiOlwiODBjZDVmNzAtYTZmYS00YjY0LTk3ZjEtN2IyMmMyZDNkODhlXCJ9In0.'; // 替换为您实际获取到的token
  
  console.log('开始发送存证请求...');
  const result = await sendDepositRequest(token);
  
  if (result) {
    console.log('完整结果:', JSON.stringify(result, null, 2));
  } else {
    console.error('存证操作失败');
  }
}

// 执行主函数
main();