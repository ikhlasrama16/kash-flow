"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface AuroraBackgroundProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export function AuroraBackground({ children, className, ...props }: AuroraBackgroundProps) {
  return (
    <div className={cn("relative overflow-hidden", className)} {...props}>
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden opacity-30 dark:opacity-20">
        <div className="absolute -top-[20%] left-1/4 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/0 blur-[120px]" />
        <div className="absolute top-[10%] -right-[10%] h-[400px] w-[400px] rounded-full bg-gradient-to-br from-cyan-500/15 to-blue-500/0 blur-[100px]" />
        <div className="absolute -bottom-[20%] left-1/3 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-emerald-600/10 to-indigo-500/0 blur-[140px]" />
      </div>
      {children}
    </div>
  );
}
