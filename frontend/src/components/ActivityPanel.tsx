  "use client";

  import { motion, AnimatePresence } from "framer-motion";
  import { X, Activity } from "lucide-react";
  import type { Activity as ActivityEntry } from "@/types";

  const ACTION_LABEL: Record<string, string> = {
    task_created: "created",
    task_updated: "updated",
    task_moved: "moved",
    task_assigned: "assigned",
    task_completed: "completed",
    task_deleted: "deleted",
    member_added: "added a member",
  };

  const ACTION_DOT: Record<string, string> = {
    task_created: "bg-emerald-400",
    task_updated: "bg-indigo-400",
    task_moved: "bg-cyan-400",
    task_assigned: "bg-amber-400",
    task_completed: "bg-emerald-400",
    task_deleted: "bg-red-400",
    member_added: "bg-fuchsia-400",
  };

  function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    const now = Date.now();
    const diff = now - date.getTime();
    if (diff < 60_000) return "just now";
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  function buildLabel(entry: ActivityEntry): string {
    const verb = ACTION_LABEL[entry.action] ?? entry.action;
    const actor = entry.user?.name || "Unknown user";

    if (entry.action === "task_moved") {
      const { from, to } = entry.meta as { from?: string; to?: string };
      const fmt = (s?: string) =>
        s === "in_progress" ? "In Progress" : s ? s.charAt(0).toUpperCase() + s.slice(1) : "?";
      return `${actor} moved "${entry.taskTitle}" from ${fmt(from)} → ${fmt(to)}`;
    }
    if (entry.action === "task_assigned") {
      return `${actor} assigned "${entry.taskTitle}" to ${
        (entry.meta as Record<string, unknown>).assigneeName ?? "someone"
      }`;
    }
    if (entry.action === "member_added") {
      return `${actor} added ${
        (entry.meta as Record<string, unknown>).memberName ?? "a member"
      }`;
    }
    if (entry.taskTitle) {
      return `${actor} ${verb} "${entry.taskTitle}"`;
    }
    return `${actor} ${verb}`;
  }

  interface ActivityPanelProps {
    activity: ActivityEntry[];
    onClose: () => void;
  }

  export function ActivityPanel({ activity, onClose }: ActivityPanelProps) {
    return (
      <motion.aside
        initial={{ x: "100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 260 }}
        className="fixed inset-y-0 right-0 z-40 flex w-80 flex-col border-l border-white/10 bg-zinc-950/95 shadow-2xl backdrop-blur-xl"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Activity className="h-4 w-4 text-indigo-400" />
            Activity
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 column-scroll">
          {activity.length === 0 ? (
            <p className="mt-8 text-center text-sm text-zinc-600">No activity yet.</p>
          ) : (
            <AnimatePresence initial={false}>
              {activity.map((entry) => (
                <motion.div
                  key={entry._id}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="relative mb-4 pl-4"
                >
                  <span
                    className={`absolute left-0 top-1.5 h-2 w-2 rounded-full ${
                      ACTION_DOT[entry.action] ?? "bg-zinc-500"
                    }`}
                  />
                  <div className="absolute left-[3px] top-4 h-full w-px bg-white/5" />
                  <p className="text-xs leading-relaxed text-zinc-300">
                    {buildLabel(entry)}
                  </p>
                  <p className="mt-0.5 text-[10px] text-zinc-600">
                    {formatTime(entry.createdAt)}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </motion.aside>
    );
  }