
import { Request, Response, NextFunction } from 'express';
import { HTTP_STATUS, sendResponse } from '../../utils';


export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  return sendResponse({
    res,
    status: HTTP_STATUS.NOT_FOUND,
    messageKey: 'ROUTE_NOT_FOUND',
    req
  });
};
