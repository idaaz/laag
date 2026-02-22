import { NextResponse } from "next/server";

export async function GET(
    request: Request,
    { params }: { params: { path: string[] } }
) {
    try {
        const owner = process.env.GITHUB_REPO_OWNER;
        const repo = process.env.GITHUB_REPO_NAME;
        const token = process.env.GITHUB_TOKEN;

        if (!owner || !repo || !token) {
            console.error("Missing GitHub environment variables for media proxy.");
            return new NextResponse("Server Configuration Error", { status: 500 });
        }

        // Reconstruct the file path from the dynamic route segments
        // Example: /api/media/public/attachments/userId/filename.jpg
        // path array: ['public', 'attachments', 'userId', 'filename.jpg']
        const filePath = params.path.join('/');

        // We must fetch from the GitHub REST API to get the content via token
        // The raw.githubusercontent.com URL often requires the token sent as a URL param
        // or standard auth header, but the API `/contents/` endpoint is more reliable
        const githubApiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;

        const response = await fetch(githubApiUrl, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/vnd.github.v3.raw", // Request the raw binary content
            },
        });

        if (!response.ok) {
            console.error("Failed to proxy media from GitHub:", response.statusText);
            return new NextResponse("Media not found", { status: response.status });
        }

        // Determine basic content type from the file extension
        const ext = filePath.split('.').pop()?.toLowerCase();
        let contentType = "application/octet-stream";
        if (ext === "jpg" || ext === "jpeg") contentType = "image/jpeg";
        else if (ext === "png") contentType = "image/png";
        else if (ext === "gif") contentType = "image/gif";
        else if (ext === "webp") contentType = "image/webp";
        else if (ext === "webm") contentType = "audio/webm";
        else if (ext === "mp3") contentType = "audio/mpeg";
        else if (ext === "mp4") contentType = "video/mp4";
        else if (ext === "mov") contentType = "video/quicktime";
        else if (ext === "m4v") contentType = "video/x-m4v";
        else if (ext === "avi") contentType = "video/x-msvideo";

        // Stream the response back to the client directly
        const buffer = await response.arrayBuffer();

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=31536000, immutable",
            },
        });

    } catch (error) {
        console.error("Error proxying media:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
