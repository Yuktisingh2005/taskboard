export const TASK_STATUSES = ["todo", "in_progress", "done"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const BOARD_ROLES = ["owner", "editor", "viewer"] as const;
export type BoardRole = (typeof BOARD_ROLES)[number];

export const ACTIVITY_ACTIONS = [
  "task_created",
  "task_updated",
  "task_moved",
  "task_assigned",
  "task_completed",
  "task_deleted",
  "member_added",
] as const;
export type ActivityAction = (typeof ACTIVITY_ACTIONS)[number];

// Gap between task positions in a column. Leaving room between numbers means
// a card can be dropped between two others without renumbering the whole column.
export const POSITION_GAP = 1000;

// Fields that get their own version stamp, used for conflict detection.
export const TRACKED_FIELDS = [
  "title",
  "description",
  "status",
  "position",
  "assigneeId",
  "dueDate",
] as const;
export type TrackedField = (typeof TRACKED_FIELDS)[number];