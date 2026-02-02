import { Server, Socket } from "socket.io";
import { UserListRequest } from "../../types/socket";
import { 
  getActiveUsers, 
  getMessagesByChat, 
  updateUserStatus, 
  processIncomingMessage, // New service call
  getMyChats              // New service call
} from "../services";

const socketController = (io: Server, socket: Socket): void => {
  const user = (socket as any).user; // Ensure user is typed correctly from your auth middleware
  if (!user) return;

  // --- 1. INITIALIZATION ---
  // Set Online and join a personal room for private notifications
  updateUserStatus(user.id, 1);
  socket.join(user.id); 
  socket.broadcast.emit("user_status_changed", { userId: user.id, isOnline: true });

  // --- 2. USER DIRECTORY ---
  socket.on("request-user-list", async (data: UserListRequest) => {
    try {
      const result = await getActiveUsers(data.pageIndex, data.pageSize, user.id);
      socket.emit("response-user-list", {
        status: 200,
        message: "Success",
        data: result.data,
      });
    } catch (error) {
      socket.emit("response-user-list", { status: 500, message: "Error", data: [] });
    }
  });

  // --- 3. INBOX / CHAT LIST ---
  socket.on("request-chat-list", async (data: { pageIndex: number; pageSize: number }) => {
    try {
      const result = await getMyChats(data.pageIndex, data.pageSize, user.id);
      socket.emit("response-chat-list", {
        status: 200,
        message: "Success",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      socket.emit("response-chat-list", { status: 500, message: "Error", data: [] });
    }
  });

  // --- 4. MESSAGE HISTORY (PAGINATED) ---
  socket.on("request-message-list", async (data: { chatId: string; pageIndex: number; pageSize: number }) => {
    try {
      // User joins the specific chat room for typing/read-receipt events
      socket.join(data.chatId); 

      const result = await getMessagesByChat(data.chatId, data.pageIndex, data.pageSize);
      socket.emit("response-message-list", {
        status: 200,
        message: "Success",
        chatId: data.chatId,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      socket.emit("response-message-list", { status: 500, message: "Error", data: [] });
    }
  });

  // --- 5. REAL-TIME SENDING ---
  socket.on("send-message", async (data: { chatId: string, content: string, type: number }) => {
    try {
      const result = await processIncomingMessage(data.chatId, user.id, data.content, data.type);

      // A. Emit back to sender
      socket.emit("message-sent-success", result.message);

      // B. Emit to the specific Chat Room (for users currently inside the chat)
      socket.to(data.chatId).emit("receive-message", result.message);

      // C. Notify specific receivers (for users NOT inside the chat room)
      result.receivers.forEach((receiverId) => {
        io.to(receiverId.toString()).emit("new-notification", {
          chatId: data.chatId,
          content: data.content,
          senderName: `${user.firstName} ${user.lastName}`
        });
      });
    } catch (error) {
      socket.emit("send-message-error", { message: "Failed to deliver message" });
    }
  });

  // --- 6. DISCONNECT ---
  socket.on("disconnect", async () => {
    await updateUserStatus(user.id, 0);
    socket.broadcast.emit("user_status_changed", { userId: user.id, isOnline: false });
    console.log(`User ${user.id} is now offline.`);
  });
};

export default socketController;