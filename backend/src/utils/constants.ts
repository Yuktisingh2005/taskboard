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


export const POSITION_GAP = 1000;


export const TRACKED_FIELDS = [
  "title",
  "description",
  "status",
  "position",
  "assigneeId",
  "dueDate",
] as const;
export type TrackedField = (typeof TRACKED_FIELDS)[number];