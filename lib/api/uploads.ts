// Upload API - Handle file uploads to the backend
import { getToken } from "@/lib/auth/token";
import * as FileSystem from "expo-file-system";
import { API_URL } from "../config";
import { httpClient } from "./http";

export interface UploadResponse {
    url: string;
    mediaType: "VIDEO" | "IMAGE";
    thumbnailUrl?: string; // Not supported directly in presigned flow without lambda triggers, but keeping interface
}

export interface UploadProgress {
    loaded: number;
    total: number;
    percentage: number;
}

interface PresignedResponse {
    uploadUrl: string;
    publicUrl: string;
    key: string;
}

function getExtFromUri(fileUri: string) {
    const cleanUri = fileUri.split("?")[0];
    const parts = cleanUri.split(".");
    if (parts.length > 1) {
        return parts[parts.length - 1]?.toLowerCase() || "bin";
    }
    return "bin";
}

async function uploadViaLegacy(
    fileUri: string,
    mimeType: string,
    onProgress?: (progress: UploadProgress) => void
): Promise<UploadResponse> {
    const token = await getToken();

    if (!token) {
        throw new Error("Not authenticated");
    }

    const formData = new FormData();
    const fileName = fileUri.split("/").pop() || `upload.${getExtFromUri(fileUri)}`;

    formData.append("file", {
        uri: fileUri,
        type: mimeType,
        name: fileName,
    } as any);

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

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
                    resolve({
                        url: response.url,
                        mediaType: response.mediaType,
                        thumbnailUrl: response.thumbnailUrl,
                    });
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

export async function uploadMedia(
    fileUri: string,
    mimeType: string,
    onProgress?: (progress: UploadProgress) => void
): Promise<UploadResponse> {
    const ext = getExtFromUri(fileUri);

    try {
        // 1. Get Presigned URL (preferred)
        const presigned = await httpClient.get<PresignedResponse>(
            `/api/storage/presign?mime=${encodeURIComponent(mimeType)}&ext=${encodeURIComponent(ext)}`
        );

        // 2. Upload directly to S3/R2
        const uploadResult = await FileSystem.uploadAsync(presigned.uploadUrl, fileUri, {
            httpMethod: "PUT",
            uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
            headers: {
                "Content-Type": mimeType,
            },
        });

        if (uploadResult.status < 200 || uploadResult.status >= 300) {
            throw new Error(`Upload failed with status ${uploadResult.status}`);
        }

        // 3. Return the public URL
        return {
            url: presigned.publicUrl,
            mediaType: mimeType.startsWith("video/") ? "VIDEO" : "IMAGE",
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : "";
        if (message.toLowerCase().includes("storage not configured")) {
            // Local dev fallback to legacy upload route
            return uploadViaLegacy(fileUri, mimeType, onProgress);
        }

        if (__DEV__) {
            console.error("Upload error:", error);
        }
        throw error instanceof Error ? error : new Error("Upload failed");
    }
}
