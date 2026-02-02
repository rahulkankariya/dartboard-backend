import { Request, Response, NextFunction } from "express";
import { HTTP_STATUS, sendResponse } from "../../utils";


// The plain text key you want to check against
const MASTER_API_KEY = "1234567890abcdef"; // Replace with your actual API key

export const xApiKeyMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const apiKeyHeader = req.headers["x-api-key"];

  if (!apiKeyHeader) {
    return sendResponse({ res, status: HTTP_STATUS.UNAUTHORIZED, messageKey: "API_KEY_REQUIRED", req });
  }

  // Get string regardless of if it's an array or single string
  const providedKey = Array.isArray(apiKeyHeader) ? apiKeyHeader[0] : apiKeyHeader;

  // Direct string comparison
  if (providedKey !== MASTER_API_KEY) {
    return sendResponse({ res, status: 401, messageKey: "INVALID_API_KEY", req });
  }

  next();
};