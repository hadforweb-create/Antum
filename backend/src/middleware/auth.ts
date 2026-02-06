import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";

export interface AuthPayload {
    userId: string;
    email: string;
    role: string;
}

export interface AuthRequest extends Request {
    user?: AuthPayload;
}

/**
 * Verify JWT token and attach user to request
 */
export function authenticate(
    req: AuthRequest,
    res: Response,
    next: NextFunction
) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
        req.user = payload;
        next();
    } catch (error) {
        return res.status(401).json({ error: "Invalid token" });
    }
}

/**
 * Generate JWT token for user
 */
export function generateToken(payload: AuthPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

/**
 * Optional auth - attaches user if token exists, but doesn't require it
 */
export function optionalAuth(
    req: AuthRequest,
    res: Response,
    next: NextFunction
) {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        try {
            const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
            req.user = payload;
        } catch {
            // Token invalid, but continue without user
        }
    }
    next();
}
