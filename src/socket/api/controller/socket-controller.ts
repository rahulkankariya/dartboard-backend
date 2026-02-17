import { Server, Socket } from "socket.io";
import * as chatService from "../services";

const socketController = (io: Server, socket: Socket): void => {
  const user = (socket as any).user;
  if (!user) return;

  // --- 1. INITIALIZATION ---
  // Use a try-catch even in initialization to prevent silent crashes
  (async () => {
    try {
      await chatService.updateUserStatus(user.id, 1);
      socket.join(user.id);

      // FIX: Changed "user_status_changed" to "user-status-changed" 
      // to match your SocketContext.tsx frontend listener
      socket.broadcast.emit("user-status-changed", {
        userId: user.id,
        isOnline: true,
      });
    } catch (err) {
      console.error("Init Error:", err);
    }
  })();

  // --- 2. CHAT / USER LIST ---
  socket.on("request-chat-list", async (data: { pageIndex: number; pageSize: number }) => {
    try {
      const result = await chatService.getActiveUsers(data.pageIndex, data.pageSize || 50, user.id);
      socket.emit("response-chat-list", { 
        status: 200, 
        message: "Success",
        data: result.data // Ensure 'data' field matches frontend response.data
      });
    } catch (error) {
      console.error("Chat List Error:", error);
      socket.emit("response-chat-list", { status: 500, data: [] });
    }
  });

  // --- 3. MESSAGE HISTORY ---
  socket.on("request-chat-history", async (data: { receiverId: string, pageIndex: number }) => {
    try {
      const result = await chatService.getMessagesByParticipants(user.id, data.receiverId, data.pageIndex);
      
      // Join a room specific to this chat to handle future typing events/group messages
      if (result.chatId) socket.join(result.chatId);

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

      // A. Confirm to Sender (Frontend uses this to update Sidebar and Chat window)
      socket.emit("message-sent-success", message);

      // B. Notify Receivers
      receivers.forEach((id) => {
        // Emit to the receiver's personal room
        io.to(id).emit("receive-message", message);
        
        // Optional: Separate notification event
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

  // --- 5. MARK AS READ ---
  socket.on("mark-message-read", async (data: { messageId: string, senderId: string }) => {
    try {
      await chatService.updateMessageStatus(data.messageId, "read");

      // Notify the original SENDER that their message was read for "Blue Check" UI
      io.to(data.senderId).emit("message-status-updated", {
        messageId: data.messageId,
        status: "read"
      });
    } catch (error) {
      console.error("Read Status Error:", error);
    }
  });

  // --- 6. DISCONNECT ---
socket.on("disconnect", async () => {
  try {
    const lastSeen = new Date(); // 1. Capture the time
    await chatService.updateUserStatus(user.id, 0, lastSeen); // 2. Pass it down
    
    console.log(`User ${user.id} disconnected`);

    // 3. CRITICAL: Include lastSeen in the broadcast payload
    socket.broadcast.emit("user-status-changed", {
      userId: user.id,
      isOnline: false,
      lastSeen: lastSeen.toISOString(), 
    });
  } catch (err) {
    console.error("Disconnect Error:", err);
  }
});
};

export default socketController;