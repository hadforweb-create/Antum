import { logger } from "../utils/logger";
import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../index";
import { authenticate, optionalAuth, AuthRequest } from "../middleware/auth";
import { getBlockedUserIds } from "../utils/blocking";

const router = Router();

// ============================================
// VALIDATION SCHEMAS
// ============================================

const createServiceSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters").max(100),
    description: z.string().min(10, "Description must be at least 10 characters").max(2000),
    price: z.number().int().min(100, "Minimum price is $1.00").max(100000000), // Max $1M
    currency: z.string().length(3).default("USD"),
    category: z.string().min(1, "Category is required").max(50),
    deliveryDays: z.number().int().min(1).max(365).default(7),
    imageUrl: z.string().url().optional().nullable(),
    galleryUrls: z.array(z.string().url()).max(10).optional(),
});

const updateServiceSchema = z.object({
    title: z.string().min(3).max(100).optional(),
    description: z.string().min(10).max(2000).optional(),
    price: z.number().int().min(100).max(100000000).optional(),
    currency: z.string().length(3).optional(),
    category: z.string().min(1).max(50).optional(),
    deliveryDays: z.number().int().min(1).max(365).optional(),
    imageUrl: z.string().url().optional().nullable(),
    galleryUrls: z.array(z.string().url()).max(10).optional(),
    isActive: z.boolean().optional(),
});

const createTierSchema = z.object({
    name: z.enum(["Basic", "Standard", "Premium"]),
    description: z.string().min(1).max(500),
    price: z.number().int().min(100).max(100000000),
    deliveryDays: z.number().int().min(1).max(365),
    revisions: z.number().int().min(0).max(99).default(1),
    features: z.array(z.string().max(200)).max(20).optional(),
});

const updateTierSchema = z.object({
    name: z.enum(["Basic", "Standard", "Premium"]).optional(),
    description: z.string().min(1).max(500).optional(),
    price: z.number().int().min(100).max(100000000).optional(),
    deliveryDays: z.number().int().min(1).max(365).optional(),
    revisions: z.number().int().min(0).max(99).optional(),
    features: z.array(z.string().max(200)).max(20).optional(),
    isActive: z.boolean().optional(),
});

const listServicesSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    category: z.string().optional(),
    userId: z.string().optional(),
    search: z.string().optional(),
    minPrice: z.coerce.number().int().min(0).optional(),
    maxPrice: z.coerce.number().int().optional(),
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatServiceResponse(service: any) {
    return {
        id: service.id,
        title: service.title,
        description: service.description,
        price: service.price,
        priceFormatted: `$${(service.price / 100).toFixed(2)}`,
        currency: service.currency,
        category: service.category,
        deliveryDays: service.deliveryDays,
        imageUrl: service.imageUrl,
        galleryUrls: service.galleryUrls ?? [],
        viewCount: service.viewCount ?? 0,
        isActive: service.isActive,
        createdAt: service.createdAt.toISOString(),
        updatedAt: service.updatedAt.toISOString(),
        tiers: (service.tiers ?? []).map((t: any) => ({
            id: t.id,
            name: t.name,
            description: t.description,
            price: t.price,
            priceFormatted: `$${(t.price / 100).toFixed(2)}`,
            deliveryDays: t.deliveryDays,
            revisions: t.revisions,
            features: t.features ?? [],
            isActive: t.isActive,
        })),
        user: service.user ? {
            id: service.user.id,
            displayName: service.user.displayName,
            name: service.user.displayName,  // backward compat
            email: service.user.email,
            avatarUrl: service.user.avatarUrl,
            location: service.user.location,
        } : null,
    };
}

// ============================================
// ROUTES
// ============================================

/**
 * GET /api/services
 * List all active services (public, filterable)
 */
router.get("/", optionalAuth, async (req: AuthRequest, res: Response) => {
    try {
        const validation = listServicesSchema.safeParse(req.query);
        if (!validation.success) {
            return res.status(400).json({
                error: "Invalid query parameters",
                details: validation.error.flatten().fieldErrors,
            });
        }

        const { page, limit, category, userId, search, minPrice, maxPrice } = validation.data;

        // Build where clause
        const where: any = {
            isActive: true,
        };

        if (category) {
            where.category = category;
        }

        if (userId) {
            where.userId = userId;
        }

        if (search) {
            where.OR = [
                { title: { contains: search } },
                { description: { contains: search } },
            ];
        }

        if (minPrice !== undefined || maxPrice !== undefined) {
            where.price = {};
            if (minPrice !== undefined) where.price.gte = minPrice;
            if (maxPrice !== undefined) where.price.lte = maxPrice;
        }

        const blockedIds = req.user ? await getBlockedUserIds(prisma, req.user.userId) : [];
        if (blockedIds.length) {
            if (typeof where.userId === "string") {
                if (blockedIds.includes(where.userId)) {
                    return res.json({
                        services: [],
                        pagination: {
                            page,
                            limit,
                            total: 0,
                            totalPages: 0,
                        },
                    });
                }
            } else if (!where.userId) {
                where.userId = { notIn: blockedIds };
            }
        }

        // Get total count
        const total = await prisma.service.count({ where });

        // Get services
        const services = await prisma.service.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        displayName: true,
                        email: true,
                        avatarUrl: true,
                        location: true,
                    },
                },
                tiers: {
                    where: { isActive: true },
                    orderBy: { price: "asc" },
                },
            },
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        });

        return res.json({
            services: services.map(formatServiceResponse),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        logger.error("Error listing services:", error);
        return res.status(500).json({ error: "Failed to list services" });
    }
});

