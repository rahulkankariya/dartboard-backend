import { Schema, model, InferSchemaType } from "mongoose";
import { CHAT_TYPES, MESSAGE_TYPES } from "../constant";

const chatMessageSchema = new Schema(
  {
    chatId: { type: Schema.Types.ObjectId, ref: "Chat", required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    messageType: {
      type: Number,
      enum: Object.values(MESSAGE_TYPES),
      default: MESSAGE_TYPES.TEXT,
    },
    readBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true, versionKey: false }
);

export const ChatMessageModel = model("ChatMessage", chatMessageSchema);