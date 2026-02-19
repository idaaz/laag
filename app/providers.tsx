"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { TimerProvider } from "@/lib/context/TimerContext";
import { ActiveTaskProvider } from "@/components/active-task/ActiveTaskContext";

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ActiveTaskProvider>
        <TimerProvider>{children}</TimerProvider>
      </ActiveTaskProvider>
    </QueryClientProvider>
  );
}
