import { Socket } from "socket.io";

import { validateSocketToken } from "../api/repository/socketRepository";
import { verifyJwt } from "../../utils";

export const socketToken = async (socket: Socket, next: (err?: Error) => void) => {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error("No token provided."));
  }

  try {
    // 1. Verify the signature via utility
    const userPayload = await verifyJwt(token);

    // 2. Validate against database/repository
    const isValid = await validateSocketToken(userPayload);

    if (!isValid) {
      return next(new Error("Session Expired"));
    }

    // 3. Success - Attach user to socket
    socket.user = userPayload;
    next();
  } catch (error: any) {
    console.error("Socket Auth Error:", error.message);
    // Standardize error message for the frontend
    next(new Error(error.message || "Authentication Failed"));
  }
};