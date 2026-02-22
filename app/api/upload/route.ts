import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const filename = formData.get("filename") as string | null;
        const userId = formData.get("userId") as string | null;

        if (!file || !filename || !userId) {
            return NextResponse.json(
                { error: "Missing required fields (file, filename, userId)" },
                { status: 400 }
            );
        }

        const token = process.env.GITHUB_TOKEN;
        const owner = process.env.GITHUB_REPO_OWNER;
        const repo = process.env.GITHUB_REPO_NAME;

        if (!token || !owner || !repo) {
            console.error("Missing GitHub environment variables.");
            return NextResponse.json(
                { error: "Server configuration error. Missing GitHub credentials." },
                { status: 500 }
            );
        }

        // Convert the file to a base64 string
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Content = buffer.toString("base64");

        const path = `public/attachments/${userId}/${filename}`;
        const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

        // Create the commit via GitHub REST API
        const response = await fetch(url, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/vnd.github.v3+json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                message: `Upload media attachment: ${filename}`,
                content: base64Content,
                branch: "main",
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("GitHub API Error:", data);
            return NextResponse.json(
                { error: `GitHub API Error: ${data.message || "Unknown error"}` },
                { status: response.status }
            );
        }

        // Construct the public URL for the uploaded file
        // Using raw.githubusercontent.com to serve the file directly
        const publicUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/${path}`;

        return NextResponse.json({ url: publicUrl });
    } catch (error) {
        console.error("Error processing upload:", error);
        return NextResponse.json(
            { error: "Internal server error during upload." },
            { status: 500 }
        );
    }
}
