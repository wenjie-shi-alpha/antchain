import { Hono, Status } from "../deps.ts";
import { BlockchainService } from "../services/blockchain.ts";
import { PrivacyComputeType } from "../core/blockchain/index.ts";

const router = new Hono();

/**
 * 获取所有支持的隐私计算类型
 * GET /api/admin/compute-types
 */
router.get("/compute-types", (c) => {
  return c.json({
    success: true,
    data: {
      types: Object.values(PrivacyComputeType),
      descriptions: {
        [PrivacyComputeType.TEE]: "可信执行环境 - 在隔离安全环境中执行计算",
        [PrivacyComputeType.MPC]: "多方安全计算 - 允许多方在不泄露原始数据的情况下共同计算",
        [PrivacyComputeType.FHE]: "全同态加密 - 在加密状态下直接进行计算，无需解密",
        [PrivacyComputeType.FEDERATED]: "联邦学习 - 分布式机器学习方法，数据不离开本地",
        [PrivacyComputeType.SMPC]: "安全多方计算 - 多方在保护隐私的前提下共同计算"
      }
    }
  });
});

/**
 * 创建TCS隐私计算实例
 * POST /api/admin/privacy/tasks
 */
router.post("/privacy/tasks", async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const token = c.req.header('x-antchain-token') || '';

    // 旧的 /privacy/task API 不存在；这里改为创建TCS平台应用实例。
    if (body.computeType && !Object.values(PrivacyComputeType).includes(body.computeType)) {
      return c.json({
        success: false,
        code: "INVALID_COMPUTE_TYPE",
        message: `无效的计算类型: ${body.computeType}`
      }, Status.BadRequest);
    }
    
    // TCS实例参数；不传时使用配置中的默认 test3 实验。
    const params = {
      computeType: body.computeType || PrivacyComputeType.TEE,
      inputData: body.inputData || {},
      projectId: body.projectId,
      envId: body.envId,
      appId: body.appId,
      tenantId: body.tenantId,
    };
    
    // 调用区块链服务创建任务
    const result = await BlockchainService.createPrivacyTask(params, token);
    
    if (result.success) {
      return c.json({
        success: true,
        data: result.data,
        message: "TCS隐私计算实例创建成功"
      }, Status.Created);
    } else {
      return c.json({
        success: false,
        code: result.code || "TASK_CREATION_FAILED",
        message: result.message || "创建TCS隐私计算实例失败"
      }, Status.InternalServerError);
    }
  } catch (error) {
    console.error("Create privacy task error:", error);
    return c.json({
      success: false,
      code: "SERVER_ERROR",
      message: "服务器处理请求时发生错误"
    }, Status.InternalServerError);
  }
});

/**
 * 创建TCS隐私计算实例并等待结果
 * POST /api/admin/privacy/tasks/run
 */
router.post("/privacy/tasks/run", async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const result = await BlockchainService.runPrivacyTask({
      projectId: body.projectId,
      envId: body.envId,
      appId: body.appId,
      tenantId: body.tenantId,
    });

    return c.json(result, result.success ? Status.Created : Status.InternalServerError);
  } catch (error) {
    console.error("Run privacy task error:", error);
    return c.json({
      success: false,
      code: "SERVER_ERROR",
      message: "服务器处理请求时发生错误"
    }, Status.InternalServerError);
  }
});

/**
 * 获取隐私计算任务状态
 * GET /api/admin/privacy/tasks/:taskId/status
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
    
    // 调用区块链服务获取任务状态
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
        code: result.code || "STATUS_QUERY_FAILED",
        message: result.message || "查询任务状态失败"
      }, Status.InternalServerError);
    }
  } catch (error) {
    console.error("Get task status error:", error);
    return c.json({
      success: false,
      code: "SERVER_ERROR",
      message: "服务器处理请求时发生错误"
    }, Status.InternalServerError);
  }
});

/**
 * 获取隐私计算结果
 * GET /api/admin/privacy/tasks/:taskId/result
 */
router.get("/privacy/tasks/:taskId/result", async (c) => {
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
    
    // 调用区块链服务获取计算结果
    const result = await BlockchainService.getPrivacyResult(taskId, token, {
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
        code: result.code || "RESULT_QUERY_FAILED",
        message: result.message || "获取计算结果失败"
      }, Status.BadRequest);
    }
  } catch (error) {
    console.error("Get task result error:", error);
    return c.json({
      success: false,
      code: "SERVER_ERROR",
      message: "服务器处理请求时发生错误"
    }, Status.InternalServerError);
  }
});

/**
 * 取消隐私计算任务
 * DELETE /api/admin/privacy/tasks/:taskId
 */
router.delete("/privacy/tasks/:taskId", async (c) => {
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
    
    // 获取取消原因
    const body = await c.req.json().catch(() => ({}));
    const reason = body.reason || "管理员取消";
    
    // 调用区块链服务取消任务
    const result = await BlockchainService.cancelPrivacyTask(taskId, reason, token);
    
    if (result.success) {
      return c.json({
        success: true,
        message: "任务取消成功"
      });
    } else {
      return c.json({
        success: false,
        code: result.code || "CANCEL_FAILED",
        message: result.message || "取消任务失败"
      }, Status.InternalServerError);
    }
  } catch (error) {
    console.error("Cancel task error:", error);
    return c.json({
      success: false,
      code: "SERVER_ERROR",
      message: "服务器处理请求时发生错误"
    }, Status.InternalServerError);
  }
});

/**
 * 部署智能合约
 * POST /api/admin/contracts/deploy
 */
router.post("/contracts/deploy", async (c) => {
  try {
    const body = await c.req.json();
    const token = c.req.header('x-antchain-token') || '';
    
    // 验证必要字段
    if (!body.contractCode || !body.contractName) {
      return c.json({
        success: false,
        code: "MISSING_FIELDS",
        message: "合约代码和合约名称是必填字段"
      }, Status.BadRequest);
    }
    
    const deployParams = {
      contractName: body.contractName,
      contractCode: body.contractCode,
      constructor: body.constructor || {},
      gas: body.gas || 0
    };
    
    // 调用区块链服务部署合约
    const result = await BlockchainService.deployContract(deployParams, token);
    
    if (result.success) {
      return c.json({
        success: true,
        data: result.data,
        message: "智能合约部署成功"
      }, Status.Created);
    } else {
      return c.json({
        success: false,
        code: result.code || "DEPLOY_FAILED",
        message: result.message || "智能合约部署失败"
      }, Status.InternalServerError);
    }
  } catch (error) {
    console.error("Deploy contract error:", error);
    return c.json({
      success: false,
      code: "SERVER_ERROR",
      message: "服务器处理请求时发生错误"
    }, Status.InternalServerError);
  }
});

/**
 * 调用智能合约
 * POST /api/admin/contracts/call
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
        code: result.code || "CALL_FAILED",
        message: result.message || "智能合约调用失败"
      }, Status.InternalServerError);
    }
  } catch (error) {
    console.error("Call contract error:", error);
    return c.json({
      success: false,
      code: "SERVER_ERROR",
      message: "服务器处理请求时发生错误"
    }, Status.InternalServerError);
  }
});

export { router as adminRouter }; 
