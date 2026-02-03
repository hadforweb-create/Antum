// Upload API - Handle file uploads to the backend
import { getToken } from "@/lib/auth/token";
import { API_URL } from "../config";
import * as FileSystem from "expo-file-system";
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

export async function uploadMedia(
    fileUri: string,
    mimeType: string,
    onProgress?: (progress: UploadProgress) => void
): Promise<UploadResponse> {
    try {
        // 1. Get Presigned URL
        const presigned = await httpClient.get<PresignedResponse>(
            `/api/storage/presigned?contentType=${encodeURIComponent(mimeType)}`
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
        console.error("Upload error:", error);
        throw error instanceof Error ? error : new Error("Upload failed");
    }
}

