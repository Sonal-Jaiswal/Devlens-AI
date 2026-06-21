import { Schema, model } from "mongoose";

const chatMessageSchema = new Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true }
  },
  { _id: false }
);

const chatHistorySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: false },
    repositoryUrl: { type: String, required: true, index: true },
    messages: { type: [chatMessageSchema], default: [] }
  },
  { timestamps: true }
);

export const ChatHistoryModel = model("ChatHistory", chatHistorySchema);