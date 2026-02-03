import { Router, Request, Response } from "express";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

// Configure S3/R2 Client
// For R2, endpoint should be provided. For AWS, region is enough.
const s3Client = new S3Client({
    region: process.env.AWS_REGION || "auto",
    endpoint: process.env.AWS_ENDPOINT,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME || "nightout-uploads";

const signUrlSchema = z.object({
    contentType: z.string().regex(/^(image|video)\/.+/, "Invalid content type"),
    fileName: z.string().optional(),
});

// GET /api/storage/presigned
// Generate a presigned URL for direct client upload
router.get("/presigned", authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const validation = signUrlSchema.safeParse(req.query);

        if (!validation.success) {
            return res.status(400).json({ error: validation.error.errors[0].message });
        }

        const { contentType, fileName } = validation.data;
        const ext = contentType.split("/")[1];
        const key = `uploads/${req.user?.userId}/${uuidv4()}.${ext}`;

        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            ContentType: contentType,
        });

        // URL expires in 5 minutes
        const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

        // Public access URL (assuming bucket is public or behind CDN)
        // If AWS_PUBLIC_URL is set (e.g. Cloudflare domain), use it
        const baseUrl = process.env.AWS_PUBLIC_URL || process.env.AWS_ENDPOINT || `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`;
        const publicUrl = `${baseUrl}/${key}`;

        res.json({
            uploadUrl,
            publicUrl,
            key,
            headers: {
                "Content-Type": contentType,
            },
        });
    } catch (error) {
        console.error("Presign Error:", error);
        res.status(500).json({ error: "Failed to generate upload URL" });
    }
});

export default router;
