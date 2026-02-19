import type { ComponentType } from "react";
import type { Route } from "next";
import {
  BarChart3,
  CalendarDays,
  CheckSquare,
  Globe,
  LayoutDashboard,
  NotebookPen,
  Repeat2,
  Settings,
  Trophy
} from "lucide-react";

export type NavItem = {
  href: Route;
  label: string;
  shortLabel: string;
  icon: ComponentType<{ className?: string }>;
};

export const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", shortLabel: "Home", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", shortLabel: "Tasks", icon: CheckSquare },
  { href: "/habits", label: "Habits", shortLabel: "Habits", icon: Repeat2 },
  { href: "/daily-logs", label: "Logs", shortLabel: "Logs", icon: CalendarDays },
  { href: "/notes", label: "Notes", shortLabel: "Notes", icon: NotebookPen },
  { href: "/analytics", label: "Analytics", shortLabel: "Data", icon: BarChart3 },
  { href: "/achievements", label: "Achievements", shortLabel: "Awards", icon: Trophy },
  { href: "/tracking", label: "Tracking", shortLabel: "Track", icon: Globe },
  { href: "/settings", label: "Settings", shortLabel: "Prefs", icon: Settings }
];
