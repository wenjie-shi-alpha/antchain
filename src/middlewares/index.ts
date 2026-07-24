/**
 * Middlewares 中间件导出
 * 提供HTTP请求处理的中间件功能
 */

// 导入中间件以便在默认导出中使用
import { authMiddleware } from './auth.ts';
import { errorMiddleware } from './error.ts';
import { loggerMiddleware } from './logger.ts';

// 重新导出中间件
export { authMiddleware, errorMiddleware, loggerMiddleware };

// 导出核心区块链功能
// 这允许从一个导入点访问所有功能
export { blockchain, PrivacyComputeType } from '../core/blockchain/index.ts';

// 默认导出所有中间件的集合
export default {
  auth: authMiddleware,
  error: errorMiddleware,
  logger: loggerMiddleware
}; 