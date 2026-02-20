"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

export type KPIItem = {
    label: string;
    value: string | number;
    color?: "success" | "danger" | "warning" | "info" | "focus" | "score" | "achievement" | "calibration" | "pill" | "default";
    trend?: "up" | "down" | "neutral";
};

type MobileKPIContextType = {
    kpis: KPIItem[];
    setKPIs: (items: KPIItem[]) => void;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
};

const MobileKPIContext = createContext<MobileKPIContextType | undefined>(undefined);

export function MobileKPIProvider({ children }: { children: React.ReactNode }) {
    const [kpis, setKPIsState] = useState<KPIItem[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    const setKPIs = useCallback((items: KPIItem[]) => {
        setKPIsState(items);
    }, []);

    return (
        <MobileKPIContext.Provider value={{ kpis, setKPIs, isOpen, setIsOpen }}>
            {children}
        </MobileKPIContext.Provider>
    );
}

export function useMobileKPI() {
    const context = useContext(MobileKPIContext);
    if (!context) {
        throw new Error("useMobileKPI must be used within a MobileKPIProvider");
    }
    return context;
}

/**
 * Hook for pages to register their KPIs.
 * It will clear KPIs on unmount.
 */
export function useRegisterKPIs(items: KPIItem[]) {
    const { setKPIs } = useMobileKPI();

    useEffect(() => {
        setKPIs(items);
        // Optional: could clear on unmount, but usually next page will register its own
        // return () => setKPIs([]);
    }, [items, setKPIs]);
}