/**
 * GET /api/services/categories
 * Get list of available categories
 */
router.get("/categories", async (_req, res: Response) => {
    try {
        const categories = await prisma.service.groupBy({
            by: ["category"],
            _count: { category: true },
            where: { isActive: true },
            orderBy: { _count: { category: "desc" } },
        });

        return res.json({
            categories: categories.map((c) => ({
                name: c.category,
                count: c._count.category,
            })),
        });
    } catch (error) {
        logger.error("Error getting categories:", error);
        return res.status(500).json({ error: "Failed to get categories" });
    }
});

/**
 * GET /api/services/:id
 * Get a single service by ID (public) — also increments viewCount
 */
router.get("/:id", async (req, res: Response) => {
    try {
        const { id } = req.params;

        const service = await prisma.service.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        displayName: true,
                        email: true,
                        avatarUrl: true,
                        location: true,
                        bio: true,
                        completedOrderCount: true,
                        isPro: true,
                        _count: {
                            select: {
                                services: { where: { isActive: true } },
                                reels: true,
                            },
                        },
                    },
                },
                tiers: {
                    where: { isActive: true },
                    orderBy: { price: "asc" },
                },
            },
        });

        if (!service) {
            return res.status(404).json({ error: "Service not found" });
        }

        // Fire-and-forget viewCount increment
        prisma.service.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

        const response = formatServiceResponse(service);
        // Add user stats
        if (service.user) {
            (response.user as any).servicesCount = service.user._count.services;
            (response.user as any).reelsCount = service.user._count.reels;
            (response.user as any).completedOrderCount = service.user.completedOrderCount;
            (response.user as any).isPro = service.user.isPro;
        }

        return res.json(response);
    } catch (error) {
        logger.error("Error getting service:", error);
        return res.status(500).json({ error: "Failed to get service" });
    }
});

/**
 * POST /api/services
 * Create a new service (freelancers only)
 */
router.post("/", authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const currentUserId = req.user!.userId;

        // Check if user is a freelancer
        if (req.user!.role !== "FREELANCER") {
            return res.status(403).json({ error: "Only freelancers can create services" });
        }

        const validation = createServiceSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                error: "Invalid request",
                details: validation.error.flatten().fieldErrors,
            });
        }

        const { title, description, price, currency, category, deliveryDays, imageUrl } = validation.data;

        const { galleryUrls } = validation.data;

        const service = await prisma.service.create({
            data: {
                userId: currentUserId,
                title,
                description,
                price,
                currency: currency || "USD",
                category,
                deliveryDays: deliveryDays || 7,
                imageUrl: imageUrl || null,
                galleryUrls: galleryUrls || [],
            },
            include: {
                user: {
                    select: {
                        id: true,
                        displayName: true,
                        email: true,
                        avatarUrl: true,
                        location: true,
                    },
                },
                tiers: { where: { isActive: true }, orderBy: { price: "asc" } },
            },
        });

        return res.status(201).json(formatServiceResponse(service));
    } catch (error) {
        logger.error("Error creating service:", error);
        return res.status(500).json({ error: "Failed to create service" });
    }
});

/**
 * PATCH /api/services/:id
 * Update a service (owner only)
 */
router.patch("/:id", authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const currentUserId = req.user!.userId;

        // Check ownership
        const existing = await prisma.service.findUnique({
            where: { id },
            select: { userId: true },
        });

        if (!existing) {
            return res.status(404).json({ error: "Service not found" });
        }

        if (existing.userId !== currentUserId) {
            return res.status(403).json({ error: "You can only edit your own services" });
        }

        const validation = updateServiceSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                error: "Invalid request",
                details: validation.error.flatten().fieldErrors,
            });
        }

        const service = await prisma.service.update({
            where: { id },
            data: validation.data,
            include: {
                user: {
                    select: {
                        id: true,
                        displayName: true,
                        email: true,
                        avatarUrl: true,
                        location: true,
                    },
                },
            },
        });

        return res.json(formatServiceResponse(service));
    } catch (error) {
        logger.error("Error updating service:", error);
        return res.status(500).json({ error: "Failed to update service" });
    }
});

/**
 * DELETE /api/services/:id
 * Delete a service (owner only) - soft delete by setting isActive=false
 */
