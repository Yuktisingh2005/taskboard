  "use client";

  import { useEffect, useState, useCallback, useMemo } from "react";
  import { useParams, useRouter } from "next/navigation";
  import { motion, AnimatePresence } from "framer-motion";
  import {
    DndContext,
    DragOverlay,
    PointerSensor,
    useSensor,
    useSensors,
    type DragStartEvent,
    type DragEndEvent,
    type DragOverEvent,
    closestCorners,
  } from "@dnd-kit/core";
  import { ArrowLeft, UserPlus, Activity, Pencil, Check } from "lucide-react";

  import { AuthBackground } from "@/components/AuthBackground";
  import { UserMenu } from "@/components/UserMenu";
  import { Column } from "@/components/Column";
  import { TaskCard } from "@/components/TaskCard";
  import { TaskModal } from "@/components/TaskModal";
  import { ActivityPanel } from "@/components/ActivityPanel";
  import { InviteMemberModal } from "@/components/InviteMemberModal";
  import { ReconnectBanner } from "@/components/ReconnectBanner";
  import { SearchBar } from "@/components/SearchBar";
  import { FilterBar, type FilterState } from "@/components/FilterBar";
  import { toast } from "@/components/Toast";

  import { useRequireAuth } from "@/lib/useRequireAuth";
  import { useAuthStore } from "@/store/authStore";
  import { useBoardStore } from "@/store/boardStore";
  import { useBoardSocket } from "@/lib/useBoardSocket";
  import {
    fetchBoard,
    fetchActivity,
    createTask,
    updateTask,
    deleteTask,
    renameBoard,
  } from "@/lib/boardApi";

  import type { Task, TaskStatus, BoardMember, Board } from "@/types";

  const COLUMNS: TaskStatus[] = ["todo", "in_progress", "done"];

  export default function BoardPage() {
    const token = useRequireAuth();
    const params = useParams();
    const router = useRouter();
    const boardId = params.id as string;

    const {
      board,
      tasks,
      activity,
      role,
      socketStatus,
      setBoard,
      setActivity,
      clearBoard,
      addTask,
      updateTask: updateTaskInStore,
      removeTask,
      moveTaskOptimistic,
      rollbackTask,
    } = useBoardStore();

    useBoardSocket(boardId);

    // ── local state ───────────────────────────────────────────────────────────
    const [isLoading, setIsLoading] = useState(true);
    const [pageError, setPageError] = useState<string | null>(null);

    const [isRenaming, setIsRenaming] = useState(false);
    const [renameValue, setRenameValue] = useState("");

    const [taskModal, setTaskModal] = useState<{
      task: Task | null;
      defaultStatus?: TaskStatus;
    } | null>(null);
    const [showActivity, setShowActivity] = useState(false);
    const [showInvite, setShowInvite] = useState(false);

    const [activeTask, setActiveTask] = useState<Task | null>(null);

    // ── search & filter ───────────────────────────────────────────────────────
    const [search, setSearch] = useState("");
    const [filters, setFilters] = useState<FilterState>({ assigneeId: "", overdue: false });

    const canEdit = role === "owner" || role === "editor";

    // ── sensors ───────────────────────────────────────────────────────────────
    const sensors = useSensors(
      useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );

    // ── fetch ─────────────────────────────────────────────────────────────────
    useEffect(() => {
      if (!token || !boardId) return;

      (async () => {
        setIsLoading(true);
        try {
          const [{ board: b, tasks: t, role: r }, act] = await Promise.all([
            fetchBoard(boardId),
            fetchActivity(boardId),
          ]);
          setBoard(b, t, r);
          setActivity(act);
        } catch {
          setPageError("Couldn't load this board.");
        } finally {
          setIsLoading(false);
        }
      })();

      return () => clearBoard();
    }, [token, boardId]);

    // ── filtered tasks ────────────────────────────────────────────────────────
    const visibleTasks = useMemo(() => {
      const q = search.toLowerCase().trim();
      const now = Date.now();
      return tasks.filter((t) => {
        if (q && !t.title.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q))
          return false;
        if (filters.assigneeId && t.assigneeId !== filters.assigneeId) return false;
        if (filters.overdue) {
          if (!t.dueDate || t.status === "done") return false;
          if (new Date(t.dueDate).getTime() >= now) return false;
        }
        return true;
      });
    }, [tasks, search, filters]);

    const tasksForColumn = (status: TaskStatus) =>
      visibleTasks.filter((t) => t.status === status);

    // ── fractional position ───────────────────────────────────────────────────
    function computePosition(columnTasks: Task[], overIndex: number, taskId: string): number {
      const GAP = 1000;
      const filtered = columnTasks.filter((t) => t._id !== taskId);
      if (filtered.length === 0) return GAP;
      if (overIndex <= 0) return (filtered[0]?.position ?? GAP) / 2;
      if (overIndex >= filtered.length)
        return (filtered[filtered.length - 1]?.position ?? GAP) + GAP;
      return (filtered[overIndex - 1].position + filtered[overIndex].position) / 2;
    }

    // ── DnD ───────────────────────────────────────────────────────────────────
    function handleDragStart({ active }: DragStartEvent) {
      const task = tasks.find((t) => t._id === active.id);
      if (task) setActiveTask(task);
    }

    function handleDragOver({ active, over }: DragOverEvent) {
      if (!over || !activeTask) return;
      const overId = String(over.id);
      const isOverColumn = COLUMNS.includes(overId as TaskStatus);
      const newStatus: TaskStatus = isOverColumn
        ? (overId as TaskStatus)
        : (tasks.find((t) => t._id === overId)?.status ?? activeTask.status);
      if (newStatus !== activeTask.status)
        setActiveTask((prev) => (prev ? { ...prev, status: newStatus } : prev));
    }

    async function handleDragEnd({ active, over }: DragEndEvent) {
      setActiveTask(null);
      if (!over || !activeTask) return;

      const taskId = String(active.id);
      const overId = String(over.id);
      const isOverColumn = COLUMNS.includes(overId as TaskStatus);
      const newStatus: TaskStatus = isOverColumn
        ? (overId as TaskStatus)
        : (tasks.find((t) => t._id === overId)?.status ?? activeTask.status);

      const columnTasks = tasksForColumn(newStatus);
      const overIndex = isOverColumn
        ? columnTasks.length
        : columnTasks.findIndex((t) => t._id === overId);

      const newPosition = computePosition(columnTasks, overIndex, taskId);
      const original = tasks.find((t) => t._id === taskId)!;

      // optimistic
      moveTaskOptimistic(taskId, newStatus, newPosition);

      try {
        const updated = await updateTask(taskId, {
          status: newStatus,
          position: newPosition,
          baseVersion: original.version,
        });
        updateTaskInStore(updated);
      } catch {
        rollbackTask(original);
        toast.error("Couldn't move task — rolled back.");
      }
    }

    // ── rename ────────────────────────────────────────────────────────────────
    function startRename() {
      setRenameValue(board?.name ?? "");
      setIsRenaming(true);
    }

    async function commitRename() {
      if (!board || !renameValue.trim() || renameValue === board.name) {
        setIsRenaming(false);
        return;
      }
      try {
        const updated = await renameBoard(boardId, renameValue.trim());
        setBoard(updated, tasks, role!);
        toast.success("Board renamed.");
      } catch {
        toast.error("Couldn't rename the board.");
      }
      setIsRenaming(false);
    }

    // ── task CRUD ─────────────────────────────────────────────────────────────
    const handleSaveTask = useCallback(
      async (data: {
        title: string;
        description: string;
        status: TaskStatus;
        assigneeId: string | null;
        dueDate: string | null;
        baseVersion?: number;
      }) => {
        if (!taskModal) return;

        if (taskModal.task) {
          const updated = await updateTask(taskModal.task._id, {
            ...data,
            baseVersion: data.baseVersion ?? taskModal.task.version,
          });
          updateTaskInStore(updated);
          toast.success("Task updated.");
        } else {
          const created = await createTask(boardId, data);
          addTask(created);
          toast.success("Task created.");
        }
      },
      [taskModal, boardId]
    );

    const handleDeleteTask = useCallback(async () => {
      if (!taskModal?.task) return;
      await deleteTask(taskModal.task._id);
      removeTask(taskModal.task._id);
      toast.success("Task deleted.");
    }, [taskModal]);

    function handleInviteSuccess(updatedBoard: Board) {
      setBoard(updatedBoard, tasks, role!);
      toast.success("Member invited successfully.");
    }

    const members: BoardMember[] = board?.members ?? [];

    // ── guards ────────────────────────────────────────────────────────────────
    if (token === undefined || !token) return null;

    if (isLoading) {
      return (
        <main className="relative flex min-h-screen items-center justify-center">
          <AuthBackground />
          <div className="relative z-10 flex flex-col items-center gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-indigo-400" />
            <p className="text-sm text-zinc-400">Loading board…</p>
          </div>
        </main>
      );
    }

    if (pageError || !board) {
      return (
        <main className="relative flex min-h-screen flex-col items-center justify-center gap-4">
          <AuthBackground />
          <p className="relative z-10 text-sm text-red-300">{pageError ?? "Board not found."}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="relative z-10 text-sm text-indigo-400 hover:text-indigo-300"
          >
            ← Back to dashboard
          </button>
        </main>
      );
    }

    const isFiltering = search || filters.assigneeId || filters.overdue;

    return (
      <main className="relative flex min-h-screen flex-col overflow-hidden">
        <AuthBackground />
        <ReconnectBanner status={socketStatus} />

        {/* ── Top bar ── */}
        <header className="relative z-10 flex items-center gap-3 border-b border-white/10 bg-zinc-950/60 px-5 py-3 backdrop-blur-xl">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          {/* Board name */}
          {isRenaming && role === "owner" ? (
            <form
              onSubmit={(e) => { e.preventDefault(); commitRename(); }}
              className="flex items-center gap-2"
            >
              <input
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={commitRename}
                maxLength={80}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-sm font-semibold text-white outline-none focus:border-indigo-400/60"
              />
              <button
                type="submit"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-emerald-400 transition hover:bg-emerald-500/10"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-semibold text-white">{board.name}</h1>
              {role === "owner" && (
                <button
                  onClick={startRename}
                  className="flex h-6 w-6 items-center justify-center rounded-md text-zinc-500 transition hover:bg-white/10 hover:text-white"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              )}
            </div>
          )}

          <div className="ml-auto flex items-center gap-2">
            {/* Search */}
            <SearchBar value={search} onChange={setSearch} />

            {/* Member avatars */}
            <div className="flex -space-x-1.5">
              {members.slice(0, 5).map((m) => (
                <div
                  key={m.userId}
                  title={m.name ?? m.email ?? m.userId}
                  className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-zinc-950 bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-[10px] font-semibold text-white"
                >
                  {m.name?.[0]?.toUpperCase() ?? "?"}
                </div>
              ))}
            </div>

            {role === "owner" && (
              <button
                onClick={() => setShowInvite(true)}
                className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-300 transition hover:bg-white/10 hover:text-white"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Invite
              </button>
            )}

            <button
              onClick={() => setShowActivity((v) => !v)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition ${
                showActivity
                  ? "border-indigo-400/40 bg-indigo-500/10 text-indigo-300"
                  : "border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
              Activity
            </button>

            <UserMenu />
          </div>
        </header>

        {/* ── Filter bar (shown below header) ── */}
        <div className="relative z-10 flex items-center gap-3 border-b border-white/[0.06] bg-zinc-950/40 px-5 py-2 backdrop-blur">
          <FilterBar filters={filters} onChange={setFilters} members={members} />
          {isFiltering && (
            <span className="ml-auto text-xs text-zinc-500">
              Showing {visibleTasks.length} of {tasks.length} tasks
            </span>
          )}
        </div>

        {/* ── Board body ── */}
        <div className="relative z-10 flex flex-1 gap-5 overflow-x-auto px-6 py-6">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            {COLUMNS.map((status) => (
              <Column
                key={status}
                status={status}
                tasks={tasksForColumn(status)}
                members={members}
                canEdit={canEdit}
                onAddTask={() => setTaskModal({ task: null, defaultStatus: status })}
                onTaskClick={(task) => setTaskModal({ task, defaultStatus: task.status })}
              />
            ))}

            <DragOverlay>
              {activeTask && (
                <TaskCard task={activeTask} members={members} onClick={() => {}} />
              )}
            </DragOverlay>
          </DndContext>
        </div>

        {/* ── Modals ── */}
        <AnimatePresence>
          {taskModal !== null && (
            <TaskModal
              task={taskModal.task}
              defaultStatus={taskModal.defaultStatus}
              members={members}
              canEdit={canEdit}
              onSave={handleSaveTask}
              onDelete={taskModal.task ? handleDeleteTask : undefined}
              onClose={() => setTaskModal(null)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showActivity && (
            <ActivityPanel activity={activity} onClose={() => setShowActivity(false)} />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showInvite && (
            <InviteMemberModal
              boardId={boardId}
              onSuccess={handleInviteSuccess}
              onClose={() => setShowInvite(false)}
            />
          )}
        </AnimatePresence>
      </main>
    );
  }