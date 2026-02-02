import { Request, Response, NextFunction } from 'express';
import { ApiError, sendResponse } from '../../utils';
import { logger } from '../logger';

// 1. Process Level (FATAL/CRITICAL)
export const initFatalErrorHandlers = () => {
  process.on('uncaughtException', (err) => {
    logger.log('crit', `💀 FATAL EXCEPTION: ${err.message}`, { stack: err.stack });
    setTimeout(() => process.exit(1), 1000); // Exit after flush
  });

  process.on('unhandledRejection', (reason: any) => {
    logger.log('crit', `🛑 UNHANDLED REJECTION`, { reason: reason?.stack || reason });
  });
};

// 2. Middleware Level (ERROR/WARN)
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const status = err instanceof ApiError ? err.statusCode : 500;
  const messageKey = err.message || 'INTERNAL_SERVER_ERROR';

  if (status >= 500) {
    logger.error(`❌ Server Error: ${messageKey}`, { stack: err.stack, path: req.originalUrl });
  } else {
    logger.warn(`⚠️ Client Warning: ${messageKey}`, { status, path: req.originalUrl });
  }

  return sendResponse({ res, status, messageKey, req });
};