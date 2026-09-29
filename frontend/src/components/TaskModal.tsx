 "use client";

  import { useState, useEffect, type FormEvent } from "react";
  import { motion, AnimatePresence } from "framer-motion";
  import { X, Trash2, Calendar, User2 } from "lucide-react";
  import type { Task, BoardMember, TaskStatus } from "@/types";

  const STATUSES: { value: TaskStatus; label: string }[] = [
    { value: "todo", label: "Todo" },
    { value: "in_progress", label: "In Progress" },
    { value: "done", label: "Done" },
  ];

  interface TaskModalProps {
    task: Task | null; // null = create mode
    defaultStatus?: TaskStatus;
    members: BoardMember[];
    canEdit: boolean;
    onSave: (data: {
      title: string;
      description: string;
      status: TaskStatus;
      assigneeId: string | null;
      dueDate: string | null;
      baseVersion?: number;
    }) => Promise<void>;
    onDelete?: () => Promise<void>;
    onClose: () => void;
  }

  export function TaskModal({
    task,
    defaultStatus = "todo",
    members,
    canEdit,
    onSave,
    onDelete,
    onClose,
  }: TaskModalProps) {
    const [title, setTitle] = useState(task?.title ?? "");
    const [description, setDescription] = useState(task?.description ?? "");
    const [status, setStatus] = useState<TaskStatus>(task?.status ?? defaultStatus);
    const [assigneeId, setAssigneeId] = useState<string>(task?.assigneeId ?? "");
    const [dueDate, setDueDate] = useState<string>(
      task?.dueDate ? task.dueDate.split("T")[0] : ""
    );
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // sync if task prop changes (e.g. socket update while modal is open)
    useEffect(() => {
      if (!task) return;
      setTitle(task.title);
      setDescription(task.description);
      setStatus(task.status);
      setAssigneeId(task.assigneeId ?? "");
      setDueDate(task.dueDate ? task.dueDate.split("T")[0] : "");
    }, [task?._id]);

    const handleSubmit = async (e: FormEvent) => {
      e.preventDefault();
      if (!title.trim()) return;
      setIsSaving(true);
      setError(null);
      try {
        await onSave({
          title: title.trim(),
          description,
          status,
          assigneeId: assigneeId || null,
          dueDate: dueDate || null,
          baseVersion: task?.version,
        });
        onClose();
      } catch (err: unknown) {
        const axiosErr = err as { response?: { status?: number; data?: { error?: string; task?: Task } } };
        if (axiosErr.response?.status === 409) {
          setError(
            "This task was updated by someone else. Your changes were merged where possible. Please review and save again."
          );
          // Server returns the latest task on 409 — but we stay open so user can review
        } else {
          setError(
            axiosErr.response?.data?.error ?? "Something went wrong. Try again."
          );
        }
      } finally {
        setIsSaving(false);
      }
    };

    const handleDelete = async () => {
      if (!onDelete) return;
      if (!confirm("Delete this task?")) return;
      setIsDeleting(true);
      try {
        await onDelete();
        onClose();
      } catch {
        setError("Couldn't delete the task.");
      } finally {
        setIsDeleting(false);
      }
    };

    const inputClass =
      "w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/20";

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 12 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl shadow-black/60"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <h2 className="text-base font-semibold text-white">
                {task ? "Edit task" : "Create task"}
              </h2>
              <button
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="p-5">
              <div className="flex flex-col gap-4">
                {/* Title */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-zinc-400">Title *</label>
                  <input
                    autoFocus
                    type="text"
                    required
                    maxLength={200}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Task title"
                    disabled={!canEdit}
                    className={inputClass}
                  />
                </div>

                {/* Description */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-zinc-400">Description</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add a description…"
                    disabled={!canEdit}
                    className={`${inputClass} resize-none`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Status */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-zinc-400">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as TaskStatus)}
                      disabled={!canEdit}
                      className={inputClass}
                    >
                      {STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Assignee */}
                  <div className="flex flex-col gap-1.5">
                    <label className="flex items-center gap-1 text-xs font-medium text-zinc-400">
                      <User2 className="h-3 w-3" /> Assignee
                    </label>
                    <select
                      value={assigneeId}
                      onChange={(e) => setAssigneeId(e.target.value)}
                      disabled={!canEdit}
                      className={inputClass}
                    >
                      <option value="">Unassigned</option>
                      {members.map((m) => (
                        <option key={m.userId} value={m.userId}>
                          {m.name ?? m.userId}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Due date */}
                <div className="flex flex-col gap-1.5">
                  <label className="flex items-center gap-1 text-xs font-medium text-zinc-400">
                    <Calendar className="h-3 w-3" /> Due date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    disabled={!canEdit}
                    className={`${inputClass} [color-scheme:dark]`}
                  />
                </div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-300"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="mt-5 flex items-center justify-between gap-3">
                <div>
                  {task && canEdit && onDelete && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {isDeleting ? "Deleting…" : "Delete"}
                    </button>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  {canEdit && (
                    <motion.button
                      type="submit"
                      disabled={isSaving || !title.trim()}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className="rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                    >
                      {isSaving ? "Saving…" : task ? "Save changes" : "Create task"}
                    </motion.button>
                  )}
                </div>
              </div>
            </form>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }