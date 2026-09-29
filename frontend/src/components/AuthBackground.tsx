"use client";

import { motion } from "framer-motion";


export function AuthBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden bg-zinc-950">
      <motion.div
        className="absolute -left-32 -top-32 h-[32rem] w-[32rem] rounded-full bg-indigo-600/30 blur-[100px]"
        animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-40 -right-20 h-[36rem] w-[36rem] rounded-full bg-fuchsia-600/20 blur-[110px]"
        animate={{ x: [0, -30, 0], y: [0, -40, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute left-1/3 top-1/2 h-[24rem] w-[24rem] rounded-full bg-cyan-500/10 blur-[100px]"
        animate={{ x: [0, 20, 0], y: [0, -20, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />
      {}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:44px_44px]" />
    </div>
  );
}