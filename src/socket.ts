import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { socketToken } from "./socket/middleware";
import { handleSocketConnection } from "./socket/utils";



/**
 * Initializes the Socket.io server with authentication and connection handlers.
 */
const initializeSocket = (server: HttpServer): Server => {
  const io = new Server(server, {
    cors: { 
        origin: "*",
        methods: ["GET", "POST"]
    }
  });

  // Apply auth middleware - this runs BEFORE the "connection" event
  io.use(socketToken);

  io.on("connection", (socket: Socket) => {
    // Because of the middleware, socket.user is populated here
    const user = socket.user;

    if (!user) {
      console.warn(`[${new Date().toISOString()}] Unauthorized attempt: ${socket.id}`);
      // disconnect(true) closes the underlying transport
      socket.disconnect(true);
      return;
    }

    console.log(`[${new Date().toISOString()}] User Authorized: ${user.id}`);

    // Pass the connection to your handler logic
    handleSocketConnection(io, socket);
  });

  return io;
};

export { initializeSocket };