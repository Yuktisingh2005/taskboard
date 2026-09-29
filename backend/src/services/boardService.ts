import mongoose from "mongoose";
import { Board, type IBoard } from "../models/Board";
import { User } from "../models/User";
import { AppError } from "../utils/AppError";
import type { BoardRole } from "../utils/constants";


export async function getBoardForUser(boardId: string, userId: string) {
  if (!mongoose.isValidObjectId(boardId)) {
    throw new AppError("Invalid board id", 400);
  }

  const board = await Board.findById(boardId);
  if (!board) throw new AppError("Board not found", 404);

  const member = board.members.find((m) => m.userId.toString() === userId);
  if (!member) throw new AppError("You don't have access to this board", 403);

  return { board, role: member.role };
}

export function assertCanEdit(role: BoardRole) {
  if (role === "viewer") {
    throw new AppError("Viewers can't modify this board", 403);
  }
}

export function assertOwner(role: BoardRole) {
  if (role !== "owner") {
    throw new AppError("Only the board owner can do this", 403);
  }
}


export function assertAssigneeIsMember(board: IBoard, assigneeId: string) {
  const isMember = board.members.some((m) => m.userId.toString() === assigneeId);
  if (!isMember) {
    throw new AppError("Assignee must be a member of this board", 400);
  }
}


export async function serializeBoard(board: IBoard) {
  const users = await User.find({
    _id: { $in: board.members.map((m) => m.userId) },
  }).select("name email");

  const byId = new Map(users.map((u) => [String(u._id), u]));

  return {
    _id: board.id as string,
    name: board.name,
    ownerId: board.ownerId,
    createdAt: board.createdAt,
    updatedAt: board.updatedAt,
    members: board.members.map((m) => {
      const user = byId.get(m.userId.toString());
      return {
        userId: m.userId,
        name: user?.name ?? "Unknown user",
        email: user?.email ?? "",
        role: m.role,
      };
    }),
  };
}