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
    // The owner is also stored here with role "owner", so checking access is
    // always one lookup in this array.
    members: { type: [memberSchema], default: [] },
  },
  { timestamps: true }
);

// Speeds up "find all boards this user belongs to".
boardSchema.index({ "members.userId": 1 });

export const Board = model<IBoard>("Board", boardSchema);