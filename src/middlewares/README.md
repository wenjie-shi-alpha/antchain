# HTTP 中间件模块

本模块提供纯粹的HTTP中间件功能，用于处理HTTP请求的预处理和后处理。

## 架构说明

### 重构后的分层架构

- **Core层**: 纯粹的区块链业务逻辑，不涉及HTTP (`src/core/`)
- **Services层**: 基于Core的业务服务层，组合多个core功能 (`src/services/`)
- **Middlewares层**: 纯HTTP中间件，处理认证、日志、错误处理等 (`src/middlewares/`)
- **Routes层**: HTTP路由处理，调用services (`src/routes/`)

## 可用中间件

### 认证中间件 (authMiddleware)

验证请求中的认证token并将其附加到上下文中。

```typescript
import { authMiddleware } from './middlewares/auth.ts';

// 在路由中使用
app.use('/api/admin/*', authMiddleware);
```

**功能**:
- 从`Authorization`头获取Bearer token
- 如果未提供token，自动获取区块链认证token
- 验证token有效性
- 将token和认证状态添加到请求上下文

**上下文变量**:
- `token`: 有效的认证token
- `authenticated`: 认证状态 (boolean)

### 错误处理中间件 (errorMiddleware)

统一的错误处理和响应格式化。

```typescript
import { errorMiddleware } from './middlewares/error.ts';

// 全局使用
app.use('*', errorMiddleware);
```

### 日志中间件 (loggerMiddleware)

请求日志记录。

```typescript
import { loggerMiddleware } from './middlewares/logger.ts';

// 全局使用
app.use('*', loggerMiddleware);
```

## 与业务服务的集成

中间件通过 `BlockchainService` 与区块链核心功能集成：

```typescript
import { BlockchainService } from "../services/blockchain.ts";

// 在中间件中使用服务
const token = await BlockchainService.getAuthToken();
const isValid = await BlockchainService.validateToken(token);
```

## 使用示例

### 基本中间件配置

```typescript
import { Hono } from "./deps.ts";
import { 
  authMiddleware, 
  errorMiddleware, 
  loggerMiddleware 
} from "./middlewares/index.ts";

const app = new Hono();

// 全局中间件
app.use('*', errorMiddleware);
app.use('*', loggerMiddleware);

// 认证保护的路由
app.use('/api/admin/*', authMiddleware);
app.use('/api/node/*', authMiddleware);
```

### 在路由中访问中间件数据

```typescript
// 在需要认证的路由中
router.post("/some-endpoint", async (c) => {
  const token = c.get('token');           // 从认证中间件获取
  const authenticated = c.get('authenticated');
  
  // 使用token调用业务服务
  const result = await BlockchainService.someOperation(data, token);
  
  return c.json(result);
});
```

## 与旧版本的区别

### 重构前的问题
- 中间件包含业务逻辑
- 直接调用区块链API
- 代码重复和职责混乱

### 重构后的改进
- **职责单一**: 中间件只处理HTTP层面的逻辑
- **依赖清晰**: 通过服务层访问业务功能
- **代码复用**: 业务逻辑集中在Core和Services层
- **易于测试**: 各层独立，便于单元测试

## 开发指南

### 添加新中间件

1. 创建新的中间件文件
2. 实现 `MiddlewareHandler` 接口
3. 在 `index.ts` 中导出
4. 在文档中添加说明

```typescript
// 示例：新的缓存中间件
import { MiddlewareHandler } from "../deps.ts";

export const cacheMiddleware: MiddlewareHandler = async (c, next) => {
  // 中间件逻辑
  await next();
};
```

### 最佳实践

1. **保持纯粹**: 中间件应该只处理HTTP层面的逻辑
2. **避免业务逻辑**: 业务逻辑应该在Services层处理
3. **错误处理**: 适当的错误处理和日志记录
4. **性能考虑**: 避免在中间件中进行耗时操作
5. **类型安全**: 使用TypeScript类型确保类型安全

## 核心功能访问

如需访问区块链核心功能，请通过Services层：

```typescript
// ❌ 不要直接在中间件中使用
import { blockchain } from '../core/blockchain/index.ts';

// ✅ 推荐通过服务层使用
import { BlockchainService } from '../services/blockchain.ts';
``` 