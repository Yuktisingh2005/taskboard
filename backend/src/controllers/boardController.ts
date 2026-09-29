import type { Request, Response } from "express";
import { Board } from "../models/Board";
import { Task } from "../models/Task";
import { Activity } from "../models/Activity";
import { User } from "../models/User";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import { getBoardForUser, assertOwner, serializeBoard } from "../services/boardService";
import { listActivity, logActivity } from "../services/activityService";
import { emitToBoard, emitToUser, closeBoardRoom } from "../socket";

export const createBoard = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;

  const board = await Board.create({
    name: req.body.name,
    ownerId: userId,
    members: [{ userId, role: "owner" }],
  });

  res.status(201).json(await serializeBoard(board));
});

export const listBoards = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;

  const boards = await Board.find({ "members.userId": userId }).sort({ updatedAt: -1 });

  res.status(200).json(
    boards.map((b) => ({
      _id: b.id,
      name: b.name,
      ownerId: b.ownerId,
      memberCount: b.members.length,
      role: b.members.find((m) => m.userId.toString() === userId)?.role,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
    }))
  );
});

export const getBoard = asyncHandler(async (req: Request, res: Response) => {
  const { board, role } = await getBoardForUser(req.params.id, req.userId!);

  const [serialized, tasks] = await Promise.all([
    serializeBoard(board),
    Task.find({ boardId: board._id }).sort({ position: 1 }),
  ]);

  res.status(200).json({ board: serialized, tasks, role });
});

export const updateBoard = asyncHandler(async (req: Request, res: Response) => {
  const { board, role } = await getBoardForUser(req.params.id, req.userId!);
  assertOwner(role);

  board.name = req.body.name;
  await board.save();

  const serialized = await serializeBoard(board);
  emitToBoard(board.id, "board:updated", serialized);

  res.status(200).json(serialized);
});

export const deleteBoard = asyncHandler(async (req: Request, res: Response) => {
  const { board, role } = await getBoardForUser(req.params.id, req.userId!);
  assertOwner(role);

  await Promise.all([
    Task.deleteMany({ boardId: board._id }),
    Activity.deleteMany({ boardId: board._id }),
    board.deleteOne(),
  ]);

  
  emitToBoard(board.id, "board:deleted", { boardId: board.id });
  closeBoardRoom(board.id);

  res.status(204).send();
});

export const addMember = asyncHandler(async (req: Request, res: Response) => {
  const { board, role } = await getBoardForUser(req.params.id, req.userId!);
  assertOwner(role);

  const user = await User.findOne({ email: req.body.email });
  if (!user) throw new AppError("No user found with that email", 404);

  const alreadyMember = board.members.some((m) => m.userId.toString() === String(user._id));
  if (alreadyMember) throw new AppError("That user is already a member", 409);

  board.members.push({ userId: user._id, role: req.body.role });
  await board.save();

  const serialized = await serializeBoard(board);

  
  emitToBoard(board.id, "board:updated", serialized);
  emitToUser(user._id, "board:invited", { boardId: board.id, name: board.name });

  await logActivity({
    boardId: board._id,
    userId: req.userId!,
    action: "member_added",
    meta: { memberName: user.name, role: req.body.role },
  });

  res.status(201).json(serialized);
});

export const getActivity = asyncHandler(async (req: Request, res: Response) => {
  const { board } = await getBoardForUser(req.params.id, req.userId!);

  const limit = Math.min(Number(req.query.limit) || 30, 100);
  res.status(200).json(await listActivity(board.id, limit));
});