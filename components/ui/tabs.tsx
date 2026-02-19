"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type TabsContextType = {
  value: string;
  setValue: (value: string) => void;
};

const TabsContext = React.createContext<TabsContextType | null>(null);

export function Tabs({
  value,
  onValueChange,
  children
}: {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <TabsContext.Provider value={{ value, setValue: onValueChange }}>
      {children}
    </TabsContext.Provider>
  );
}

export function TabsList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1",
        className
      )}
      {...props}
    />
  );
}

export function TabsTrigger({
  value,
  className,
  children
}: {
  value: string;
  className?: string;
  children: React.ReactNode;
}) {
  const context = React.useContext(TabsContext);
  if (!context) return null;
  const active = context.value === value;
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center rounded-sm px-3 py-1.5 text-sm transition-colors",
        active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
        className
      )}
      onClick={() => context.setValue(value)}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  className,
  children
}: {
  value: string;
  className?: string;
  children: React.ReactNode;
}) {
  const context = React.useContext(TabsContext);
  if (!context || context.value !== value) return null;
  return <div className={cn("mt-4", className)}>{children}</div>;
}
