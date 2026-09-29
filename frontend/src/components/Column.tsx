  "use client";

  import { useDroppable } from "@dnd-kit/core";
  import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
  import { AnimatePresence } from "framer-motion";
  import { Plus } from "lucide-react";
  import { TaskCard } from "@/components/TaskCard";
  import type { Task, TaskStatus, BoardMember } from "@/types";

  const COLUMN_META: Record<
    TaskStatus,
    { label: string; dotClass: string; headerClass: string }
  > = {
    todo: {
      label: "Todo",
      dotClass: "bg-zinc-400",
      headerClass: "text-zinc-300",
    },
    in_progress: {
      label: "In Progress",
      dotClass: "bg-indigo-400",
      headerClass: "text-indigo-300",
    },
    done: {
      label: "Done",
      dotClass: "bg-emerald-400",
      headerClass: "text-emerald-300",
    },
  };

  interface ColumnProps {
    status: TaskStatus;
    tasks: Task[];
    members: BoardMember[];
    onAddTask: () => void;
    onTaskClick: (task: Task) => void;
    canEdit: boolean;
  }

  export function Column({
    status,
    tasks,
    members,
    onAddTask,
    onTaskClick,
    canEdit,
  }: ColumnProps) {
    const meta = COLUMN_META[status];
    const { setNodeRef, isOver } = useDroppable({ id: status });

    const taskIds = tasks.map((t) => t._id);

    return (
      <div className="flex w-72 shrink-0 flex-col">
        {/* Column header */}
        <div className="mb-3 flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${meta.dotClass}`} />
            <span className={`text-sm font-semibold ${meta.headerClass}`}>
              {meta.label}
            </span>
            <span className="ml-1 rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-zinc-500">
              {tasks.length}
            </span>
          </div>
          {canEdit && (
            <button
              onClick={onAddTask}
              className="flex h-6 w-6 items-center justify-center rounded-md text-zinc-500 transition hover:bg-white/10 hover:text-white"
              title={`Add task to ${meta.label}`}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Drop zone */}
        <div
          ref={setNodeRef}
          className={`column-scroll flex flex-1 flex-col gap-2 overflow-y-auto rounded-2xl border p-2 transition-colors ${
            isOver
              ? "border-indigo-400/40 bg-indigo-500/5"
              : "border-white/[0.06] bg-white/[0.02]"
          }`}
          style={{ minHeight: 120, maxHeight: "calc(100vh - 220px)" }}
        >
          <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
            <AnimatePresence>
              {tasks.map((task) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  members={members}
                  onClick={() => onTaskClick(task)}
                />
              ))}
            </AnimatePresence>
          </SortableContext>

          {tasks.length === 0 && (
            <div className="flex flex-1 items-center justify-center py-6 text-xs text-zinc-600">
              No tasks
            </div>
          )}
        </div>
      </div>
    );
  }