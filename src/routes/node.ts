import { Hono, Status } from "../deps.ts";
import { BlockchainService } from "../services/blockchain.ts";
import { parseData } from "../core/blockchain/data/index.ts";

const router = new Hono();

/**
 * 存储数据到区块链
 * POST /api/node/data/store
 */
router.post("/data/store", async (c) => {
  try {
    const body = await c.req.json();
    const token = c.req.header('x-antchain-token') || '';
    
    if (!body.data) {
      return c.json({
        success: false,
        code: "MISSING_DATA",
        message: "缺少数据字段"
      }, Status.BadRequest);
    }
    
    // 确保数据是字符串格式
    const dataString = typeof body.data === 'string' ? body.data : JSON.stringify(body.data);
    
    // 调用区块链服务存储数据
    const result = await BlockchainService.storeData(dataString, token);
    
    if (result.success) {
      return c.json({
        success: true,
        data: result.data,
        message: "数据存储成功"
      }, Status.Created);
    } else {
      return c.json({
        success: false,
        code: result.code || "STORAGE_FAILED",
        message: result.message || "数据存储失败"
      }, Status.InternalServerError);
    }
  } catch (error) {
    console.error("Store data error:", error);
    return c.json({
      success: false,
      code: "SERVER_ERROR",
      message: "服务器处理请求时发生错误"
    }, Status.InternalServerError);
  }
});

/**
 * 查询区块链数据
 * POST /api/node/data/query
 */
router.post("/data/query", async (c) => {
  try {
    const body = await c.req.json();
    const token = c.req.header('x-antchain-token') || '';
    
    // 构建查询参数
    const queryParams = {
      dataId: body.dataId,
      hash: body.hash,
      timestamp: body.timestamp,
      filters: body.filters || {}
    };
    
    // 调用区块链服务查询数据
    const result = await BlockchainService.queryData(queryParams, token);
    
    if (result.success) {
      return c.json({
        success: true,
        data: result.data
      });
    } else {
      return c.json({
        success: false,
        code: result.code || "QUERY_FAILED",
        message: result.message || "数据查询失败"
      }, Status.InternalServerError);
    }
  } catch (error) {
    console.error("Query data error:", error);
    return c.json({
      success: false,
      code: "SERVER_ERROR",
      message: "服务器处理请求时发生错误"
    }, Status.InternalServerError);
  }
});

router.post("/data/parse", async (c) => {
  const body = await c.req.json();
  const data = body.data;
  const result = parseData(data);
  return c.json({
    success: true,
    data: result
  });
});
/**
 * 查询交易状态
 * GET /api/node/transactions/:txHash/status
 */
router.get("/transactions/:txHash/status", async (c) => {
  try {
    const txHash = c.req.param('txHash');
    const token = c.req.header('x-antchain-token') || '';
    
    if (!txHash) {
      return c.json({
        success: false,
        code: "MISSING_TX_HASH",
        message: "缺少交易哈希"
      }, Status.BadRequest);
    }
    
    // 调用区块链服务查询交易状态
    const result = await BlockchainService.getTransactionStatus(txHash, token);
    
    if (result.success) {
      return c.json({
        success: true,
        data: result.data
      });
    } else {
      return c.json({
        success: false,
        code: result.code || "TX_QUERY_FAILED",
        message: result.message || "交易状态查询失败"
      }, Status.InternalServerError);
    }
  } catch (error) {
    console.error("Transaction status query error:", error);
    return c.json({
      success: false,
      code: "SERVER_ERROR",
      message: "服务器处理请求时发生错误"
    }, Status.InternalServerError);
  }
});

/**
 * 推送数据到隐私计算任务
 * POST /api/node/privacy/tasks/:taskId/data
 */
