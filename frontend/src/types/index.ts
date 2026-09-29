  export interface User {
    _id: string;
    name: string;
    email: string;
  }

  export type TaskStatus = "todo" | "in_progress" | "done";
  export type BoardRole = "owner" | "editor" | "viewer";

  export type ActivityAction =
    | "task_created"
    | "task_updated"
    | "task_moved"
    | "task_assigned"
    | "task_completed"
    | "task_deleted"
    | "member_added";

  export interface BoardMember {
    userId: string;
    role: BoardRole;
    name?: string;
    email?: string;
  }

  export interface Board {
    _id: string;
    name: string;
    ownerId: string;
    members: BoardMember[];
    createdAt: string;
    updatedAt: string;
  }

  export interface BoardSummary {
    _id: string;
    name: string;
    ownerId: string;
    memberCount: number;
    role: BoardRole;
    createdAt: string;
    updatedAt: string;
  }

  export interface Task {
    _id: string;
    boardId: string;
    title: string;
    description: string;
    status: TaskStatus;
    position: number;
    assigneeId: string | null;
    createdBy: string;
    dueDate: string | null;
    version: number;
    fieldVersions: Record<string, number>;
    createdAt: string;
    updatedAt: string;
  }

  export interface Activity {
    _id: string;
    boardId: string;
    userId: string;
    action: ActivityAction;
    taskId: string | null;
    taskTitle: string;
    meta: Record<string, unknown>;
    createdAt: string;
    user: {
      _id: string | null;
      name: string;
    };
  }