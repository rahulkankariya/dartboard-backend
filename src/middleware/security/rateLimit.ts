import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import { HTTP_STATUS, sendResponse } from '../../utils';


export const rateLimitMiddleware: RateLimitRequestHandler = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minutes
  max: 500, // Limit each IP to 500 requests per window
  standardHeaders: true, // `RateLimit-*` headers
  legacyHeaders: false,  // Disable `X-RateLimit-*` headers
  handler: (req, res) => {
    return sendResponse({
      res,
      status: HTTP_STATUS.TOO_MANY_REQUESTS,
      messageKey: 'TOO_MANY_REQUESTS',
      req,
    });
  },
});
