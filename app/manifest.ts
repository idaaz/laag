import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "LAAG: Discipline OS",
        short_name: "LAAG",
        description: "A ruthless, measurable discipline operating system.",
        start_url: "/",
        display: "standalone",
        background_color: "#000000",
        theme_color: "#000000",
        icons: [
            {
                src: "/icon.svg",
                sizes: "any",
                type: "image/svg+xml",
            },
        ],
    };
}
