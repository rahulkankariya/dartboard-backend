
import { MessageType } from "../../../constant";
import {
  fetchActiveUsers,
  fetchChatMessages,
  findChatByIdDB,
  saveNewMessage,
  updateOnlineStatus,
} from "../repository/socketRepository";

export const updateUserStatus = async (id: string, status: number) => {
  return await updateOnlineStatus(id, status);
};

export const getActiveUsers = async (
  pageIndex: number,
  pageSize: number,
  id: string,
) => {
  // Logic: Ensure minimum values
  const pIndex = pageIndex > 0 ? pageIndex : 1;
  const pSize = pageSize > 0 ? pageSize : 10;

  const result = await fetchActiveUsers(pIndex, pSize, id);

  // centralized logic: if no users, return empty structure instead of null
  return {
    executed: result.userList && result.userList.length > 0 ? 1 : 0,
    data: result.userList || [], // Ensure data is always an array
    pagination: result.pagination,
  };
};
export const getMessagesByChat = async (chatId: string, pageIndex: number, pageSize: number) => {
    const pIndex = pageIndex > 0 ? pageIndex : 1;
    const pSize = pageSize > 0 ? pageSize : 20;

    const result = await fetchChatMessages(chatId, pIndex, pSize);

    return {
        executed: result.messageList.length > 0 ? 1 : 0,
        // Reverse so the last message in the array is the most recent for the UI
        data: result.messageList.reverse(), 
        pagination: result.pagination
    };
};
export const processIncomingMessage = async (chatId: string, senderId: string, content: string, type: MessageType) => {
    // 1. Call Repository to save
    const savedMsg = await saveNewMessage(chatId, senderId, content, type);

    // 2. Call Repository to get chat details
    const chat = await findChatByIdDB(chatId);
    if (!chat) throw new Error("Chat not found");

    // 3. Logic: Identify receivers
    const receivers = chat.participants.filter(id => id.toString() !== senderId.toString());

    return {
        message: savedMsg,
        receivers 
    };
};

