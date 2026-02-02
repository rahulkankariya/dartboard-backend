import { Server, Socket } from "socket.io";
import socketController from "../api/controller/socket-controller";


const handleSocketConnection = (io: Server, socket: Socket): void => {
    // Accessing the user data we attached in the middleware
    const userId = socket.user?.id || "Anonymous";
    
    console.log(`[${new Date().toISOString()}] User Connected: ${userId} (Socket ID: ${socket.id})`);

    
    socketController(io, socket);

    socket.on("disconnect", (reason: string) => {
        console.log(`[${new Date().toISOString()}] User Disconnected: ${userId} (Reason: ${reason})`);
    });
};

export { handleSocketConnection };