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

    const users = await UserModel.find({ 
        _id: { $ne: currentUserId }, // Don't show me in the list
        isDeleted: false 
      })
      .select("firstName lastName email isOnline lastSeen") // Only send needed fields
      .sort({ isOnline: -1, lastSeen: -1 }) // Online first, then recently active
      .skip(skip)
      .limit(limit)
      .lean(); // Faster performance (returns plain JS objects)

    const totalUsers = await UserModel.countDocuments({ _id: { $ne: currentUserId }, isDeleted: false });

    return {
      userList:users,
      pagination: {
        totalUsers,
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        hasNextPage: skip + users.length < totalUsers
      }
    };
    } catch (error) {
        console.error("DB: Fetch Users Error:", error);
        throw error; // Let the service handle the error response
    }
};
export const fetchChatMessages = async (chatId: string, page: number = 1, limit: number = 20) => {
    try {
        const skip = (page - 1) * limit;

        const messages = await ChatMessageModel.find({ chatId })
            .populate("sender", "firstName lastName isOnline") // Details of who sent it
            .sort({ createdAt: -1 }) // Newest first
            .skip(skip)
            .limit(limit)
            .lean();

        const totalMessages = await ChatMessageModel.countDocuments({ chatId });

        return {
            messageList: messages,
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
    type: MessageType
) => {
    try {
        // Create the new message
        const message = await ChatMessageModel.create({
            chatId,
            sender: senderId,
            content,
            messageType: type
        });

        // Update the Chat's latest message pointer
        await ChatModel.findByIdAndUpdate(chatId, {
            latestMessage: message._id
        }).exec();

        // Return populated message for the UI
        return await message.populate("sender", "firstName lastName isOnline");
        
    } catch (error) {
        console.error("DB: Save Message Error:", error);
        throw error;
    }
};
export const findChatByIdDB = async (chatId: string) => {
    try {
    return await ChatModel.findById(chatId).lean();
        
    } catch (error) {
        console.error("DB: Save Message Error:", error);
        throw error;
    }
};