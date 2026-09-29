 "use client";

  import { useEffect, useState } from "react";
  import { useRouter } from "next/navigation";
  import { motion, AnimatePresence } from "framer-motion";
  import { Plus, Trash2, LayoutDashboard, Users } from "lucide-react";
  import { useRequireAuth } from "@/lib/useRequireAuth";
  import { useAuthStore } from "@/store/authStore";
  import { AuthBackground } from "@/components/AuthBackground";
  import { UserMenu } from "@/components/UserMenu";
  import { fetchBoards, createBoard, deleteBoard } from "@/lib/boardApi";
  import type { BoardSummary } from "@/types";

  const ROLE_COLORS: Record<string, string> = {
    owner: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    editor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    viewer: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20",
  };

  export default function DashboardPage() {
    const token = useRequireAuth();
    const router = useRouter();
    const user = useAuthStore((s) => s.user);

    const [boards, setBoards] = useState<BoardSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // create modal state
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState("");
    const [creating, setCreating] = useState(false);

    useEffect(() => {
      if (!token) return;
      loadBoards();
    }, [token]);

    async function loadBoards() {
      setIsLoading(true);
      setError(null);
      try {
        setBoards(await fetchBoards());
      } catch {
        setError("Couldn't load your boards. Try refreshing.");
      } finally {
        setIsLoading(false);
      }
    }

    async function handleCreate(e: React.FormEvent) {
      e.preventDefault();
      if (!newName.trim()) return;
      setCreating(true);
      try {
        const board = await createBoard(newName.trim());
        setBoards((prev) => [
          { ...board, memberCount: 1, role: "owner" },
          ...prev,
        ]);
        setNewName("");
        setShowCreate(false);
        router.push(`/board/${board._id}`);
      } catch {
        setError("Couldn't create board.");
      } finally {
        setCreating(false);
      }
    }

    async function handleDelete(id: string, e: React.MouseEvent) {
      e.stopPropagation();
      if (!confirm("Delete this board and all its tasks? This can't be undone.")) return;
      try {
        await deleteBoard(id);
        setBoards((prev) => prev.filter((b) => b._id !== id));
      } catch {
        setError("Couldn't delete the board.");
      }
    }

    if (token === undefined || !token) return null;

    const firstName = user?.name?.split(" ")[0] || "there";

    return (
      <main className="relative min-h-screen px-6 py-8">
        <AuthBackground />

        <div className="relative z-10 mx-auto max-w-5xl">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-zinc-400">
              <LayoutDashboard className="h-4 w-4" />
              <span className="text-sm">Your boards</span>
            </div>
            <UserMenu />
          </div>

          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-10 text-center"
          >
            <h1 className="text-3xl font-semibold text-white">
              Good to see you, {firstName} 👋
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              Pick up where you left off, or start a new board.
            </p>
          </motion.div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-center text-sm text-red-300"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Grid */}
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* New board button */}
            <motion.button
              onClick={() => setShowCreate(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex h-44 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] text-zinc-400 transition hover:border-indigo-400/40 hover:bg-white/[0.05] hover:text-white"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 shadow-lg shadow-indigo-500/20">
                <Plus className="h-5 w-5 text-white" />
              </span>
              <span className="text-sm font-medium">New board</span>
            </motion.button>

            {isLoading ? (
              <div className="col-span-full py-10 text-center text-sm text-zinc-500">
                Loading your boards…
              </div>
            ) : (
              <AnimatePresence>
                {boards.map((board) => (
                  <motion.div
                    key={board._id}
                    layout
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => router.push(`/board/${board._id}`)}
                    className="group relative flex h-44 cursor-pointer flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-lg shadow-black/20 backdrop-blur-xl transition hover:border-indigo-400/30
  hover:bg-white/[0.06]"
                  >
                    {/* top decoration */}
                    <div className="flex h-14 w-full items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/10 to-fuchsia-500/10">
                      <div className="flex gap-1.5">
                        {["todo", "in_progress", "done"].map((_, i) => (
                          <div
                            key={i}
                            className={`h-2 w-2 rounded-full ${
                              i === 0
                                ? "bg-zinc-400"
                                : i === 1
                                ? "bg-indigo-400"
                                : "bg-emerald-400"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex items-end justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{board.name}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                              ROLE_COLORS[board.role] ?? ROLE_COLORS.viewer
                            }`}
                          >
                            {board.role}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-zinc-500">
                            <Users className="h-3 w-3" />
                            {board.memberCount}
                          </span>
                        </div>
                      </div>

                      {board.role === "owner" && (
                        <button
                          onClick={(e) => handleDelete(board._id, e)}
                          title="Delete board"
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-zinc-500 opacity-0 transition hover:bg-red-500/10 hover:text-red-300 group-hover:opacity-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>

          {!isLoading && boards.length === 0 && (
            <p className="mt-6 text-center text-sm text-zinc-500">
              No boards yet — click &quot;New board&quot; above to create your first one.
            </p>
          )}
        </div>

        {/* Create board modal */}
        <AnimatePresence>
          {showCreate && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
              onClick={() => setShowCreate(false)}
            >
              <motion.div
                initial={{ scale: 0.95, y: 12 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 12 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-2xl"
              >
                <h2 className="mb-4 text-base font-semibold text-white">Create a board</h2>
                <form onSubmit={handleCreate} className="flex flex-col gap-4">
                  <input
                    autoFocus
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Board name"
                    maxLength={80}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowCreate(false)}
                      className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-zinc-300 transition hover:bg-white/5"
                    >
                      Cancel
                    </button>
                    <motion.button
                      type="submit"
                      disabled={creating || !newName.trim()}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className="flex-1 rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                    >
                      {creating ? "Creating…" : "Create"}
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    );
  }