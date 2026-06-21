import { Schema, model } from "mongoose";

const usageRecordSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    dateKey: { type: String, required: true, index: true },
    questionCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

usageRecordSchema.index({ userId: 1, dateKey: 1 }, { unique: true });

export const UsageRecordModel = model("UsageRecord", usageRecordSchema);