router.post("/privacy/tasks/:taskId/data", async (c) => {
  try {
    const taskId = c.req.param('taskId');
    const token = c.req.header('x-antchain-token') || '';
    
    if (!taskId) {
      return c.json({
        success: false,
        code: "MISSING_TASK_ID",
        message: "缺少任务ID"
      }, Status.BadRequest);
    }
    
    const body = await c.req.json();
    
    if (!body.data) {
      return c.json({
        success: false,
        code: "MISSING_DATA",
        message: "缺少数据字段"
      }, Status.BadRequest);
    }
    
    // 调用区块链服务推送数据
    const result = await BlockchainService.pushPrivacyData(taskId, body.data, token);
    
    if (result.success) {
      return c.json({
        success: true,
        data: result.data,
        message: "数据推送成功"
      });
    } else {
      return c.json({
        success: false,
        code: result.code || "DATA_PUSH_FAILED",
        message: result.message || "推送数据失败"
      }, Status.InternalServerError);
    }
  } catch (error) {
    console.error("Push privacy data error:", error);
    return c.json({
      success: false,
      code: "SERVER_ERROR",
      message: "服务器处理请求时发生错误"
    }, Status.InternalServerError);
  }
});

/**
 * 查询隐私计算任务状态
 * GET /api/node/privacy/tasks/:taskId/status
 */
router.get("/privacy/tasks/:taskId/status", async (c) => {
  try {
    const taskId = c.req.param('taskId');
    const token = c.req.header('x-antchain-token') || '';
    
    if (!taskId) {
      return c.json({
        success: false,
        code: "MISSING_TASK_ID",
        message: "缺少任务ID"
      }, Status.BadRequest);
    }
    
    // 调用TCS服务查询实例状态；不传scope时使用配置中的默认实验。
    const result = await BlockchainService.getPrivacyTaskStatus(taskId, token, {
      projectId: c.req.query('projectId'),
      envId: c.req.query('envId'),
      appId: c.req.query('appId'),
      tenantId: c.req.query('tenantId'),
    });
    
    if (result.success) {
      return c.json({
        success: true,
        data: result.data
      });
    } else {
      return c.json({
        success: false,
        code: result.code || "TASK_STATUS_QUERY_FAILED",
        message: result.message || "任务状态查询失败"
      }, Status.InternalServerError);
    }
  } catch (error) {
    console.error("Privacy task status query error:", error);
    return c.json({
      success: false,
      code: "SERVER_ERROR",
      message: "服务器处理请求时发生错误"
    }, Status.InternalServerError);
  }
});

/**
 * 调用智能合约（数据节点权限）
 * POST /api/node/contracts/call
 */
router.post("/contracts/call", async (c) => {
  try {
    const body = await c.req.json();
    const token = c.req.header('x-antchain-token') || '';
    
    // 验证必要字段
    if (!body.contractName || !body.methodSignature) {
      return c.json({
        success: false,
        code: "MISSING_FIELDS",
        message: "合约名称和方法签名是必填字段"
      }, Status.BadRequest);
    }
    
    const callParams = {
      contractName: body.contractName,
      methodSignature: body.methodSignature,
      inputParamListStr: body.inputParams ? JSON.stringify(body.inputParams) : '[]',
      outputTypes: body.outputTypes || ['string'],
      isLocalTransaction: body.isLocalTransaction !== false
    };
    
    // 调用区块链服务执行合约方法
    const result = await BlockchainService.callContract(callParams, token);
    
    if (result.success) {
      return c.json({
        success: true,
        data: result.data
      });
    } else {
      return c.json({
        success: false,
        code: result.code || "CONTRACT_CALL_FAILED",
        message: result.message || "智能合约调用失败"
      }, Status.InternalServerError);
    }
  } catch (error) {
    console.error("Contract call error:", error);
    return c.json({
      success: false,
      code: "SERVER_ERROR",
      message: "服务器处理请求时发生错误"
    }, Status.InternalServerError);
  }
});

/**
 * 节点健康检查
 * GET /api/node/health
 */
router.get("/health", async (c) => {
  try {
    const token = c.req.header('x-antchain-token') || '';
    
    // 检查区块链连接状态
    const tokenValid = await BlockchainService.validateToken(token);
    
    return c.json({
      success: true,
      data: {
        status: tokenValid ? "healthy" : "degraded",
        blockchain: {
          connected: tokenValid,
          lastCheck: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("Health check error:", error);
    return c.json({
      success: false,
      code: "HEALTH_CHECK_FAILED",
      message: "健康检查失败"
    }, Status.InternalServerError);
  }
});

export { router as nodeRouter }; 
