import { Schema, model, Types, type Document } from "mongoose";
import { ACTIVITY_ACTIONS, type ActivityAction } from "../utils/constants";

export interface IActivity extends Document {
  boardId: Types.ObjectId;
  userId: Types.ObjectId;
  action: ActivityAction;
  taskId: Types.ObjectId | null;
  taskTitle: string; // saved as a snapshot, so the log still reads well after a task is deleted
  meta: Record<string, unknown>;
  createdAt: Date;
}

const activitySchema = new Schema<IActivity>(
  {
    boardId: { type: Schema.Types.ObjectId, ref: "Board", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, enum: [...ACTIVITY_ACTIONS], required: true },
    taskId: { type: Schema.Types.ObjectId, default: null },
    taskTitle: { type: String, default: "" },
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

activitySchema.index({ boardId: 1, createdAt: -1 });

export const Activity = model<IActivity>("Activity", activitySchema);