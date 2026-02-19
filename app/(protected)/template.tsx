"use client";

import { motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export default function ProtectedTemplate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      key={pathname}
      className="h-full"
      initial={reducedMotion ? { opacity: 1 } : { opacity: 0.92, y: 3 }}
      animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{ duration: reducedMotion ? 0.01 : 0.12, ease: [0.2, 0.9, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}
