import 'dotenv/config';
import { connectDB } from "./src/config/db";
import { createServer } from "http"; // 1. Import http

const PORT = process.env.PORT || 5000;

async function startServer() {
  await connectDB();

  try {
    const { app } = await import("./src/app");
    const { initializeSocket } = await import("./src/socket");

    // 2. Create the HTTP Server using your Express app
    const httpServer = createServer(app);

    // 3. Initialize Socket.io with the HTTP Server
    initializeSocket(httpServer);

    // 4. Start the HTTP Server (NOT app.listen)
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server & Sockets running on http://localhost:${PORT}`);
    });

  } catch (importErr) {
    console.error("Critical error loading the app:", importErr);
    process.exit(1);
  }
}

startServer();