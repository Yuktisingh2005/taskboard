  "use client";

  import { useState, type FormEvent } from "react";
  import { motion, AnimatePresence } from "framer-motion";
  import { X, UserPlus } from "lucide-react";
  import { addBoardMember } from "@/lib/boardApi";
  import type { Board, BoardRole } from "@/types";

  interface InviteMemberModalProps {
    boardId: string;
    onSuccess: (board: Board) => void;
    onClose: () => void;
  }

  export function InviteMemberModal({ boardId, onSuccess, onClose }: InviteMemberModalProps) {
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<BoardRole>("editor");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: FormEvent) => {
      e.preventDefault();
      if (!email.trim()) return;
      setIsSubmitting(true);
      setError(null);
      try {
        const board = await addBoardMember(boardId, email.trim(), role);
        onSuccess(board);
        onClose();
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        setError(axiosErr.response?.data?.error ?? "Couldn't add member.");
      } finally {
        setIsSubmitting(false);
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
            className="w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-base font-semibold text-white">
                <UserPlus className="h-4 w-4 text-indigo-400" />
                Invite member
              </div>
              <button
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-zinc-400">Email address</label>
                <input
                  autoFocus
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-zinc-400">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as BoardRole)}
                  className={inputClass}
                >
                  <option value="editor">Editor — can create and edit tasks</option>
                  <option value="viewer">Viewer — read only</option>
                </select>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-zinc-300 transition hover:bg-white/5"
                >
                  Cancel
                </button>
                <motion.button
                  type="submit"
                  disabled={isSubmitting || !email.trim()}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="flex-1 rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? "Inviting…" : "Send invite"}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }