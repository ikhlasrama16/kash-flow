"use client";

import React from "react";

export function AnimatedBackground({ children }: { children?: React.ReactNode }) {
  return (
    <div className="relative min-h-full w-full">
      {/* 1. Subtle Dot Grid Background (Fixed to viewport, highly optimized) */}
      <div className="pointer-events-none fixed inset-0 -z-30 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff0d_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-70 dark:opacity-40" />

      {/* 2. Lightweight Static Mesh Glows (Zero JS animation, zero GPU blur load) */}
      <div className="pointer-events-none fixed inset-0 -z-20 overflow-hidden">
        <div className="absolute -top-32 -left-20 h-[450px] w-[450px] rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.08)_0%,transparent_70%)] dark:bg-[radial-gradient(circle,rgba(16,185,129,0.12)_0%,transparent_70%)]" />
        <div className="absolute top-10 -right-20 h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle,rgba(6,182,212,0.06)_0%,transparent_70%)] dark:bg-[radial-gradient(circle,rgba(6,182,212,0.1)_0%,transparent_70%)]" />
        <div className="absolute top-1/2 left-1/3 h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,rgba(147,51,234,0.04)_0%,transparent_70%)] dark:bg-[radial-gradient(circle,rgba(147,51,234,0.07)_0%,transparent_70%)]" />
      </div>

      {children}
    </div>
  );
}
