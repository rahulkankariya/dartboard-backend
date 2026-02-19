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
    return !!user;
  } catch (error) {
    console.error("Database validation error:", error);
    return false;
  }
};

export const updateOnlineStatus = async (
  userId: string,
  status: number,
  lastSeen?: Date,
) => {
  const isOnline = status === 1;
  const updatedUser = await UserModel.findByIdAndUpdate(
    userId,
    {
      isOnline: isOnline,
      lastSeen: lastSeen || new Date(),
    },
    { new: true },
  );

  // LOGIC: If user comes online, mark all their received messages as 'delivered'
  if (isOnline) {
    await ChatMessageModel.updateMany(
      {
        "readStatus.user": userId,
        "readStatus.deliveredAt": null,
        sender: { $ne: userId }
      },
      { 
        $set: { 
          "readStatus.$.deliveredAt": new Date(),
          status: "delivered" 
        } 
      }
    );
  }

  return updatedUser;
};

export const fetchActiveUsers = async (
  page: number,
  limit: number,
  currentUserId: string,
) => {
  const skip = (page - 1) * limit;

  const users = await UserModel.find({ _id: { $ne: currentUserId } })
    .select("firstName lastName isOnline avatar lastSeen")
    .skip(skip)
    .limit(limit)
    .lean();

  const userListWithMessages = await Promise.all(
    users.map(async (user: any) => {
      const chat = await ChatModel.findOne({
        chatType: CHAT_TYPES.INDIVIDUAL,
        participants: { $all: [currentUserId, user._id] },
      })
        .populate("latestMessage")
        .lean();
      
      return {
        ...user,
        fullName:
          `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
          "Unknown Protocol",
        lastSeen: user.lastSeen || null,
        lastMessage: chat?.latestMessage || null,
      };
    }),
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

export const getOrCreateChatDB = async (
  senderId: string,
  receiverId: string,
) => {
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

export const saveMessageDB = async (
  receiverId: string,
  senderId: string,
  content: string,
  type: any,
) => {
  const chat = await getOrCreateChatDB(senderId, receiverId);
  
  // Check if receiver is online to set initial status
  const receiver = await UserModel.findById(receiverId).select("isOnline").lean();
  const isDelivered = receiver?.isOnline || false;

  const newMessage = await ChatMessageModel.create({
    chatId: chat._id,
    sender: senderId,
    content,
    messageType: type || MESSAGE_TYPES.TEXT,
    status: isDelivered ? "delivered" : "sent",
    readStatus: [
      { 
        user: senderId, 
        readAt: new Date(), 
        deliveredAt: new Date() 
      },
      { 
        user: receiverId, 
        readAt: null, 
        deliveredAt: isDelivered ? new Date() : null 
      },
    ],
  });

  await ChatModel.findByIdAndUpdate(chat._id, {
    latestMessage: newMessage._id,
  });

  const populated = await ChatMessageModel.findById(newMessage._id)
    .populate("sender", "firstName lastName isOnline")
    .lean();

  if (populated?.sender) {
    (populated.sender as any).fullName =
      `${(populated.sender as any).firstName || ""} ${(populated.sender as any).lastName || ""}`.trim();
  }

  return {
    message: {
      ...populated,
      receiverId: receiverId,
    },
    participants: chat.participants,
    chatId: chat._id,
  };
};

export const fetchChatMessages = async (
  chatId: string,
  page: number,
  limit: number = 10,
) => {
  const currentPage = Math.max(1, page); 
  const skip = (currentPage - 1) * limit;

  const messageList = await ChatMessageModel.find({ chatId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("sender", "firstName lastName")
    .lean();

  const total = await ChatMessageModel.countDocuments({ chatId });

  return {
    messageList,
    pagination: {
      total,
      page: currentPage + 1,
      pages: Math.ceil(total / limit),
    },
  };
};

export const updateMessageStatus = async (readerId: string, senderId: string) => {
  try {
    const chat = await ChatModel.findOne({
      participants: { $all: [readerId, senderId] },
    });

    if (!chat) return null;

    const result = await ChatMessageModel.updateMany(
      {
        chatId: chat._id,
        sender: senderId,
        "readStatus.user": readerId,
        "readStatus.readAt": null,
      },
      {
        $set: { 
            "readStatus.$.readAt": new Date(),
            "readStatus.$.deliveredAt": new Date(), 
            status: "seen" 
        },
      },
    );

    // Return the chatId so we can use it in Socket emissions
    return { 
      chatId: chat._id, 
      modifiedCount: result.modifiedCount 
    };
  } catch (error) {
    console.error("Repository Error - updateMessageStatus:", error);
    throw error;
  }
};