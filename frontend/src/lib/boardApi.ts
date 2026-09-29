  import { api } from "@/lib/api";
  import type { Board, BoardSummary, Task, Activity, BoardRole } from "@/types";

  // ─── Boards ──────────────────────────────────────────────────────────────────

  export async function fetchBoards(): Promise<BoardSummary[]> {
    const { data } = await api.get<BoardSummary[]>("/boards");
    return data;
  }

  export async function createBoard(name: string): Promise<Board> {
    const { data } = await api.post<Board>("/boards", { name });
    return data;
  }

  export async function fetchBoard(
    boardId: string
  ): Promise<{ board: Board; tasks: Task[]; role: BoardRole }> {
    const { data } = await api.get<{ board: Board; tasks: Task[]; role: BoardRole }>(
      `/boards/${boardId}`
    );
    return data;
  }

  export async function renameBoard(boardId: string, name: string): Promise<Board> {
    const { data } = await api.patch<Board>(`/boards/${boardId}`, { name });
    return data;
  }

  export async function deleteBoard(boardId: string): Promise<void> {
    await api.delete(`/boards/${boardId}`);
  }

  export async function addBoardMember(
    boardId: string,
    email: string,
    role: BoardRole
  ): Promise<Board> {
    const { data } = await api.post<Board>(`/boards/${boardId}/members`, { email, role });
    return data;
  }

  // ─── Tasks ───────────────────────────────────────────────────────────────────

  export interface CreateTaskPayload {
    title: string;
    description?: string;
    status: string;
    assigneeId?: string | null;
    dueDate?: string | null;
  }

  export async function createTask(boardId: string, payload: CreateTaskPayload): Promise<Task> {
    const { data } = await api.post<Task>(`/boards/${boardId}/tasks`, payload);
    return data;
  }

  export interface UpdateTaskPayload {
    title?: string;
    description?: string;
    status?: string;
    position?: number;
    assigneeId?: string | null;
    dueDate?: string | null;
    baseVersion: number;
  }

  export async function updateTask(taskId: string, payload: UpdateTaskPayload): Promise<Task> {
    const { data } = await api.patch<Task>(`/tasks/${taskId}`, payload);
    return data;
  }

  export async function deleteTask(taskId: string): Promise<void> {
    await api.delete(`/tasks/${taskId}`);
  }

  // ─── Activity ─────────────────────────────────────────────────────────────────

  export async function fetchActivity(boardId: string, limit = 30): Promise<Activity[]> {
    const { data } = await api.get<Activity[]>(`/boards/${boardId}/activity?limit=${limit}`);
    return data;
  }