import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDatabase() {
  if (!env.mongodbUri) {
    console.warn("MONGODB_URI is not set. Running without a database connection.");
    return false;
  }

  await mongoose.connect(env.mongodbUri, {
    autoIndex: true
  });

  return true;
}
