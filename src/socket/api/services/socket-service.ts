import {
  fetchActiveUsers,
  fetchChatMessages,
  saveMessageDB,
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
export const getMessagesByChat = async (
  chatId: string,
  pageIndex: number,
  pageSize: number,
) => {
  const pIndex = pageIndex > 0 ? pageIndex : 1;
  const pSize = pageSize > 0 ? pageSize : 20;

  const result = await fetchChatMessages(chatId, pIndex, pSize);

  return {
    executed: result.messageList.length > 0 ? 1 : 0,
    // Reverse so the last message in the array is the most recent for the UI
    data: result.messageList.reverse(),
    pagination: result.pagination,
  };
};
export const processIncomingMessage = async (
  receiverId: string,
  senderId: string,
  content: string,
  type: any,
) => {
  const result = await saveMessageDB(receiverId, senderId, content, type);

  // Identify receivers (everyone except Rahul/Sender)
  const receivers = result.participants
    .map((p: any) => p.toString())
    .filter((id: string) => id !== senderId);

  return {
    message: result.message,
    receivers,
    chatId: result.chatId.toString(),
  };
};
