
import { Request, Response, NextFunction } from 'express';

export const languageMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const lng = req.headers['accept-language'] || 'en';
  (req as any).language = lng; 
  next();
};
