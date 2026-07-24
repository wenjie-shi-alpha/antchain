import { MiddlewareHandler, HTTPException } from "../deps.ts";

/**
 * Error handling middleware for Hono
 * Catches errors and formats them as JSON responses
 */
export const errorMiddleware: MiddlewareHandler = async (c, next) => {
  try {
    await next();
  } catch (err: unknown) {
    let status = 500;
    let message = "服务器内部错误";
    let code = "INTERNAL_ERROR";

    // Handle Hono HTTP exceptions
    if (err instanceof HTTPException) {
      status = err.status;
      message = err.message;
      code = `HTTP_${status}`;
    } else if (err instanceof Error) {
      // Handle standard errors
      message = err.message;
    }

    // Log the error
    console.error(`[ERROR] ${status} - ${message}`, err);

    // Send JSON response
    return c.json({
      success: false,
      code,
      message
    }, status);
  }
}; 