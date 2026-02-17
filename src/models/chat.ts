import { Schema, model } from "mongoose";
import { CHAT_TYPES } from "../constant";

const chatSchema = new Schema(
  {
    chatType: { 
      type: Number, 
      enum: Object.values(CHAT_TYPES), 
      required: true,
      default: CHAT_TYPES.INDIVIDUAL 
    },
    participants: [
      { 
        type: Schema.Types.ObjectId, 
        ref: "User",
        index: true 
      }
    ],
    groupAdmins: [
      { type: Schema.Types.ObjectId, ref: "User" }
    ],
    groupName: { type: String, trim: true, default: "" },
    groupAvatar: { type: String, default: "" },
    latestMessage: { 
      type: Schema.Types.ObjectId, 
      ref: "ChatMessage" 
    },
  },
  { 
    timestamps: true, 
    versionKey: false,
    toJSON: { virtuals: true }, // Allows frontend to see virtual fields
    toObject: { virtuals: true }
  }
);

// OPTIMIZATION: Ensure no duplicate 1-on-1 chats exist for the same two people
chatSchema.index({ participants: 1, chatType: 1 }); 

export const ChatModel = model("Chat", chatSchema);