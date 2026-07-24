import { MiddlewareHandler } from "../deps.ts";

/**
 * Logger middleware for Hono
 * Logs HTTP requests with method, path, status and response time
 */
export const loggerMiddleware: MiddlewareHandler = async (c, next) => {
  const start = Date.now();
  const requestId = crypto.randomUUID();
  
  // Add request ID to the context for tracking
  c.set('requestId', requestId);
  
  // Log request start
  console.log(
    `[${new Date().toISOString()}] [${requestId}] --> ${c.req.method} ${c.req.url}`
  );
  
  // Process the request
  await next();
  
  // Calculate processing time
  const ms = Date.now() - start;
  
  // Log request completion - We'll get the status from the response
  console.log(
    `[${new Date().toISOString()}] [${requestId}] <-- ${c.req.method} ${c.req.url} (${ms}ms)`
  );
}; 