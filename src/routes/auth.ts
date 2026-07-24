import { Hono, Status } from "../deps.ts";
import { loggerMiddleware } from "src/middlewares/logger.ts";
import { BlockchainService } from "../services/blockchain.ts";

const router = new Hono();

/**
 * 获取区块链认证token
 * POST /api/auth/token
 */
router.post("/token", async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    
    // 是否强制刷新token
    const refresh = body.refresh || false;
    
    // 获取区块链认证token
    const token = await BlockchainService.getAuthToken(refresh);
    
    if (token) {
      return c.json({
        success: true,
        data: {
          token,
          tokenType: "Bearer",
          expiresIn: 7200, // 2小时，根据实际情况调整
          message: "区块链认证成功"
        }
      });
    } else {
      return c.json({
        success: false,
        code: "AUTH_FAILED",
        message: "无法获取区块链认证令牌，请检查配置和密钥文件"
      }, Status.Unauthorized);
    }
  } catch (error) {
    console.error("Token request error:", error);
    return c.json({
      success: false,
      code: "AUTH_ERROR",
      message: "认证服务出错"
    }, Status.InternalServerError);
  }
});

/**
 * 验证token有效性
 * GET /api/auth/verify
 */
router.get("/verify", async (c) => {
  try {
    // 从请求头获取token
    const token = c.req.header('x-antchain-token') || '';
    
    if (!token) {
      return c.json({
        success: false,
        code: "MISSING_TOKEN",
        message: "请提供认证令牌"
      }, Status.BadRequest);
    }
    
    // 验证token
    const isValid = await BlockchainService.validateToken(token);
    console.log(`Token : ${token}`);
    console.log(`Token verification result: ${isValid}`);
    
    if (isValid) {
      return c.json({
        success: true,
        data: {
          valid: true,
          message: "令牌有效"
        }
      });
    } else {
      return c.json({
        success: false,
        code: "INVALID_TOKEN",
        message: "令牌无效或已过期"
      }, Status.Unauthorized);
    }
  } catch (error) {
    console.error("Token verification error:", error);
    return c.json({
      success: false,
      code: "VERIFY_ERROR",
      message: "令牌验证失败"
    }, Status.InternalServerError);
  }
});

/**
 * 刷新token
 * POST /api/auth/refresh
 */
router.post("/refresh", async (c) => {
  try {
    // 强制获取新token
    const token = await BlockchainService.getAuthToken(true);
    
    if (token) {
      return c.json({
        success: true,
        data: {
          token,
          tokenType: "Bearer",
          expiresIn: 7200,
          message: "令牌刷新成功"
        }
      });
    } else {
      return c.json({
        success: false,
        code: "REFRESH_FAILED",
        message: "无法刷新认证令牌"
      }, Status.Unauthorized);
    }
  } catch (error) {
    console.error("Token refresh error:", error);
    return c.json({
      success: false,
      code: "REFRESH_ERROR",
      message: "令牌刷新失败"
    }, Status.InternalServerError);
  }
});

export { router as authRouter }; 