"use client";

import React from "react";
import { motion } from "framer-motion";

export function AnimatedBackground({ children }: { children?: React.ReactNode }) {
  return (
    <div className="relative min-h-full w-full">
      {/* 1. Subtle Dot Grid Background (Fixed to viewport) */}
      <div className="pointer-events-none fixed inset-0 -z-30 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff0d_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-70 dark:opacity-40" />

      {/* 2. Floating Animated Glowing Orbs (ReactBits Aurora mesh, Fixed to viewport) */}
      <div className="pointer-events-none fixed inset-0 -z-20 overflow-hidden">
        {/* Emerald Glow Top Left */}
        <motion.div
          animate={{
            x: [0, 40, -30, 0],
            y: [0, -30, 20, 0],
            scale: [1, 1.15, 0.95, 1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -top-32 -left-20 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-emerald-500/15 to-teal-500/0 blur-[130px] dark:from-emerald-500/20"
        />

        {/* Cyan / Blue Glow Top Right */}
        <motion.div
          animate={{
            x: [0, -50, 20, 0],
            y: [0, 40, -30, 0],
            scale: [1, 1.1, 0.9, 1],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-10 -right-20 h-[450px] w-[450px] rounded-full bg-gradient-to-bl from-cyan-500/15 to-indigo-500/0 blur-[120px] dark:from-cyan-500/18"
        />

        {/* Purple / Rose Glow Bottom Center */}
        <motion.div
          animate={{
            x: [0, 30, -40, 0],
            y: [0, -20, 30, 0],
            scale: [0.95, 1.1, 1, 0.95],
          }}
          transition={{
            duration: 26,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-1/2 left-1/3 h-[550px] w-[550px] rounded-full bg-gradient-to-tr from-purple-500/10 via-emerald-500/5 to-transparent blur-[140px] dark:from-purple-500/12"
        />
      </div>

      {children}
    </div>
  );
}
