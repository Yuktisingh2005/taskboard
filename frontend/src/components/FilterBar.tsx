  "use client";

  import { motion, AnimatePresence } from "framer-motion";
  import { SlidersHorizontal, X } from "lucide-react";
  import type { BoardMember } from "@/types";

  export interface FilterState {
    assigneeId: string; // "" = all
    overdue: boolean;
  }

  interface FilterBarProps {
    filters: FilterState;
    onChange: (f: FilterState) => void;
    members: BoardMember[];
  }

  export function FilterBar({ filters, onChange, members }: FilterBarProps) {
    const isActive = filters.assigneeId !== "" || filters.overdue;

    return (
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="h-3.5 w-3.5 text-zinc-500" />

        {}
        <select
          value={filters.assigneeId}
          onChange={(e) => onChange({ ...filters, assigneeId: e.target.value })}
          className="h-8 rounded-lg border border-white/10 bg-white/5 px-2 text-xs text-zinc-300 outline-none transition hover:border-white/20 focus:border-indigo-400/60"
        >
          <option value="">All members</option>
          {members.map((m) => (
            <option key={m.userId} value={m.userId}>
              {m.name ?? m.email ?? m.userId}
            </option>
          ))}
        </select>

        {}
        <button
          onClick={() => onChange({ ...filters, overdue: !filters.overdue })}
          className={`flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs transition ${
            filters.overdue
              ? "border-red-500/30 bg-red-500/10 text-red-300"
              : "border-white/10 text-zinc-400 hover:border-white/20 hover:text-zinc-200"
          }`}
        >
          Overdue
        </button>

        {}
        <AnimatePresence>
          {isActive && (
            <motion.button
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              onClick={() => onChange({ assigneeId: "", overdue: false })}
              className="flex h-8 items-center gap-1 rounded-lg border border-white/10 px-2 text-xs text-zinc-400 transition hover:text-white"
            >
              <X className="h-3 w-3" />
              Clear
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    );
  }
