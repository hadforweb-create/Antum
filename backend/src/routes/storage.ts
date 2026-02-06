import { logger } from "../utils/logger";
import { Router, Response } from "express";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

// S3/R2 Configuration (supports both S3_* and AWS_* env var names)
const S3_REGION = process.env.S3_REGION || process.env.AWS_REGION || "auto";
const S3_ENDPOINT = process.env.S3_ENDPOINT || process.env.AWS_ENDPOINT;
const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
const S3_BUCKET = process.env.S3_BUCKET || process.env.AWS_BUCKET_NAME || "nightout-uploads";
const S3_PUBLIC_URL = process.env.S3_PUBLIC_URL || process.env.AWS_PUBLIC_URL;

const isConfigured = Boolean(S3_ACCESS_KEY_ID && S3_SECRET_ACCESS_KEY && S3_BUCKET);

const s3Client = new S3Client({
    region: S3_REGION,
    endpoint: S3_ENDPOINT,
    credentials: {
        accessKeyId: S3_ACCESS_KEY_ID || "",
        secretAccessKey: S3_SECRET_ACCESS_KEY || "",
    },
    forcePathStyle: !!S3_ENDPOINT, // Required for R2
});

const presignSchema = z.object({
    mime: z.string().optional(),
    ext: z.string().optional(),
    contentType: z.string().optional(), // legacy support
    fileName: z.string().optional(),
});

function normalizeExt(ext?: string) {
    const cleaned = (ext || "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .slice(0, 10);
    return cleaned || "bin";
}

function resolveContentType(data: z.infer<typeof presignSchema>) {
    const contentType = data.contentType || data.mime;
    if (!contentType) {
        return { error: "mime is required" } as const;
    }

    if (!/^(image|video)\/.+/.test(contentType)) {
        return { error: "Invalid content type" } as const;
    }

    const extFromMime = contentType.split("/")[1] || "bin";
    const ext = normalizeExt(data.ext || extFromMime);

    return { contentType, ext } as const;
}

function getPublicBaseUrl() {
    if (S3_PUBLIC_URL) {
        return S3_PUBLIC_URL.replace(/\/$/, "");
    }

    if (S3_ENDPOINT) {
        const endpoint = S3_ENDPOINT.replace(/\/$/, "");
        return `${endpoint}/${S3_BUCKET}`;
    }

    const awsRegion = S3_REGION && S3_REGION !== "auto" ? S3_REGION : "us-east-1";
    return `https://${S3_BUCKET}.s3.${awsRegion}.amazonaws.com`;
}

async function handlePresign(req: AuthRequest, res: Response) {
    try {
        if (!isConfigured) {
            return res.status(503).json({ error: "Storage not configured" });
        }

        const validation = presignSchema.safeParse(req.query);
        if (!validation.success) {
            return res.status(400).json({ error: validation.error.errors[0].message });
        }

        const resolved = resolveContentType(validation.data);
        if ("error" in resolved) {
            return res.status(400).json({ error: resolved.error });
        }

        const { contentType, ext } = resolved;
        const key = `uploads/${req.user?.userId}/${uuidv4()}.${ext}`;

        const command = new PutObjectCommand({
            Bucket: S3_BUCKET,
            Key: key,
            ContentType: contentType,
        });

        // URL expires in 5 minutes
        const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
        const publicUrl = `${getPublicBaseUrl()}/${key}`;

        return res.json({
            uploadUrl,
            publicUrl,
            key,
        });
    } catch (error) {
        logger.error("Presign Error:", error);
        return res.status(500).json({ error: "Failed to generate upload URL" });
    }
}

// GET /api/storage/presign?mime=...&ext=...
router.get("/presign", authenticate, handlePresign);

// Legacy support: /api/storage/presigned?contentType=...
router.get("/presigned", authenticate, handlePresign);

export default router;
