import { logger } from '../logger';
import { sendResponse } from "../../utils";

/**
 * 1. GLOBAL PROCESS MONITORING (FATAL/CRITICAL)
 * These catch errors that happen outside of Express routes.
 */
process.on('uncaughtException', (err) => {
  logger.log('crit', `💀 FATAL: Uncaught Exception: ${err.message}`, { 
    stack: err.stack,
    type: 'process_crash' 
  });
  // Best practice: Exit after a short delay so Loki can flush the log
  setTimeout(() => process.exit(1), 1000);
});

process.on('unhandledRejection', (reason: any) => {
  logger.log('crit', `🛑 FATAL: Unhandled Rejection`, { 
    message: reason?.message || reason, 
    stack: reason?.stack 
  });
});

/**
 * 2. EXPRESS ERROR MIDDLEWARE (ERROR/WARN)
 * This replaces your existing crashHandler and errorHandler.
 */
export const crashHandler = (err: any, req: any, res: any, next: any) => {
  const status = err.status || err.statusCode || 500;
  const messageKey = err.message || 'INTERNAL_SERVER_ERROR';

  const logContext = {
    path: req.originalUrl,
    method: req.method,
    status,
    userId: req.user?.id || 'anonymous',
    stack: err.stack
  };

  if (status >= 500) {
    // 🔴 ERROR: Broken code or database issues
    logger.error(`❌ Server Error: ${messageKey}`, logContext);
  } else {
    // 🟡 WARN: Bad requests, 404s, or Auth issues
    logger.warn(`⚠️ Client Warning: ${messageKey}`, logContext);
  }

  return sendResponse({
    res,
    status,
    messageKey,
    data: null,
    req,
  });
};