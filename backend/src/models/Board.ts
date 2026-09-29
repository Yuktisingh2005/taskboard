import { Schema, model, Types, type Document } from "mongoose";
import { BOARD_ROLES, type BoardRole } from "../utils/constants";

export interface IBoardMember {
  userId: Types.ObjectId;
  role: BoardRole;
}

export interface IBoard extends Document {
  name: string;
  ownerId: Types.ObjectId;
  members: IBoardMember[];
  createdAt: Date;
  updatedAt: Date;
}

const memberSchema = new Schema<IBoardMember>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: [...BOARD_ROLES], required: true },
  },
  { _id: false }
);

const boardSchema = new Schema<IBoard>(
  {
    name: { type: String, required: true, trim: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    
    members: { type: [memberSchema], default: [] },
  },
  { timestamps: true }
);


boardSchema.index({ "members.userId": 1 });

export const Board = model<IBoard>("Board", boardSchema);