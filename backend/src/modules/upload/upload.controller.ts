// Upload Controller - Handle file upload requests
import { Request, Response, NextFunction } from "express";
import { uploadFile, validateUpload } from "./upload.service.js";
import { AuthRequest } from "../../middleware/auth.js";

export async function handleUpload(
    req: AuthRequest,
    res: Response,
    next: NextFunction
) {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file provided" });
        }

        const { buffer, mimetype, size } = req.file;
        const userId = req.user!.id;

        // Validate file
        const validation = validateUpload(size, mimetype);
        if (!validation.valid) {
            return res.status(400).json({ error: validation.error });
        }

        // Upload to S3
        const result = await uploadFile(buffer, mimetype, userId);

        res.status(201).json({
            url: result.url,
            mediaType: result.mediaType,
            thumbnailUrl: result.thumbnailUrl,
        });
    } catch (error) {
        next(error);
    }
}
