  "use client";

  import { useEffect } from "react";
  import { getSocket } from "@/lib/socket";
  import { useBoardStore } from "@/store/boardStore";
  import { useAuthStore } from "@/store/authStore";
  import { fetchBoard, fetchActivity } from "@/lib/boardApi";
  import { toast } from "@/components/Toast";
  import type { Board, Task, Activity } from "@/types";

  export function useBoardSocket(boardId: string) {
    const token = useAuthStore((s) => s.token);
    const {
      addTask,
      updateTask,
      removeTask,
      setBoard,
      setActivity,
      setSocketStatus,
      prependActivity,
    } = useBoardStore();

    useEffect(() => {
      if (!token || !boardId) return;

      const socket = getSocket(token);

      socket.emit("board:join", boardId, (res: { ok: boolean; error?: string }) => {
        if (!res.ok) console.error("[socket] board:join failed:", res.error);
      });

      // ── task events ──────────────────────────────────────────────────────
      const onTaskCreated = ({ task }: { task: Task }) => addTask(task);
      const onTaskUpdated = ({ task }: { task: Task }) => updateTask(task);
      const onTaskDeleted = ({ taskId }: { taskId: string }) => removeTask(taskId);

      // ── activity events — this is what makes the panel live ─────────────
      const onActivityCreated = (entry: Activity) => prependActivity(entry);

      // ── board events ─────────────────────────────────────────────────────
      const onBoardUpdated = (updatedBoard: Board) => {
        const { tasks, role } = useBoardStore.getState();
        if (role) setBoard(updatedBoard, tasks, role);
      };

      const onBoardDeleted = ({ boardId: deletedId }: { boardId: string }) => {
        if (deletedId === boardId) {
          toast.info("This board was deleted by the owner.");
          setTimeout(() => (window.location.href = "/dashboard"), 2000);
        }
      };

      const onBoardInvited = ({ name }: { boardId: string; name: string }) => {
        toast.success(`You've been added to board "${name}"`);
      };

      // ── connection lifecycle ─────────────────────────────────────────────
      const onConnect = async () => {
        setSocketStatus("connected");
        toast.success("Reconnected — syncing board…");
        socket.emit("board:join", boardId);
        try {
          const [{ board: b, tasks: t, role: r }, activity] = await Promise.all([
            fetchBoard(boardId),
            fetchActivity(boardId),
          ]);
          setBoard(b, t, r);
          setActivity(activity);
        } catch {
          // silently ignore; stale data stays
        }
      };

      const onDisconnect = () => setSocketStatus("disconnected");
      const onReconnectAttempt = () => setSocketStatus("reconnecting");

      socket.on("task:created", onTaskCreated);
      socket.on("task:updated", onTaskUpdated);
      socket.on("task:deleted", onTaskDeleted);
      socket.on("activity:created", onActivityCreated);
      socket.on("board:updated", onBoardUpdated);
      socket.on("board:deleted", onBoardDeleted);
      socket.on("board:invited", onBoardInvited);
      socket.on("connect", onConnect);
      socket.on("disconnect", onDisconnect);
      socket.io.on("reconnect_attempt", onReconnectAttempt);

      if (socket.connected) setSocketStatus("connected");

      return () => {
        socket.emit("board:leave", boardId);
        socket.off("task:created", onTaskCreated);
        socket.off("task:updated", onTaskUpdated);
        socket.off("task:deleted", onTaskDeleted);
        socket.off("activity:created", onActivityCreated);
        socket.off("board:updated", onBoardUpdated);
        socket.off("board:deleted", onBoardDeleted);
        socket.off("board:invited", onBoardInvited);
        socket.off("connect", onConnect);
        socket.off("disconnect", onDisconnect);
        socket.io.off("reconnect_attempt", onReconnectAttempt);
      };
    }, [token, boardId]);
  }