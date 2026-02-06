import { Schema, model, InferSchemaType } from "mongoose";
import { CHAT_TYPES } from "../constant";

const chatSchema = new Schema(
  {
    chatType: { type: Number, enum: Object.values(CHAT_TYPES), required: true },
    participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
    groupAdmins: [{ type: Schema.Types.ObjectId, ref: "User" }],
    groupName: { type: String, trim: true, default: "" },
    groupAvatar: { type: String, default: "" },
    // FIXED: Changed ref from "Message" to "ChatMessage"
    latestMessage: { type: Schema.Types.ObjectId, ref: "ChatMessage" },
  },
  { timestamps: true, versionKey: false }
);

export const ChatModel = model("Chat", chatSchema);