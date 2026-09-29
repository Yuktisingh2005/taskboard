import type { Types } from "mongoose";
import { Activity, type IActivity } from "../models/Activity";
import { User } from "../models/User";
import type { ITask } from "../models/Task";
import type { ActivityAction } from "../utils/constants";
import { emitToBoard } from "../socket";

interface LogInput {
  boardId: Types.ObjectId | string;
  userId: string;
  action: ActivityAction;
  taskId?: Types.ObjectId | string | null;
  taskTitle?: string;
  meta?: Record<string, unknown>;
}

// Shape sent to the frontend (and, in Phase 3, broadcast over sockets).
export function serializeActivity(a: IActivity) {
  const user = a.userId as unknown as { _id?: Types.ObjectId; name?: string } | null;
  return {
    _id: a.id as string,
    boardId: a.boardId,
    action: a.action,
    taskId: a.taskId,
    taskTitle: a.taskTitle,
    meta: a.meta,
    createdAt: a.createdAt,
    user: { _id: user?._id ?? null, name: user?.name ?? "Unknown user" },
  };
}

// Recording activity is secondary to the action itself, so a failure here is
// logged but never turns a successful request into an error.
export async function logActivity(input: LogInput) {
    try {
    const activity = await Activity.create({
      boardId: input.boardId,
      userId: input.userId,
      action: input.action,
      taskId: input.taskId ?? null,
      taskTitle: input.taskTitle ?? "",
      meta: input.meta ?? {},
    });
    await activity.populate("userId", "name");

    const serialized = serializeActivity(activity);
    emitToBoard(input.boardId, "activity:created", serialized);
    return serialized;
  } catch (err) {
    console.error("Failed to record activity:", err);
    return null;
  }
}

export async function listActivity(boardId: string, limit: number) {
  const items = await Activity.find({ boardId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("userId", "name");
  return items.map(serializeActivity);
}

interface TaskSnapshot {
  status: string;
  assigneeId: string | null;
  title: string;
}

// Turns one task update into readable log entries: a move (or completion),
// an assignment, and/or an edit. Reordering inside a column is not logged,
// since it would only add noise.
export async function recordTaskUpdate(params: {
  userId: string;
  task: ITask;
  before: TaskSnapshot;
  changedFields: string[];
}) {
  const { userId, task, before, changedFields } = params;
  const base = { boardId: task.boardId, userId, taskId: task._id, taskTitle: task.title };
  const created = [];

  if (changedFields.includes("status")) {
    created.push(
      await logActivity({
        ...base,
        action: task.status === "done" ? "task_completed" : "task_moved",
        meta: { from: before.status, to: task.status },
      })
    );
  }

  if (changedFields.includes("assigneeId")) {
    const assignee = task.assigneeId ? await User.findById(task.assigneeId).select("name") : null;
    created.push(
      await logActivity({
        ...base,
        action: "task_assigned",
        meta: {
          assigneeId: task.assigneeId ? String(task.assigneeId) : null,
          assigneeName: assignee?.name ?? null,
        },
      })
    );
  }

  const editedFields = changedFields.filter((f) => ["title", "description", "dueDate"].includes(f));
  if (editedFields.length > 0) {
    created.push(await logActivity({ ...base, action: "task_updated", meta: { fields: editedFields } }));
  }

  return created.filter((a): a is NonNullable<typeof a> => a !== null);
}