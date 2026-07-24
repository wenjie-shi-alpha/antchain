import { defaultConfig, Hono } from "./deps.ts";
import { adminRouter } from "./routes/admin.ts";
import { nodeRouter } from "./routes/node.ts";
import { authRouter } from "./routes/auth.ts";
import { errorMiddleware } from "./middlewares/error.ts";
import { loggerMiddleware } from "./middlewares/logger.ts";
import { authMiddleware } from "./middlewares/auth.ts";
import {
  configuredDevelopmentViewerResolver,
  EcoLabelService,
  LocalDeterministicSandbox,
  MemoryLedgerAdapter,
  ViewerResolver,
} from "./eco/index.ts";
import {
  createEcoLabelRouter,
  createEcoVerificationPage,
} from "./routes/eco-label.ts";

// 从配置中获取应用设置
const appConfig = defaultConfig.app;

export interface AppOptions {
  /** Gateway/IAM-verified identity resolver for the eco-label APIs. */
  viewerResolver?: ViewerResolver;
}

export function createApp(
  ecoService = new EcoLabelService(
    new LocalDeterministicSandbox(),
    new MemoryLedgerAdapter(),
    `http://${appConfig.host}:${appConfig.port}`,
  ),
  options: AppOptions = {},
) {
  const app = new Hono();

  // API版本和信息端点
  app.get("/api", (c) => {
    return c.json({
      success: true,
      data: {
        name: appConfig.name,
        version: appConfig.version,
        description: appConfig.description,
      },
    });
  });

  // 全局中间件
  app.use("*", errorMiddleware);
  app.use("*", loggerMiddleware);

  // 身份验证路由 - 用于身份验证操作(无需认证)
  app.route("/api/auth", authRouter);

  // 管理员路由 - 用于主节点操作(需要认证)
  app.use("/api/admin/*", authMiddleware);
  app.route("/api/admin", adminRouter);

  // 节点路由 - 用于数据节点操作(需要认证)
  app.use("/api/node/*", authMiddleware);
  app.route("/api/node", nodeRouter);

  // Public verification is anonymous. Every non-public eco operation requires
  // an injected trusted identity resolver; development headers are opt-in.
  app.route("/api/eco", createEcoLabelRouter(ecoService, options));
  app.route("/verify", createEcoVerificationPage(ecoService));

  // 404处理
  app.notFound((c) => {
    return c.json({
      success: false,
      code: "NOT_FOUND",
      message: `未找到路由: ${c.req.url}`,
    }, 404);
  });

  return app;
}

export const app = createApp(undefined, {
  viewerResolver: configuredDevelopmentViewerResolver(),
});

// 从配置中获取端口和主机
const port = appConfig.port;
const host = appConfig.host;

// 启动服务器
if (import.meta.main) {
  if (Deno.env.get("ENV") === "production") {
    throw new Error(
      "Refusing production startup with LocalDeterministicSandbox and MemoryLedgerAdapter. Inject approved TCS and AntChain adapters with a trusted ViewerResolver.",
    );
  }
  console.log(`🚀 区块链服务启动中, ${host}:${port}`);
  console.log(`✅ 服务已启动: http://${host}:${port}`);
  console.log(`环境: ${appConfig.environment}`);
  Deno.serve({
    port,
    hostname: host,
    handler: app.fetch,
  });
}
