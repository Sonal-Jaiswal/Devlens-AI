import { Schema, model } from "mongoose";

const repositoryAnalysisSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: false },
    repositoryUrl: { type: String, required: true, index: true },
    summary: { type: Object, required: true }
  },
  { timestamps: true }
);

export const RepositoryAnalysisModel = model("RepositoryAnalysis", repositoryAnalysisSchema);