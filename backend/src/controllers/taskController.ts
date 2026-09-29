import type { Request, Response } from "express";
import mongoose from "mongoose";
import { Task } from "../models/Task";
import { User } from "../models/User";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import { POSITION_GAP } from "../utils/constants";
import {
  getBoardForUser,
  assertCanEdit,
  assertAssigneeIsMember,
} from "../services/boardService";
import { applyTaskUpdate } from "../services/taskService";
import { logActivity, recordTaskUpdate } from "../services/activityService";
import { emitToBoard } from "../socket";

async function loadTask(taskId: string) {
  if (!mongoose.isValidObjectId(taskId)) {
    throw new AppError("Invalid task id", 400);
  }
  const task = await Task.findById(taskId);
  if (!task) throw new AppError("Task not found", 404);
  return task;
}

export const createTask = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { board, role } = await getBoardForUser(req.params.id, userId);
  assertCanEdit(role);

  const { title, description, status, assigneeId, dueDate } = req.body;
  if (assigneeId) assertAssigneeIsMember(board, assigneeId);

  const last = await Task.findOne({ boardId: board._id, status }).sort({ position: -1 });

  const task = await Task.create({
    boardId: board._id,
    title,
    description,
    status,
    position: last ? last.position + POSITION_GAP : POSITION_GAP,
    assigneeId: assigneeId ?? null,
    dueDate: dueDate ?? null,
    createdBy: userId,
  });

  emitToBoard(board.id, "task:created", { task });

  const base = { boardId: board._id, userId, taskId: task._id, taskTitle: task.title };
  await logActivity({ ...base, action: "task_created", meta: { status: task.status } });

  if (assigneeId) {
    const assignee = await User.findById(assigneeId).select("name");
    await logActivity({
      ...base,
      action: "task_assigned",
      meta: { assigneeId, assigneeName: assignee?.name ?? null },
    });
  }

  res.status(201).json(task);
});

export const updateTask = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const existing = await loadTask(req.params.id);
  const { board, role } = await getBoardForUser(existing.boardId.toString(), userId);
  assertCanEdit(role);

  const { baseVersion, ...changes } = req.body;
  if (changes.assigneeId) assertAssigneeIsMember(board, changes.assigneeId);

  const { task, before, changedFields } = await applyTaskUpdate(existing.id, changes, baseVersion);

  
  if (changedFields.length > 0) {
    emitToBoard(task.boardId, "task:updated", { task });
    await recordTaskUpdate({ userId, task, before, changedFields });
  }

  res.status(200).json(task);
});

export const deleteTask = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const task = await loadTask(req.params.id);
  const { role } = await getBoardForUser(task.boardId.toString(), userId);
  assertCanEdit(role);

  await task.deleteOne();

  emitToBoard(task.boardId, "task:deleted", { taskId: task.id, boardId: String(task.boardId) });

  await logActivity({
    boardId: task.boardId,
    userId,
    action: "task_deleted",
    taskId: task._id,
    taskTitle: task.title,
  });

  res.status(204).send();
});