const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = process.env.GITHUB_REPO_OWNER;
const REPO_NAME = process.env.GITHUB_REPO_NAME;

export type ArchiveType = "tasks" | "habits" | "tracking" | "daily_logs" | "notes";

type GitHubFileEntry = {
    name: string;
    path: string;
    type: "file" | "dir";
    download_url: string | null;
};

type GitHubPutBody = {
    message: string;
    content: string;
    sha?: string;
};

/**
 * Commits a JSON payload to the corresponding GitHub repository.
 * The file path will be: `users/{userId}/archived/{type}/{subfolder?}/{filename}.json`
 */
export async function archiveToGitHub(
    userId: string,
    type: ArchiveType | string,
    filename: string,
    payload: unknown,
    subfolder?: string
): Promise<boolean> {
    if (!GITHUB_TOKEN || !REPO_OWNER || !REPO_NAME) {
        console.warn("GitHub environment variables are missing. Skipping archive.");
        return false;
    }

    const path = subfolder
        ? `users/${userId}/archived/${type}/${subfolder}/${filename}.json`
        : `users/${userId}/archived/${type}/${filename}.json`;

    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;
    const content = Buffer.from(JSON.stringify(payload, null, 2)).toString("base64");

    try {
        let sha: string | undefined = undefined;
        const getRes = await fetch(url, {
            headers: {
                Authorization: `token ${GITHUB_TOKEN}`,
                Accept: "application/vnd.github.v3+json",
            },
        });

        if (getRes.ok) {
            const existingData = await getRes.json() as { sha?: string };
            sha = existingData.sha;
        }

        const body: GitHubPutBody = {
            message: `Archive ${type}: ${filename}`,
            content: content,
        };

        if (sha) {
            body.sha = sha;
        }

        const putRes = await fetch(url, {
            method: "PUT",
            headers: {
                Authorization: `token ${GITHUB_TOKEN}`,
                Accept: "application/vnd.github.v3+json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        if (!putRes.ok) {
            const errText = await putRes.text();
            console.error(`GitHub API Error (${putRes.status}):`, errText);
            return false;
        }

        return true;
    } catch (error) {
        console.error("Failed to archive to GitHub:", error);
        return false;
    }
}

/**
 * Fetches all archived items for a specific user and type, scanning subfolders recursively.
 * Returns wrapped items with GitHub metadata for restoration/deletion.
 */
export async function fetchArchivedFromGitHub(userId: string, type: ArchiveType): Promise<{ item: Record<string, unknown>; githubMeta: { path: string; sha: string } }[]> {
    if (!GITHUB_TOKEN || !REPO_OWNER || !REPO_NAME) {
        console.warn("GitHub environment variables are missing. Skipping fetch.");
        return [];
    }

    const basePath = `users/${userId}/archived/${type}`;
    const allResults: { item: Record<string, unknown>; githubMeta: { path: string; sha: string } }[] = [];

    async function scanDirectory(path: string) {
        const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;
        try {
            const res = await fetch(url, {
                headers: {
                    Authorization: `token ${GITHUB_TOKEN}`,
                    Accept: "application/vnd.github.v3+json",
                },
                next: { revalidate: 60 }
            });

            if (!res.ok) {
                if (res.status === 404) return;
                console.error(`GitHub API Error scanning ${path}: ${res.statusText}`);
                return;
            }

            const entries = await res.json() as (GitHubFileEntry & { sha: string })[];
            if (!Array.isArray(entries)) return;

            for (const entry of entries) {
                if (entry.type === "dir") {
                    await scanDirectory(entry.path);
                } else if (entry.type === "file" && entry.name.endsWith(".json") && entry.download_url) {
                    const fileRes = await fetch(entry.download_url);
                    if (fileRes.ok) {
                        const content = await fileRes.json();
                        const githubMeta = { path: entry.path, sha: entry.sha };

                        // Flatten if content is an array (from cron batches)
                        if (Array.isArray(content)) {
                            content.forEach(subItem => {
                                allResults.push({ item: subItem as Record<string, unknown>, githubMeta });
                            });
                        } else {
                            allResults.push({ item: content as Record<string, unknown>, githubMeta });
                        }
                    }
                }
            }
        } catch (error) {
            console.error(`Failed to scan GitHub directory ${path}:`, error);
        }
    }

    await scanDirectory(basePath);
    return allResults;
}

/**
 * Deletes a file from GitHub.
 */
export async function deleteFileFromGitHub(path: string, sha: string): Promise<boolean> {
    if (!GITHUB_TOKEN || !REPO_OWNER || !REPO_NAME) return false;

    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;
    try {
        const res = await fetch(url, {
            method: "DELETE",
            headers: {
                Authorization: `token ${GITHUB_TOKEN}`,
                Accept: "application/vnd.github.v3+json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                message: `Delete restored archive: ${path}`,
                sha: sha
            }),
        });

        return res.ok;
    } catch (error) {
        console.error("Failed to delete file from GitHub:", error);
        return false;
    }
}
