// Upload Service - AWS S3 / Cloudflare R2 Integration
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const s3Client = new S3Client({
    region: process.env.S3_REGION || "us-east-1",
    endpoint: process.env.S3_ENDPOINT, // For R2 compatibility
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: !!process.env.S3_ENDPOINT, // Required for R2
});

const BUCKET = process.env.S3_BUCKET || "nightout-uploads";
const PUBLIC_URL = process.env.S3_PUBLIC_URL || `https://${BUCKET}.s3.amazonaws.com`;

export type MediaType = "IMAGE" | "VIDEO";

export interface UploadResult {
    url: string;
    key: string;
    mediaType: MediaType;
    thumbnailUrl?: string;
}

function getMediaType(mimeType: string): MediaType {
    if (mimeType.startsWith("video/")) return "VIDEO";
    if (mimeType.startsWith("image/")) return "IMAGE";
    throw new Error(`Unsupported media type: ${mimeType}`);
}

function getExtension(mimeType: string): string {
    const mimeToExt: Record<string, string> = {
        "video/mp4": "mp4",
        "video/quicktime": "mov",
        "video/webm": "webm",
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
        "image/gif": "gif",
        "image/heic": "heic",
    };
    return mimeToExt[mimeType] || "bin";
}

export async function uploadFile(
    buffer: Buffer,
    mimeType: string,
    userId: string
): Promise<UploadResult> {
    const mediaType = getMediaType(mimeType);
    const ext = getExtension(mimeType);
    const timestamp = Date.now();
    const uniqueId = uuidv4().slice(0, 8);
    const key = `uploads/${userId}/${timestamp}-${uniqueId}.${ext}`;

    const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        // Make object publicly readable
        ACL: "public-read",
    });

    await s3Client.send(command);

    const url = `${PUBLIC_URL}/${key}`;

    return {
        url,
        key,
        mediaType,
        // Note: For videos, thumbnail generation would need a separate service
        // For now, we return undefined and let the client handle poster frame
        thumbnailUrl: undefined,
    };
}

export async function deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: key,
    });

    await s3Client.send(command);
}

// Validate file size and type
export function validateUpload(
    size: number,
    mimeType: string
): { valid: boolean; error?: string } {
    const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
    const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

    const allowedVideoTypes = ["video/mp4", "video/quicktime", "video/webm"];
    const allowedImageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic"];
    const allAllowed = [...allowedVideoTypes, ...allowedImageTypes];

    if (!allAllowed.includes(mimeType)) {
        return { valid: false, error: `Unsupported file type: ${mimeType}` };
    }

    const isVideo = mimeType.startsWith("video/");
    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;

    if (size > maxSize) {
        const maxMB = maxSize / (1024 * 1024);
        return { valid: false, error: `File too large. Maximum ${maxMB}MB for ${isVideo ? "videos" : "images"}` };
    }

    return { valid: true };
}
