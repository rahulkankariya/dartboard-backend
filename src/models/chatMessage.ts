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
    // NEW: Tracks the overall lifecycle of the message
    status: {
      type: String,
      enum: ["sent", "delivered", "seen"],
      default: "sent",
    },
    readStatus: [
      {
        _id: false,
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        // Tracks if the message actually reached the user's device
        deliveredAt: { type: Date, default: null },
        // Tracks when the user actually opened/read the chat
        readAt: { type: Date, default: null },
      },
    ],
  },
  { 
    timestamps: true, 
    versionKey: false 
  }
);

// --- INDEXES FOR REAL-TIME PERFORMANCE ---

// 1. For loading chat history efficiently
chatMessageSchema.index({ chatId: 1, createdAt: -1 });

// 2. For the Sidebar: Finding the "Last Message" quickly
chatMessageSchema.index({ chatId: 1, _id: -1 });

// 3. For the "Unread Count": Finding messages where user hasn't read yet
chatMessageSchema.index({ "readStatus.user": 1, "readStatus.readAt": 1 });

export const ChatMessageModel = model("ChatMessage", chatMessageSchema);