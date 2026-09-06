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
        <div className="absolute -top-[20%] left-1/4 h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.2)_0%,transparent_70%)]" />
        <div className="absolute top-[10%] -right-[10%] h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle,rgba(6,182,212,0.15)_0%,transparent_70%)]" />
        <div className="absolute -bottom-[20%] left-1/3 h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,rgba(79,70,229,0.1)_0%,transparent_70%)]" />
      </div>
      {children}
    </div>
  );
}
