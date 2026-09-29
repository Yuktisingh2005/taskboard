  "use client";

  import { useSortable } from "@dnd-kit/sortable";
  import { CSS } from "@dnd-kit/utilities";
  import { motion } from "framer-motion";
  import { Calendar, User2, GripVertical } from "lucide-react";
  import type { Task, BoardMember } from "@/types";

  interface TaskCardProps {
    task: Task;
    members: BoardMember[];
    onClick: () => void;
  }

  export function TaskCard({ task, members, onClick }: TaskCardProps) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: task._id, data: { task } });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.4 : 1,
    };

    const assignee = members.find(
      (m) => m.userId === task.assigneeId
    );

    const isOverdue =
      task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done";

    return (
      <div ref={setNodeRef} style={style} {...attributes}>
        <motion.div
          layout
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          onClick={onClick}
          className="group relative cursor-pointer rounded-xl border border-white/10 bg-white/[0.04] p-3.5 shadow-sm backdrop-blur-sm transition hover:border-indigo-400/30 hover:bg-white/[0.07]"
        >
          {/* drag handle */}
          <div
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            className="absolute right-2 top-1/2 -translate-y-1/2 cursor-grab p-1 text-zinc-600 opacity-0 transition group-hover:opacity-100 active:cursor-grabbing"
          >
            <GripVertical className="h-3.5 w-3.5" />
          </div>

          <p className="pr-5 text-sm font-medium leading-snug text-zinc-100">
            {task.title}
          </p>

          {task.description && (
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-500">
              {task.description}
            </p>
          )}

          {(assignee || task.dueDate) && (
            <div className="mt-2.5 flex items-center gap-2.5">
              {task.dueDate && (
                <span
                  className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                    isOverdue
                      ? "border-red-500/30 bg-red-500/10 text-red-400"
                      : "border-white/10 bg-white/5 text-zinc-400"
                  }`}
                >
                  <Calendar className="h-2.5 w-2.5" />
                  {new Date(task.dueDate).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              )}
              {assignee && (
                <span className="ml-auto flex items-center gap-1 text-[10px] text-zinc-500">
                  <User2 className="h-2.5 w-2.5" />
                  {assignee.name ?? "Assigned"}
                </span>
              )}
            </div>
          )}
        </motion.div>
      </div>
    );
  }