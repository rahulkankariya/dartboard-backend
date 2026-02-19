import { Server, Socket } from "socket.io";
import * as chatService from "../services";
import { SOCKET_EVENTS } from "../../constant";


const socketController = (io: Server, socket: Socket): void => {
  const user = (socket as any).user;
  if (!user) return;

  // --- 1. INITIALIZATION ---
  (async () => {
    try {
      await chatService.updateUserStatus(user.id, 1);
      socket.join(user.id); // Personal room for the user

      socket.broadcast.emit(SOCKET_EVENTS.USER_STATUS_CHANGED, {
        userId: user.id,
        isOnline: true,
      });
    } catch (err) {
      console.error("Init Error:", err);
    }
  })();

  // --- 2. CHAT / USER LIST ---
  socket.on(SOCKET_EVENTS.REQUEST_USER_LIST, async (data: { pageIndex: number; pageSize: number }) => {
    try {
      const result = await chatService.getActiveUsers(data.pageIndex, data.pageSize || 50, user.id);

      socket.emit(SOCKET_EVENTS.RESPONSE_USER_LIST, { 
        status: 200, 
        message: "Success",
        data: result.data 
      });
    } catch (error) {
      console.error("Chat List Error:", error);
      socket.emit(SOCKET_EVENTS.RESPONSE_MESSAGE_LIST, { status: 500, data: [] });
    }
  });

  // --- 3. MESSAGE HISTORY ---
  socket.on(SOCKET_EVENTS.REQUEST_MESSAGE_HISTORY, async (data: { receiverId: string, pageIndex: number }) => {
    try {
      const result = await chatService.getMessagesByParticipants(user.id, data.receiverId, data.pageIndex);
      
      if (result.chatId) socket.join(result.chatId);

      socket.emit(SOCKET_EVENTS.RESPONSE_MESSAGE_LIST, {
        status: 200,
        message: "Success",
        receiverId: data.receiverId,
        chatId: result.chatId,
        messageList: result.data,
        pagination: result.pagination,
        request: data
      });
    } catch (err) {
      console.error("History Error:", err);
      socket.emit(SOCKET_EVENTS.RESPONSE_MESSAGE_LIST, { status: 500, messageList: [] });
    }
  });

  // --- 4. REAL-TIME SENDING ---
  socket.on(SOCKET_EVENTS.SEND_MESSAGE, async (data: { receiverId: string, content: string, type: any }) => {
    try {
         const { message, receivers, chatId } = await chatService.processIncomingMessage(
        data.receiverId, 
        user.id, 
        data.content, 
        data.type
      );

      // A. Confirm to Sender
      socket.emit(SOCKET_EVENTS.MESSAGE_SENT_SUCCESS, message);

      // B. Notify Receivers
      receivers.forEach((id) => {
        io.to(id).emit(SOCKET_EVENTS.RECEIVE_MESSAGE, message);
        
        // Optional notification
        io.to(id).emit("new-notification", {
          chatId: chatId,
          senderName: `${user.firstName} ${user.lastName}`,
          content: data.content,
          message
        });
      });
    } catch (error) {
      console.error("Send Error:", error);
      socket.emit(SOCKET_EVENTS.SEND_MESSAGE_ERROR, { error: "Failed to deliver message" });
    }
  });

  // --- 5. MARK AS READ ---
 socket.on(SOCKET_EVENTS.MARK_MESSAGE_READ, async (data: { senderId: string }) => {
  try {
    const readerId = user.id; // The person currently looking at the chat
    const senderId = data.senderId; // The person who sent the messages

    const result = await chatService.updateMessageStatus(readerId, senderId);

    if (result && result.chatId) {
      // 1. Notify the SENDER (The person who needs to see blue ticks)
      io.to(senderId).emit(SOCKET_EVENTS.MESSAGE_READ_SUCCESS, {
        chatId: result.chatId,
        readerId: readerId,
        status: "seen"
      });

      // 2. Notify the READER (To clear unread badges in their UI)
      // This is often needed if the user has multiple tabs open
      socket.emit(SOCKET_EVENTS.MESSAGE_READ_SUCCESS, {
        chatId: result.chatId,
        senderId: senderId,
        status: "seen"
      });
    }
  } catch (error) {
    console.error("Read Error:", error);
  }
});

  // --- 6. TYPING INDICATORS ---
  socket.on(SOCKET_EVENTS.TYPING_START, (data: { receiverId: string }) => {
    io.to(data.receiverId).emit(SOCKET_EVENTS.USER_TYPING, {
      userId: user.id,
      isTyping: true,
    });
  });

  socket.on(SOCKET_EVENTS.TYPING_STOP, (data: { receiverId: string }) => {
    io.to(data.receiverId).emit(SOCKET_EVENTS.USER_TYPING, {
      userId: user.id,
      isTyping: false,
    });
  });

  // --- 7. DISCONNECT ---
  socket.on(SOCKET_EVENTS.DISCONNECT, async () => {
    try {
      // Check if user has other active tabs before marking offline
      const activeSockets = await io.in(user.id).fetchSockets();
      
      if (activeSockets.length === 0) {
        const lastSeen = new Date();
        await chatService.updateUserStatus(user.id, 0, lastSeen);
        
        socket.broadcast.emit(SOCKET_EVENTS.USER_STATUS_CHANGED, {
          userId: user.id,
          isOnline: false,
          lastSeen: lastSeen.toISOString(), 
        });
      }
    } catch (err) {
      console.error("Disconnect Error:", err);
    }
  });
};

export default socketController;