router.delete("/:id", authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const currentUserId = req.user!.userId;

        // Check ownership
        const existing = await prisma.service.findUnique({
            where: { id },
            select: { userId: true },
        });

        if (!existing) {
            return res.status(404).json({ error: "Service not found" });
        }

        if (existing.userId !== currentUserId) {
            return res.status(403).json({ error: "You can only delete your own services" });
        }

        // Soft delete
        await prisma.service.update({
            where: { id },
            data: { isActive: false },
        });

        return res.json({ success: true, message: "Service deleted" });
    } catch (error) {
        logger.error("Error deleting service:", error);
        return res.status(500).json({ error: "Failed to delete service" });
    }
});

/**
 * GET /api/services/user/me
 * Get current user's services (including inactive)
 */
router.get("/user/me", authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const currentUserId = req.user!.userId;

        const services = await prisma.service.findMany({
            where: { userId: currentUserId },
            include: {
                user: {
                    select: {
                        id: true,
                        displayName: true,
                        email: true,
                        avatarUrl: true,
                        location: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return res.json({
            services: services.map(formatServiceResponse),
        });
    } catch (error) {
        logger.error("Error getting user services:", error);
        return res.status(500).json({ error: "Failed to get services" });
    }
});

// ============================================
// TIER ROUTES
// ============================================

/**
 * POST /api/services/:id/tiers
 * Add a pricing tier (owner only)
 */
router.post("/:id/tiers", authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const currentUserId = req.user!.userId;

        const service = await prisma.service.findUnique({ where: { id }, select: { userId: true } });
        if (!service) return res.status(404).json({ error: "Service not found" });
        if (service.userId !== currentUserId) return res.status(403).json({ error: "Not authorized" });

        const validation = createTierSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: "Invalid request", details: validation.error.flatten().fieldErrors });
        }

        const { name, description, price, deliveryDays, revisions, features } = validation.data;

        const tier = await prisma.serviceTier.create({
            data: { serviceId: id, name, description, price, deliveryDays, revisions: revisions ?? 1, features: features || [] },
        });

        return res.status(201).json({
            ...tier,
            priceFormatted: `$${(tier.price / 100).toFixed(2)}`,
        });
    } catch (error) {
        logger.error("Error creating tier:", error);
        return res.status(500).json({ error: "Failed to create tier" });
    }
});

/**
 * PATCH /api/services/:id/tiers/:tid
 * Update a pricing tier (owner only)
 */
router.patch("/:id/tiers/:tid", authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { id, tid } = req.params;
        const currentUserId = req.user!.userId;

        const service = await prisma.service.findUnique({ where: { id }, select: { userId: true } });
        if (!service) return res.status(404).json({ error: "Service not found" });
        if (service.userId !== currentUserId) return res.status(403).json({ error: "Not authorized" });

        const validation = updateTierSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: "Invalid request", details: validation.error.flatten().fieldErrors });
        }

        const tier = await prisma.serviceTier.update({
            where: { id: tid },
            data: validation.data,
        });

        return res.json({ ...tier, priceFormatted: `$${(tier.price / 100).toFixed(2)}` });
    } catch (error) {
        logger.error("Error updating tier:", error);
        return res.status(500).json({ error: "Failed to update tier" });
    }
});

/**
 * DELETE /api/services/:id/tiers/:tid
 * Deactivate a tier (soft delete)
 */
router.delete("/:id/tiers/:tid", authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { id, tid } = req.params;
        const currentUserId = req.user!.userId;

        const service = await prisma.service.findUnique({ where: { id }, select: { userId: true } });
        if (!service) return res.status(404).json({ error: "Service not found" });
        if (service.userId !== currentUserId) return res.status(403).json({ error: "Not authorized" });

        await prisma.serviceTier.update({ where: { id: tid }, data: { isActive: false } });
        return res.json({ success: true });
    } catch (error) {
        logger.error("Error deleting tier:", error);
        return res.status(500).json({ error: "Failed to delete tier" });
    }
});

// ============================================
// REVIEWS SUB-ROUTE
// ============================================

/**
 * GET /api/services/:id/reviews
 * Get reviews for a service with average rating
 */
router.get("/:id/reviews", async (req, res: Response) => {
    try {
        const { id } = req.params;
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(50, parseInt(req.query.limit as string) || 10);

        const where = { serviceId: id };

        const [reviews, total] = await Promise.all([
            prisma.review.findMany({
                where,
                include: {
                    reviewer: { select: { id: true, displayName: true, avatarUrl: true } },
                },
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.review.count({ where }),
        ]);

        let avgRating: number | null = null;
        if (total > 0) {
            const agg = await prisma.review.aggregate({ where, _avg: { rating: true } });
            avgRating = agg._avg.rating;
        }

        return res.json({
            reviews: reviews.map((r) => ({
                id: r.id,
                rating: r.rating,
                body: r.body,
                mediaUrls: r.mediaUrls,
                reply: r.reply,
                repliedAt: r.repliedAt?.toISOString() ?? null,
                createdAt: r.createdAt.toISOString(),
                reviewer: r.reviewer,
            })),
            avgRating,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        logger.error("Error getting service reviews:", error);
        return res.status(500).json({ error: "Failed to get reviews" });
    }
});

export default router;
