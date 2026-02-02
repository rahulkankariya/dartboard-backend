import { Request, Response, NextFunction } from 'express';
import { storage } from './context';
import { logger } from '../logger';

const formatTime = (ms: number) => {
  if (ms < 1) return `${(ms * 1000).toFixed(0)}µs`;
  if (ms < 1000) return `${ms.toFixed(2)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  if (req.path === '/api/health') return next();

  const apiStart = performance.now();
  const context = { dbTimings: {} as Record<string, number> };
  (req as any).dbTimings = context.dbTimings;

  res.on('finish', () => {
    const totalApiMs = performance.now() - apiStart;
    const statusCode = res.statusCode;
    
    // --- DIVIDE LOG LEVELS ---
    let level: keyof typeof logger.levels = 'info';
    if (statusCode >= 500) level = 'error';
    else if (statusCode >= 400) level = 'warn';

    const readableDbTimings: Record<string, string> = {};
    for (const [key, value] of Object.entries(context.dbTimings)) {
      readableDbTimings[key] = formatTime(value);
    }

    logger.log(level, `API ${req.method} ${req.originalUrl}`, {
      userId: (req as any).user?.id || 'anonymous',
      payload: {
        method: req.method,
        path: req.originalUrl,
        totalTime: formatTime(totalApiMs),
        dbTimings: readableDbTimings,
        statusCode
      }
    });
  });

  storage.run(context, () => next());
};