import { Server, Socket } from "socket.io";
import { UserListRequest } from "../../types/socket";
import { 
  getMessagesByChat, 
  updateUserStatus, 
  processIncomingMessage, // New service call
  getActiveUsers              // New service call
} from "../services";
import { MessageType } from "../../../constant";

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
      const result = await getActiveUsers(data.pageIndex, data.pageSize, user.id);
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
socket.on("request-chat-history", async (data) => {
  try {
    const { chatId, pageIndex, pageSize = 50 } = data;

    // 1. Join a room specific to this chat
    // This allows you to emit to room(chatId) later for "typing" or "read" events
    socket.join(chatId); 

    // 2. Fetch messages from your database logic
    const result = await getMessagesByChat(chatId, pageIndex, pageSize);

    // 3. Emit BACK to the user with a specific response event
    socket.emit("response-message-list", {
      status: 200,
      message: "Success",
      chatId: chatId, // Vital for the frontend to verify
      data: result.data,
      pagination: result.pagination,
    });

  } catch (error) {
    console.error("Chat History Error:", error);
    socket.emit("response-message-list", { 
      status: 500, 
      message: "Internal Server Error", 
      data: { messageList: [] } 
    });
  }
});

  // --- 5. REAL-TIME SENDING ---
  socket.on("send-message", async (data: { chatId: string, content: string, type: MessageType }) => {
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