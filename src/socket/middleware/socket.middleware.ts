import { Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { JwtUserPayload } from "../types/socket";
import { validateSocketToken } from "../api/repository/socketRepository";

// Use a named export for easier importing
export const socketToken = (socket: Socket, next: (err?: Error) => void): void => {
    const token = socket.handshake.headers.authorization;

    if (!token) {
        return next(new Error("No token provided."));
    }

    jwt.verify(token, config.JWTKEY, async (err, decoded) => {
        if (err || !decoded) {
            return next(new Error("Invalid token"));
        }

        const userPayload = decoded as JwtUserPayload;

        try {
            const isValid = await validateSocketToken(userPayload);

            if (isValid) {
                socket.user = userPayload; 
                return next(); 
            } else {
                return next(new Error("Session Expired"));
            }
        } catch (error) {
            return next(new Error("Authentication Failed"));
        }
    });
};