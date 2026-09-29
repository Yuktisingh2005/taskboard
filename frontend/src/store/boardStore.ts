  "use client";

  import { create } from "zustand";
  import type { Board, Task, Activity, BoardRole, TaskStatus } from "@/types";

  interface BoardState {
    
    board: Board | null;
    tasks: Task[];
    activity: Activity[];
    role: BoardRole | null;
    isLoading: boolean;
    error: string | null;

    
    socketStatus: "connected" | "disconnected" | "reconnecting";

    
    setBoard: (board: Board, tasks: Task[], role: BoardRole) => void;
    setActivity: (activity: Activity[]) => void;
    clearBoard: () => void;

    
    addTask: (task: Task) => void;
    updateTask: (task: Task) => void;
    removeTask: (taskId: string) => void;

    
    moveTaskOptimistic: (taskId: string, newStatus: TaskStatus, newPosition: number) => void;
    rollbackTask: (original: Task) => void;

    setSocketStatus: (status: "connected" | "disconnected" | "reconnecting") => void;
    setError: (error: string | null) => void;
    prependActivity: (entry: Activity) => void;
  }

  export const useBoardStore = create<BoardState>((set) => ({
    board: null,
    tasks: [],
    activity: [],
    role: null,
    isLoading: false,
    error: null,
    socketStatus: "disconnected",

    setBoard: (board, tasks, role) =>
      set({ board, tasks: [...tasks].sort((a, b) => a.position - b.position), role, error: null }),

    setActivity: (activity) => set({ activity }),

    clearBoard: () =>
      set({ board: null, tasks: [], activity: [], role: null, error: null }),

    addTask: (task) =>
      set((s) => {
        // avoid duplicates from optimistic + socket echo
        if (s.tasks.find((t) => t._id === task._id)) return s;
        const tasks = [...s.tasks, task].sort((a, b) => a.position - b.position);
        return { tasks };
      }),

    updateTask: (task) =>
      set((s) => ({
        tasks: s.tasks
          .map((t) => (t._id === task._id ? task : t))
          .sort((a, b) => a.position - b.position),
      })),

    removeTask: (taskId) =>
      set((s) => ({ tasks: s.tasks.filter((t) => t._id !== taskId) })),

    moveTaskOptimistic: (taskId, newStatus, newPosition) =>
      set((s) => ({
        tasks: s.tasks
          .map((t) =>
            t._id === taskId ? { ...t, status: newStatus, position: newPosition } : t
          )
          .sort((a, b) => a.position - b.position),
      })),

    rollbackTask: (original) =>
      set((s) => ({
        tasks: s.tasks
          .map((t) => (t._id === original._id ? original : t))
          .sort((a, b) => a.position - b.position),
      })),

    setSocketStatus: (socketStatus) => set({ socketStatus }),
    setError: (error) => set({ error }),
    prependActivity: (entry) =>
      set((s) => ({ activity: [entry, ...s.activity].slice(0, 50) })),
  }));