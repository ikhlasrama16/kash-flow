"use client";

import React, { useEffect, useState, useRef } from "react";
import { formatIDR } from "@/lib/utils";

interface AnimatedNumberProps {
  value: number;
  durationMs?: number;
  className?: string;
  showSign?: boolean;
}

export function AnimatedNumber({
  value,
  durationMs = 400,
  className,
  showSign = false,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);

  useEffect(() => {
    const startValue = prevValueRef.current;
    const diff = value - startValue;
    prevValueRef.current = value;

    if (diff === 0) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion || durationMs <= 0) {
      const timeoutId = setTimeout(() => setDisplayValue(value), 0);
      return () => clearTimeout(timeoutId);
    }

    const startTime = performance.now();

    const updateCounter = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const easeOutProgress = 1 - Math.pow(1 - progress, 4);
      const current = Math.round(startValue + diff * easeOutProgress);

      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        setDisplayValue(value);
      }
    };

    const animId = requestAnimationFrame(updateCounter);
    return () => cancelAnimationFrame(animId);
  }, [value, durationMs]);

  return <span className={className}>{formatIDR(displayValue, { showSign })}</span>;
}
