
export type FileAttachment = {
    name: string;
    url: string;
    type: "image" | "audio" | "video" | "file";
    size?: number;
    path: string;
};

export async function uploadNoteAttachment(
    userId: string,
    file: File | Blob,
    fileName: string,
    type: "image" | "audio" | "video"
): Promise<FileAttachment> {
    // Sanitize filename: lowercase, remove non-alphanumeric/dot/dash, replace spaces with underscores
    const sanitizedName = fileName
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9._-]/g, '');

    const finalFileName = `${Date.now()}_${sanitizedName}`;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("filename", finalFileName);
    formData.append("userId", userId);

    const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
        console.error("Upload API Error:", data);
        throw new Error(data.error || "Failed to upload file to GitHub.");
    }

    return {
        url: data.url,
        type,
        path: `public/attachments/${userId}/${finalFileName}`,
        name: fileName, // Original name
        size: file.size,
    };
}
