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
export const updateOnlineStatus = async (userId: string, status: number, lastSeen?: Date) => {
  console.log(`Updating online status for user ${userId} to ${status === 1 ? "online" : "offline"}`,lastSeen);
  return await UserModel.findByIdAndUpdate(
    userId, 
    {
      isOnline: status === 1,
      // Use the passed date, or fallback to now
      lastSeen: lastSeen || new Date(), 
    },
    { new: true } // Returns the updated document instead of the old one
  );
};


export const fetchActiveUsers = async (page: number, limit: number, currentUserId: string) => {
  const skip = (page - 1) * limit;

  // 1. Fetch the users - Added 'lastSeen' to the select string
  const users = await UserModel.find({ _id: { $ne: currentUserId } })
    .select("firstName lastName isOnline avatar lastSeen") 
    .skip(skip)
    .limit(limit)
    .lean();

  // 2. Fetch the latest message for each user interaction
  const userListWithMessages = await Promise.all(
    users.map(async (user: any) => {
      // Find the individual chat between currentUserId and this specific user
      const chat = await ChatModel.findOne({
        chatType: CHAT_TYPES.INDIVIDUAL,
        participants: { $all: [currentUserId, user._id] },
      })
      .populate("latestMessage") 
      .lean();

      return {
        ...user,
        // Construct fullName
        fullName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Unknown Protocol",
        // Ensure lastSeen is passed (it will be in ...user, but explicit is better for clarity)
        lastSeen: user.lastSeen || null,
        lastMessage: chat?.latestMessage || null,
      };
    })
  );

  const total = await UserModel.countDocuments({ _id: { $ne: currentUserId } });

  return {
    userList: userListWithMessages,
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
export const updateMessageStatus = async (messageId: string, status: string) => {
  return await ChatMessageModel.findByIdAndUpdate(
    messageId,
    { $set: { status: status, isRead: status === "read" } },
    { new: true }
  );
};