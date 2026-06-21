import { Schema, model } from "mongoose";

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    plan: { type: String, enum: ["free", "pro"], default: "free" }
  },
  { timestamps: true }
);

export const UserModel = model("User", userSchema);