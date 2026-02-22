import { getSupabaseBrowserClient } from "./client";

export type FileAttachment = {
    name: string;
    url: string;
    type: "image" | "audio" | "file";
    size?: number;
};

export async function uploadNoteAttachment(
    userId: string,
    file: File | Blob,
    fileName: string,
    type: "image" | "audio" | "file"
): Promise<FileAttachment> {
    const supabase = getSupabaseBrowserClient();

    // Sanitize filename: lowercase, remove non-alphanumeric/dot/dash, replace spaces with underscores
    const sanitizedName = fileName
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9._-]/g, '');

    const filePath = `${userId}/${Date.now()}_${sanitizedName}`;

    const { data, error } = await supabase.storage
        .from("note-attachments")
        .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
        });

    if (error) {
        console.error("Supabase Storage Error:", error);
        throw error;
    }

    const { data: { publicUrl } } = supabase.storage
        .from("note-attachments")
        .getPublicUrl(data.path);

    return {
        name: fileName,
        url: publicUrl,
        type,
        size: file.size,
    };
}
