import * as repo from "../repository";

export const updateUserStatus = async (id: string, status: number, lastSeen?: Date) => {
  return await repo.updateOnlineStatus(id, status, lastSeen);
};

export const getActiveUsers = async (pageIndex: number, pageSize: number, id: string) => {
  const result = await repo.fetchActiveUsers(pageIndex || 1, pageSize || 10, id);
  return {
    data: result.userList || [],
    pagination: result.pagination,
  };
};

export const getMessagesByParticipants = async (senderId: string, receiverId: string, page: number) => {
  const chat = await repo.getOrCreateChatDB(senderId, receiverId);
  const result = await repo.fetchChatMessages(chat._id.toString(), page || 1, 10);

  return {
    chatId: chat._id.toString(),
    data: result.messageList.reverse(), // Chronic order for UI
    pagination: result.pagination,
  };
};

export const processIncomingMessage = async (receiverId: string, senderId: string, content: string, type: any) => {
  const result = await repo.saveMessageDB(receiverId, senderId, content, type);
  const receivers = result.participants
    .map((p: any) => p.toString())
    .filter((id: string) => id !== senderId);
  return {
    message: result.message,
    receivers,
    chatId: result.chatId.toString(),
  };
};
// Add this to your existing chatService file
export const updateMessageStatus = async (readerId: string, senderId: string) => {
  try {
    const result = await repo.updateMessageStatus(readerId, senderId);
    return result;
  } catch (error) {
    console.error("Service Error - updateMessageStatus:", error);
    throw error;
  }
};