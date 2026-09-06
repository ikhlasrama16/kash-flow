"use client";

import React, { useRef } from "react";
import { cn } from "@/lib/utils";

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  spotlightColor?: string;
  children: React.ReactNode;
}

export function SpotlightCard({
  children,
  className,
  spotlightColor = "rgba(16, 185, 129, 0.12)",
  ...props
}: SpotlightCardProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current || !overlayRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    overlayRef.current.style.opacity = "1";
    overlayRef.current.style.background = `radial-gradient(350px circle at ${x}px ${y}px, ${spotlightColor}, transparent 70%)`;
  };

  const handleMouseLeave = () => {
    if (!overlayRef.current) return;
    overlayRef.current.style.opacity = "0";
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "relative rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#0e1422] p-6 text-slate-900 dark:text-slate-100 shadow-xs transition-all duration-200 overflow-hidden",
        className
      )}
      {...props}
    >
      <div
        ref={overlayRef}
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 rounded-2xl hidden md:block"
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
