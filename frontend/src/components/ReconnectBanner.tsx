  "use client";

  import { AnimatePresence, motion } from "framer-motion";
  import { WifiOff, RefreshCw } from "lucide-react";

  interface ReconnectBannerProps {
    status: "connected" | "disconnected" | "reconnecting";
  }

  export function ReconnectBanner({ status }: ReconnectBannerProps) {
    const show = status !== "connected";

    return (
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="fixed left-1/2 top-4 z-50 -translate-x-1/2"
          >
            <div className="flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-sm text-amber-300 shadow-lg backdrop-blur">
              {status === "reconnecting" ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Reconnecting…
                </>
              ) : (
                <>
                  <WifiOff className="h-3.5 w-3.5" />
                  Disconnected — changes won&apos;t sync
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }