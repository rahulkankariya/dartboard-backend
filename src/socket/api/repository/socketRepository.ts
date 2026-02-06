import mongoose from "mongoose";
import { MessageType } from "../../../constant";
import { ChatMessageModel, ChatModel } from "../../../models";
import { UserModel } from "../../../models/users";
import { ISocketPayload } from "../../types/socket";

export const validateSocketToken = async (payload: ISocketPayload): Promise<boolean> => {
    try {
        const user = await UserModel.findOne({
            uniqueId: payload.uniqueId,
            _id: payload.id
        }).lean();

        // Returns true if user exists, false otherwise
        return !!user;
    } catch (error) {
        console.error("Database validation error:", error);
        return false;
    }
};


export const updateOnlineStatus = async (id: string, isOnline: number): Promise<boolean> => {
    try {
        const result = await UserModel.findByIdAndUpdate(id, { 
            isOnline: isOnline 
        });
        return !!result;
    } catch (error) {
        console.error("DB: Update Status Error:", error);
        return false;
    }
};

export const fetchActiveUsers = async (page: number = 1, limit: number = 10, currentUserId: string) => {
    try {
        const skip = (page - 1) * limit;
        const currentId = new mongoose.Types.ObjectId(currentUserId);

        const users = await UserModel.aggregate([
            {
                $match: {
                    _id: { $ne: currentId },
                    isDeleted: false
                }
            },
            // Look up the latest message between current user and the list user
            {
                $lookup: {
                    from: "chatmessages", // Ensure this matches your actual collection name
                    let: { userId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $or: [
                                        { $and: [{ $eq: ["$sender", "$$userId"] }, { $eq: ["$receiver", currentId] }] },
                                        { $and: [{ $eq: ["$sender", currentId] }, { $eq: ["$receiver", "$$userId"] }] }
                                    ]
                                }
                            }
                        },
                        { $sort: { createdAt: -1 } },
                        { $limit: 1 }
                    ],
                    as: "lastMsg"
                }
            },
            {
                $project: {
                    _id: 1,
                    // Combine First + Last Name
                    fullName: { $concat: ["$firstName", " ", "$lastName"] },
                    email: 1,
                    isOnline: 1,
                    lastSeen: 1,
                    // If no message, return null
                    lastMessage: { $ifNull: [{ $arrayElemAt: ["$lastMsg.content", 0] }, null] },
                    lastMessageTime: { $ifNull: [{ $arrayElemAt: ["$lastMsg.createdAt", 0] }, null] }
                }
            },
            { $sort: { isOnline: -1, lastMessageTime: -1 } },
            { $skip: skip },
            { $limit: limit }
        ]);

        const totalUsers = await UserModel.countDocuments({ _id: { $ne: currentUserId }, isDeleted: false });

        return {
            userList: users,
            pagination: {
                totalUsers,
                currentPage: page,
                totalPages: Math.ceil(totalUsers / limit)
            }
        };
    } catch (error) {
        console.error("DB: Fetch Users Error:", error);
        throw error;
    }
};
export const fetchChatMessages = async (chatId: string, page: number = 1, limit: number = 20) => {
    try {
        const skip = (page - 1) * limit;

        const messages = await ChatMessageModel.find({ chatId })
            // Populate sender and merge name fields if necessary
            .populate("sender", "firstName lastName isOnline")
            .sort({ createdAt: -1 }) // Newest first for chat history
            .skip(skip)
            .limit(limit)
            .lean();

        // Add virtual or manual fullName to populated senders
        const formattedMessages = messages.map(msg => ({
            ...msg,
            sender: msg.sender ? {
                ...msg.sender,
                fullName: `${(msg.sender as any).firstName} ${(msg.sender as any).lastName}`.trim()
            } : null
        }));

        const totalMessages = await ChatMessageModel.countDocuments({ chatId });

        return {
            messageList: formattedMessages,
            pagination: {
                totalMessages,
                currentPage: page,
                totalPages: Math.ceil(totalMessages / limit),
            }
        };
    } catch (error) {
        console.error("DB: Fetch Messages Error:", error);
        throw error;
    }
};
export const saveNewMessage = async (
  chatId: string, 
  senderId: string, 
  content: string, 
  type: MessageType // Use your MessageType constant here
) => {
  try {
    // 1. Create the message (Triggers the middleware in patch-mongoose)
    const message = await ChatMessageModel.create({
      chatId,
      sender: senderId,
      content,
      messageType: type,
      readBy: [senderId] // Sender has already "read" their own message
    });

    // 2. Update the parent Chat pointer
    await ChatModel.findByIdAndUpdate(chatId, {
      latestMessage: message._id,
      updatedAt: new Date()
    });

    // 3. Populate sender details
    const populated = await message.populate("sender", "firstName lastName isOnline");
    
    // 4. Convert to plain object and add fullName
    const msgObj = populated.toObject() as any;

    if (msgObj.sender && typeof msgObj.sender === 'object') {
      const fName = msgObj.sender.firstName || "";
      const lName = msgObj.sender.lastName || "";
      msgObj.sender.fullName = `${fName} ${lName}`.trim();
    }

    return msgObj;
  } catch (error) {
    // This catches the 'next is not a function' error until patch-mongoose.ts is fixed
    console.error("DB: Save Message Error:", error);
    throw error;
  }
};

export const findChatByIdDB = async (chatId: string) => {
    try {
        // Using .lean() for faster read performance
        return await ChatModel.findById(chatId).lean();
    } catch (error) {
        console.error("DB: Find Chat Error:", error);
        throw error;
    }
};
export const markMessageAsRead = async (messageId: string, userId: string) => {
  try {
    return await ChatMessageModel.findByIdAndUpdate(
      messageId,
      { $addToSet: { readBy: userId } }, // Only adds if userId doesn't exist in array
      { new: true }
    );
  } catch (error) {
    console.error("DB: Mark Read Error:", error);
    throw error;
  }
};