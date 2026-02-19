"use client";

import { useCallback } from "react";

interface ScrollIncrementOptions {
    step?: number;
    bigStep?: number;
    min?: number;
    max?: number;
}

/**
 * Custom hook to handle mouse wheel events for incrementing/decrementing numeric values.
 * @param value The current numeric value.
 * @param onChange Callback when the value changes.
 * @param options min, max, and step configuration.
 */
export function useMouseScrollIncrement(
    value: number,
    onChange: (newValue: number) => void,
    options: ScrollIncrementOptions = {}
) {
    const { step = 1, bigStep = 10, min, max } = options;

    const onWheel = useCallback((e: React.WheelEvent) => {
        // Prevent standard scroll if we're handling it
        e.preventDefault();

        const direction = e.deltaY < 0 ? 1 : -1;
        const isAccelerated = e.shiftKey || e.altKey;
        const currentStep = isAccelerated ? bigStep : step;

        let newValue = value + direction * currentStep;

        if (min !== undefined) newValue = Math.max(min, newValue);
        if (max !== undefined) newValue = Math.min(max, newValue);

        if (newValue !== value) {
            onChange(newValue);
        }
    }, [value, onChange, step, bigStep, min, max]);

    return { onWheel };
}
