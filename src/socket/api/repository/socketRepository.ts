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
export const updateOnlineStatus = async (
  userId: string,
  status: number,
  lastSeen?: Date,
) => {

  return await UserModel.findByIdAndUpdate(
    userId,
    {
      isOnline: status === 1,
      // Use the passed date, or fallback to now
      lastSeen: lastSeen || new Date(),
    },
    { new: true }, // Returns the updated document instead of the old one
  );
};

export const fetchActiveUsers = async (
  page: number,
  limit: number,
  currentUserId: string,
) => {
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
      console.log(`Chat for user ${user._id}:`, chat); // Debug log
      return {
        ...user,
        // Construct fullName
        fullName:
          `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
          "Unknown Protocol",
        // Ensure lastSeen is passed (it will be in ...user, but explicit is better for clarity)
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
    receiverId: receiverId, // Add this so the sender's UI knows who they messaged
  },
    participants: chat.participants,
    chatId: chat._id,
  };
};

export const fetchChatMessages = async (
  chatId: string,
  page: number, // Treat as 0-indexed or 1-indexed consistently
  limit: number = 10,
) => {
  console.log(`Fetching messages Repositroy for chatId: ${chatId}, page: ${page}, limit: ${limit}`); // Debug log
  // Ensure page is at least 0
 const currentPage = Math.max(1, page); 
  const skip = (currentPage - 1) * limit;

  // 1. Get messages (Newest first)
  const messageList = await ChatMessageModel.find({ chatId })
    .sort({ createdAt: -1 }) // Get newest for the current 'window'
    .skip(skip)
    .limit(limit)
    .populate("sender", "firstName lastName")
    .lean();
    console.log(`Fetched ${messageList.length} messages from DB`); // Debug log
    // 2. Total count for pagination metadata
  const total = await ChatMessageModel.countDocuments({ chatId });

  return {
    messageList,
    pagination: {
      total,
      page: currentPage + 1, // Return 1-indexed to UI
      pages: Math.ceil(total / limit),
    },
  };
};

export const updateMessageStatus = async (
  readerId: string,
  senderId: string,
) => {
  try {
    // 1. Find the chat shared by these two users
    // Ensure you have an index on 'participants' for speed
    const chat = await ChatModel.findOne({
      participants: { $all: [readerId, senderId] },
    });

    if (!chat) {
      console.warn(`No chat found between ${readerId} and ${senderId}`);
      return null;
    }

    // 2. Perform the bulk update
    const result = await ChatMessageModel.updateMany(
      {
        chatId: chat._id,
        sender: senderId, // Messages sent BY the other person
        "readStatus.user": readerId, // Where the reader is the recipient
        "readStatus.readAt": null, // Only update unread messages
      },
      {
        // Using a Date object fixes the CastError you encountered
        $set: { "readStatus.$.readAt": new Date() },
      },
    );

    return result;
  } catch (error) {
    // Log the error specifically for the repository layer
    console.error("Repository Error - markMessagesFromUserAsRead:", error);

    // Re-throw so the service or socket handler knows something went wrong
    throw error;
  }
};
