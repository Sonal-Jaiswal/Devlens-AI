import { Schema, model } from "mongoose";

const apiUsageSchema = new Schema(
  {
    repositoryUrl: { type: String, required: true, index: true },
    feature: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: false },
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: false }
);

export const ApiUsageModel = model("ApiUsage", apiUsageSchema);
