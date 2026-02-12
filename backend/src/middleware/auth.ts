import { Request, Response, NextFunction } from "express";
import { createRemoteJWKSet, jwtVerify, JWTPayload } from "jose";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || "";

// JWKS endpoint for Supabase JWT verification
const JWKS = createRemoteJWKSet(
    new URL(`${SUPABASE_URL}/auth/v1/.well-known/jwks.json`)
);

export interface SupabaseJWTPayload extends JWTPayload {
    sub: string;
    email?: string;
    role?: string;
    user_metadata?: {
        display_name?: string;
        displayName?: string;
        username?: string;
        role?: string;
        avatar_url?: string;
    };
}

export interface AuthPayload {
    userId: string;
    email: string;
    role: string;
    displayName?: string;
    username?: string;
}

export interface AuthRequest extends Request {
    user?: AuthPayload;
}

/**
 * Verify Supabase JWT token and attach user to request
 */
export async function authenticate(
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
        const { payload } = await jwtVerify(token, JWKS, {
            issuer: `${SUPABASE_URL}/auth/v1`,
        });

        const jwt = payload as SupabaseJWTPayload;

        if (!jwt.sub) {
            return res.status(401).json({ error: "Invalid token: no subject" });
        }

        req.user = {
            userId: jwt.sub,
            email: jwt.email || "",
            role: jwt.user_metadata?.role || "FREELANCER",
            displayName: jwt.user_metadata?.display_name || jwt.user_metadata?.displayName,
            username: jwt.user_metadata?.username,
        };

        next();
    } catch (error) {
        console.error("[AUTH] JWT verification failed:", error);
        return res.status(401).json({ error: "Invalid or expired token" });
    }
}

/**
 * Optional auth - attaches user if token exists, but doesn't require it
 */
export async function optionalAuth(
    req: AuthRequest,
    res: Response,
    next: NextFunction
) {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        try {
            const { payload } = await jwtVerify(token, JWKS, {
                issuer: `${SUPABASE_URL}/auth/v1`,
            });
            const jwt = payload as SupabaseJWTPayload;
            if (jwt.sub) {
                req.user = {
                    userId: jwt.sub,
                    email: jwt.email || "",
                    role: jwt.user_metadata?.role || "FREELANCER",
                    displayName: jwt.user_metadata?.display_name || jwt.user_metadata?.displayName,
                    username: jwt.user_metadata?.username,
                };
            }
        } catch {
            // Token invalid, but continue without user
        }
    }
    next();
}
