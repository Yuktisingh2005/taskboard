  "use client";

  import { useEffect, useState } from "react";
  import { motion, AnimatePresence } from "framer-motion";
  import { CheckCircle, AlertCircle, Info, X } from "lucide-react";

  export type ToastType = "success" | "error" | "info";

  export interface ToastMessage {
    id: string;
    type: ToastType;
    message: string;
  }

  

  type Listener = (toasts: ToastMessage[]) => void;
  let toasts: ToastMessage[] = [];
  const listeners = new Set<Listener>();

  function notify() {
    listeners.forEach((l) => l([...toasts]));
  }

  export const toast = {
    show(message: string, type: ToastType = "info", duration = 4000) {
      const id = Math.random().toString(36).slice(2);
      toasts = [...toasts, { id, type, message }];
      notify();
      setTimeout(() => {
        toasts = toasts.filter((t) => t.id !== id);
        notify();
      }, duration);
    },
    success(message: string) {
      this.show(message, "success");
    },
    error(message: string) {
      this.show(message, "error", 6000);
    },
    info(message: string) {
      this.show(message, "info");
    },
  };

  

  const ICONS = {
    success: <CheckCircle className="h-4 w-4 text-emerald-400" />,
    error: <AlertCircle className="h-4 w-4 text-red-400" />,
    info: <Info className="h-4 w-4 text-indigo-400" />,
  };

  const BORDER = {
    success: "border-emerald-500/20 bg-emerald-500/10",
    error: "border-red-500/20 bg-red-500/10",
    info: "border-indigo-500/20 bg-indigo-500/10",
  };

  function dismiss(id: string) {
    toasts = toasts.filter((t) => t.id !== id);
    notify();
  }

  export function ToastContainer() {
    const [items, setItems] = useState<ToastMessage[]>([]);

    useEffect(() => {
      const handler = (t: ToastMessage[]) => setItems(t);
      listeners.add(handler);
      return () => {
        listeners.delete(handler);
      };
    }, []);

    return (
      <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex flex-col items-end gap-2">
        <AnimatePresence>
          {items.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 24, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, scale: 0.95 }}
              className={`pointer-events-auto flex max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-xl backdrop-blur ${BORDER[t.type]}`}
            >
              <span className="mt-0.5 shrink-0">{ICONS[t.type]}</span>
              <p className="text-sm text-zinc-100">{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                className="ml-2 shrink-0 text-zinc-500 transition hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  }