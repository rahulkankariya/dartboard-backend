import { CHAT_TYPES, MESSAGE_TYPES } from "../../../constant";
import { ChatModel, ChatMessageModel, UserModel } from "../../../models";
import { ISocketPayload } from "../../types/socket";

export const validateSocketToken = async (
  payload: ISocketPayload,
): Promise<boolean> => {
  try {
    const user = await UserModel.findOne({
      uniqueId: payload.uniqueId,
      _id: payload.id,
    }).lean();

    // Returns true if user exists, false otherwise
    return !!user;
  } catch (error) {
    console.error("Database validation error:", error);
    return false;
  }
};
export const updateOnlineStatus = async (userId: string, status: number) => {
  return await UserModel.findByIdAndUpdate(userId, {
    isOnline: status === 1,
    lastSeen: new Date(),
  });
};


export const fetchActiveUsers = async (page: number, limit: number, currentUserId: string) => {
  const skip = (page - 1) * limit;

  const users = await UserModel.find({ _id: { $ne: currentUserId } })
    .select("firstName lastName isOnline avatar")
    .skip(skip)
    .limit(limit)
    .lean();

  // Map through the results to create the fullName property
  const userList = users.map((user: any) => ({
    ...user,
    fullName: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
  }));

  const total = await UserModel.countDocuments({ _id: { $ne: currentUserId } });

  return {
    userList,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
    },
  };
};


export const getOrCreateChatDB = async (senderId: string, receiverId: string) => {
  let chat = await ChatModel.findOne({
    chatType: CHAT_TYPES.INDIVIDUAL,
    participants: { $all: [senderId, receiverId] },
  });

  if (!chat) {
    chat = await ChatModel.create({
      participants: [senderId, receiverId],
      chatType: CHAT_TYPES.INDIVIDUAL,
    });
  }
  return chat;
};


export const saveMessageDB = async (receiverId: string, senderId: string, content: string, type: any) => {
  const chat = await getOrCreateChatDB(senderId, receiverId);

  const newMessage = await ChatMessageModel.create({
    chatId: chat._id,
    sender: senderId,
    content,
    messageType: type || MESSAGE_TYPES.TEXT,
    readStatus: [
      { user: senderId, readAt: new Date() },
      { user: receiverId, readAt: null },
    ],
  });

  await ChatModel.findByIdAndUpdate(chat._id, { latestMessage: newMessage._id });

  const populated = await ChatMessageModel.findById(newMessage._id)
    .populate("sender", "firstName lastName isOnline")
    .lean();

  if (populated?.sender) {
    (populated.sender as any).fullName = `${(populated.sender as any).firstName || ""} ${(populated.sender as any).lastName || ""}`.trim();
  }

  return { message: populated, participants: chat.participants, chatId: chat._id };
};


export const fetchChatMessages = async (chatId: string, page: number, limit: number) => {
  const skip = (page - 1) * limit;
  const messageList = await ChatMessageModel.find({ chatId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("sender", "firstName lastName")
    .lean();

  const total = await ChatMessageModel.countDocuments({ chatId });

  return {
    messageList,
    pagination: { total, page, pages: Math.ceil(total / limit) },
  };
};