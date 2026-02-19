"use client";

import { useEffect } from "react";
import { useIsFetching } from "@tanstack/react-query";

export function GlobalLoadingBar() {
    const isFetching = useIsFetching();

    useEffect(() => {
        const bar = document.getElementById("global-loading-bar");
        if (!bar) return;

        if (isFetching > 0) {
            bar.style.width = "0%";
            bar.style.opacity = "1";

            // Animate to 70% over 500ms
            requestAnimationFrame(() => {
                bar.style.transition = "width 500ms ease-out";
                bar.style.width = "70%";
            });
        } else {
            // Complete to 100% then fade out
            bar.style.transition = "width 200ms ease-in";
            bar.style.width = "100%";

            setTimeout(() => {
                bar.style.opacity = "0";
                setTimeout(() => {
                    bar.style.width = "0%";
                }, 200);
            }, 200);
        }
    }, [isFetching]);

    return (
        <div
            id="global-loading-bar"
            className="fixed top-0 left-0 h-[3px] bg-primary z-50 transition-opacity duration-200"
            style={{ width: "0%", opacity: 0 }}
        />
    );
}
