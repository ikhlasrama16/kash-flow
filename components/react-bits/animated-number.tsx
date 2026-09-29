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
  durationMs = 700,
  className,
  showSign = false,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const currentValueRef = useRef(0);

  useEffect(() => {
    const startValue = currentValueRef.current;
    const diff = value - startValue;

    if (diff === 0) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion || durationMs <= 0) {
      const timeoutId = setTimeout(() => {
        currentValueRef.current = value;
        setDisplayValue(value);
      }, 0);
      return () => clearTimeout(timeoutId);
    }

    const startTime = performance.now();

    const updateCounter = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const easeOutProgress = 1 - Math.pow(1 - progress, 4);
      const current = Math.round(startValue + diff * easeOutProgress);

      currentValueRef.current = current;
      setDisplayValue(current);

      if (progress < 1) {
        animId = requestAnimationFrame(updateCounter);
      } else {
        setDisplayValue(value);
      }
    };

    let animId = requestAnimationFrame(updateCounter);
    return () => cancelAnimationFrame(animId);
  }, [value, durationMs]);

  return <span className={className}>{formatIDR(displayValue, { showSign })}</span>;
}
