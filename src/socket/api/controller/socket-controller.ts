import { Server, Socket } from "socket.io";
import * as chatService from "../services";

const socketController = (io: Server, socket: Socket): void => {
  const user = (socket as any).user;
  if (!user) return;

  // --- 1. INITIALIZATION ---
  chatService.updateUserStatus(user.id, 1);
  socket.join(user.id); // Join personal room for private notifications
  
  // Notify others that this user is online
  socket.broadcast.emit("user_status_changed", {
    userId: user.id,
    isOnline: true,
  });

  // --- 2. CHAT / USER LIST ---
  socket.on("request-chat-list", async (data: { pageIndex: number; pageSize: number }) => {
    try {
      const result = await chatService.getActiveUsers(data.pageIndex, data.pageSize, user.id);
      socket.emit("response-chat-list", { 
        status: 200, 
        message: "Success",
        ...result 
      });
    } catch (error) {
      socket.emit("response-chat-list", { status: 500, data: [] });
    }
  });

  // --- 3. MESSAGE HISTORY (Receiver Based) ---
  socket.on("request-chat-history", async (data: { receiverId: string, pageIndex: number }) => {
    try {
      // Logic: Resolve room by participants (Rahul & Vishnu)
      const result = await chatService.getMessagesByParticipants(user.id, data.receiverId, data.pageIndex);
      // console.log("Chat History Result:", result);
      // Join the actual DB Room ID for room-specific broadcasts
      socket.join(result.chatId);

      socket.emit("response-message-list", {
        status: 200,
        message: "Success",
        receiverId: data.receiverId,
        chatId: result.chatId,
        messageList: result.data,
        pagination: result.pagination,
      });
    } catch (err) {
      console.error("History Error:", err);
      socket.emit("response-message-list", { status: 500, messageList: [] });
    }
  });

  // --- 4. REAL-TIME SENDING ---
  socket.on("send-message", async (data: { receiverId: string, content: string, type: any }) => {
    try {
      const { message, receivers, chatId } = await chatService.processIncomingMessage(
        data.receiverId, 
        user.id, 
        data.content, 
        data.type
      );

      // A. Confirm to Sender (Rahul)
      socket.emit("message-sent-success", message);

      // B. Notify Receivers (Vishnu)
      receivers.forEach((id) => {
        // Send to personal room
        io.to(id).emit("receive-message", message);
        
        // Send notification
        io.to(id).emit("new-notification", {
          chatId: chatId,
          senderName: `${user.firstName} ${user.lastName}`,
          content: data.content,
          message
        });
      });
    } catch (error) {
      console.error("Send Error:", error);
      socket.emit("send-message-error", { error: "Failed to deliver message" });
    }
  });

  // --- 5. DISCONNECT ---
  socket.on("disconnect", async () => {
    await chatService.updateUserStatus(user.id, 0);
    socket.broadcast.emit("user_status_changed", {
      userId: user.id,
      isOnline: false,
    });
  });
};

export default socketController;