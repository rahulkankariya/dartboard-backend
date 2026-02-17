import { Schema, model } from "mongoose";
import { MESSAGE_TYPES } from "../constant";

const chatMessageSchema = new Schema(
  {
    chatId: { 
      type: Schema.Types.ObjectId, 
      ref: "Chat", 
      required: true 
    },
    sender: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    content: { type: String, required: true, trim: true },
    messageType: {
      type: Number,
      enum: Object.values(MESSAGE_TYPES),
      default: MESSAGE_TYPES.TEXT,
    },
    readStatus: [
      {
        _id: false, // Saves space: No need for unique IDs on sub-documents
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        readAt: { type: Date, default: null },
      },
    ],
  },
  { 
    timestamps: true, 
    versionKey: false 
  }
);

// OPTIMIZATION: Compound index for fetching "Last 20 messages" in a specific chat
chatMessageSchema.index({ chatId: 1, createdAt: -1 });

export const ChatMessageModel = model("ChatMessage", chatMessageSchema);