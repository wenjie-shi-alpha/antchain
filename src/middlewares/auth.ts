import { Context, MiddlewareHandler } from "../deps.ts";
import { BlockchainService } from "../services/blockchain.ts";

/**
 * 认证中间件
 * 验证请求中的认证token并将其附加到上下文
 */
export const authMiddleware: MiddlewareHandler = async (c, next) => {
  try {
    // 从请求头获取token
    let token: string | null = c.req.header('x-antchain-token') || null;
    
    if (!token) {
      // 如果没有提供token，尝试获取一个新的token
      token = await BlockchainService.getAuthToken();
    }
    
    if (!token) {
      return c.json({
        success: false,
        code: "UNAUTHORIZED",
        message: "认证失败，无法获取访问令牌"
      }, 401);
    }
    
    // 验证token有效性
    const isValid = await BlockchainService.validateToken(token);
    if (!isValid) {
      return c.json({
        success: false,
        code: "INVALID_TOKEN",
        message: "认证令牌无效或已过期"
      }, 401);
    }
    
    // 将token添加到上下文中供后续使用
    c.set('token', token);
    c.set('authenticated', true);
    
    // 继续处理请求
    await next();
  } catch (error) {
    console.error("Authentication middleware error:", error);
    return c.json({
      success: false,
      code: "AUTH_ERROR",
      message: "认证过程中发生错误"
    }, 500);
  }
}; 