// Upload API - Handle file uploads to the backend
import { getToken } from "./token";
import { API_URL } from "../config";

export interface UploadResponse {
    url: string;
    mediaType: "VIDEO" | "IMAGE";
    thumbnailUrl?: string;
}

export interface UploadProgress {
    loaded: number;
    total: number;
    percentage: number;
}

export async function uploadMedia(
    fileUri: string,
    mimeType: string,
    onProgress?: (progress: UploadProgress) => void
): Promise<UploadResponse> {
    const token = await getToken();

    if (!token) {
        throw new Error("Not authenticated");
    }

    // Create form data
    const formData = new FormData();

    // Get file extension from uri
    const fileName = fileUri.split("/").pop() || "file";

    formData.append("file", {
        uri: fileUri,
        type: mimeType,
        name: fileName,
    } as any);

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Track upload progress
        xhr.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable && onProgress) {
                onProgress({
                    loaded: event.loaded,
                    total: event.total,
                    percentage: Math.round((event.loaded / event.total) * 100),
                });
            }
        });

        xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    resolve(response);
                } catch {
                    reject(new Error("Invalid response from server"));
                }
            } else {
                try {
                    const error = JSON.parse(xhr.responseText);
                    reject(new Error(error.error || `Upload failed: ${xhr.status}`));
                } catch {
                    reject(new Error(`Upload failed: ${xhr.status}`));
                }
            }
        });

        xhr.addEventListener("error", () => {
            reject(new Error("Network error during upload"));
        });

        xhr.addEventListener("abort", () => {
            reject(new Error("Upload cancelled"));
        });

        xhr.open("POST", `${API_URL}/api/uploads`);
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.send(formData);
    });
}
