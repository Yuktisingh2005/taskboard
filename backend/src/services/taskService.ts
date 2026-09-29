import { Task, type ITask } from "../models/Task";
import { AppError } from "../utils/AppError";
import { POSITION_GAP, TRACKED_FIELDS, type TrackedField } from "../utils/constants";

const MAX_ATTEMPTS = 3;

// Is the incoming value the same as what's stored? Ids and dates need
// converting first, because comparing objects directly would always say "different".
function sameValue(field: TrackedField, current: unknown, incoming: unknown): boolean {
  if (field === "assigneeId") {
    return (current ? String(current) : null) === (incoming ? String(incoming) : null);
  }
  if (field === "dueDate") {
    const a = current ? new Date(current as Date).getTime() : null;
    const b = incoming ? new Date(incoming as Date).getTime() : null;
    return a === b;
  }
  return current === incoming;
}

function snapshot(task: ITask) {
  return {
    status: task.status as string,
    assigneeId: task.assigneeId ? String(task.assigneeId) : null,
    title: task.title,
  };
}

// Applies a task update safely when several people may be editing at once.
//  1. Read the current task.
//  2. Keep only the fields that actually change something.
//  3. If any of those fields was changed by someone else AFTER the version the
//     client was looking at (baseVersion), reject with 409 and the latest task.
//  4. Otherwise write, but only if the task's version is still the one we read.
//     If another request slipped in between, go back to step 1.
export async function applyTaskUpdate(
  taskId: string,
  incoming: Record<string, unknown>,
  baseVersion: number
) {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const task = await Task.findById(taskId);
    if (!task) throw new AppError("Task not found", 404);

    if (baseVersion > task.version) {
      throw new AppError("baseVersion is newer than the server's version", 400);
    }

    const changedFields = TRACKED_FIELDS.filter(
      (f) => f in incoming && !sameValue(f, task.get(f), incoming[f])
    );

    // Nothing to change (for example, moving a task to the column it's already in).
    if (changedFields.length === 0) {
      return { task, before: snapshot(task), changedFields: [] as string[] };
    }

    const conflicts = changedFields.filter((f) => task.fieldVersions[f] > baseVersion);
    if (conflicts.length > 0) {
      throw new AppError(
        "This task was changed by someone else. Review the latest version and try again.",
        409,
        { conflicts, task }
      );
    }

    const set: Record<string, unknown> = {};
    const stamped = new Set<string>(changedFields);
    for (const f of changedFields) set[f] = incoming[f];

    // Moving to another column without saying where: put it at the bottom.
    if (changedFields.includes("status") && !("position" in incoming)) {
      const last = await Task.findOne({ boardId: task.boardId, status: incoming.status }).sort({
        position: -1,
      });
      set.position = last ? last.position + POSITION_GAP : POSITION_GAP;
      stamped.add("position");
    }

    const newVersion = task.version + 1;
    for (const f of stamped) set[`fieldVersions.${f}`] = newVersion;

    // The filter on `version` is the safety net: it only matches if nobody else
    // has updated the task since we read it.
    const updated = await Task.findOneAndUpdate(
      { _id: task._id, version: task.version },
      { $set: set, $inc: { version: 1 } },
      { new: true, runValidators: true }
    );

    if (updated) {
      return { task: updated, before: snapshot(task), changedFields: [...stamped] };
    }
    // Someone else wrote in the gap. Loop again with fresh data.
  }

  throw new AppError("This task is being edited heavily right now. Please try again.", 409);
}