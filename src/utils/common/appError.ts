import { Response } from 'express';
import { sendResponse } from './responseHandler';
import { HTTP_STATUS } from './statusCode';

export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }


  static badRequest(message = 'bad_request') {
    return new ApiError(message, HTTP_STATUS.BAD_REQUEST);
  }

  static unauthorized(message = 'unauthorized') {
    return new ApiError(message, HTTP_STATUS.UNAUTHORIZED);
  }

  static conflict(message = 'conflict') {
    return new ApiError(message, HTTP_STATUS.CONFLICT);
  }

  static internal(message = 'internal_server_error') {
    return new ApiError(message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }

  
  send(res: Response, req?: any) {
    return sendResponse({
      res,
      messageKey: this.message,
      status: this.statusCode,
      req,

    });
  }
}
