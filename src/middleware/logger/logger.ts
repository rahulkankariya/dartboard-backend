import winston from 'winston';
import LokiTransport from 'winston-loki';

const levels = { crit: 0, error: 1, warn: 2, info: 3, debug: 4 };

export const logger = winston.createLogger({
  levels,
  level: 'info', // Captures info, warn, error, and crit
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new LokiTransport({
      host: process.env.LOKI_URL || 'http://localhost:3100',
      labels: { service: 'api-gateway', env: process.env.NODE_ENV || 'development' },
      json: true,
      batching: true,
      interval: 5
    }),
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize({ all: true }), winston.format.simple())
    })
  ],
});