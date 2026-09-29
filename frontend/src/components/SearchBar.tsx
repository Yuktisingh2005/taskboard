  "use client";

  import { Search, X } from "lucide-react";
  import { motion, AnimatePresence } from "framer-motion";

  interface SearchBarProps {
    value: string;
    onChange: (v: string) => void;
  }

  export function SearchBar({ value, onChange }: SearchBarProps) {
    return (
      <div className="relative flex items-center">
        <Search className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-zinc-500" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search tasks…"
          className="h-8 w-48 rounded-lg border border-white/10 bg-white/5 pl-8 pr-8 text-xs text-zinc-100 placeholder:text-zinc-500 outline-none transition focus:w-64 focus:border-indigo-400/60 focus:bg-white/[0.07] focus:ring-2
  focus:ring-indigo-500/20"
          style={{ transition: "width 0.2s ease" }}
        />
        <AnimatePresence>
          {value && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => onChange("")}
              className="absolute right-2 text-zinc-500 transition hover:text-white"
            >
              <X className="h-3 w-3" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    );
  }