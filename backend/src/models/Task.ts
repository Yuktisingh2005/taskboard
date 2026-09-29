import { Schema, model, Types, type Document } from "mongoose";
import { TASK_STATUSES, type TaskStatus, type TrackedField } from "../utils/constants";

export interface ITask extends Document {
  boardId: Types.ObjectId;
  title: string;
  description: string;
  status: TaskStatus;
  position: number;
  assigneeId: Types.ObjectId | null;
  createdBy: Types.ObjectId;
  dueDate: Date | null;
  version: number; // goes up by 1 on every update
  fieldVersions: Record<TrackedField, number>; // the version at which each field last changed
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    boardId: { type: Schema.Types.ObjectId, ref: "Board", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    status: { type: String, enum: [...TASK_STATUSES], default: "todo" },
    position: { type: Number, required: true },
    assigneeId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    dueDate: { type: Date, default: null },
    version: { type: Number, default: 0 },
    fieldVersions: {
      title: { type: Number, default: 0 },
      description: { type: Number, default: 0 },
      status: { type: Number, default: 0 },
      position: { type: Number, default: 0 },
      assigneeId: { type: Number, default: 0 },
      dueDate: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

taskSchema.index({ boardId: 1, status: 1, position: 1 });

export const Task = model<ITask>("Task", taskSchema);