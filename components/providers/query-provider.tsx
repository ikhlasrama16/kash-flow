"use client";

import React, { useEffect, useState } from "react";
import { onlineManager, QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Ensure React Query always treats the browser as online, even on LAN IP or Firefox offline quirks
if (typeof window !== "undefined") {
  onlineManager.setOnline(true);
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    onlineManager.setOnline(true);
  }, []);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            networkMode: "always",
            staleTime: 1000 * 30, // 30 seconds
            gcTime: 1000 * 60 * 5, // 5 minutes
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: {
            networkMode: "always",
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
