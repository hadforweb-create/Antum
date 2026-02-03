import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../index";
import { authenticate, AuthRequest } from "../middleware/auth";

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
});

const updateServiceSchema = z.object({
    title: z.string().min(3).max(100).optional(),
    description: z.string().min(10).max(2000).optional(),
    price: z.number().int().min(100).max(100000000).optional(),
    currency: z.string().length(3).optional(),
    category: z.string().min(1).max(50).optional(),
    deliveryDays: z.number().int().min(1).max(365).optional(),
    imageUrl: z.string().url().optional().nullable(),
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
        isActive: service.isActive,
        createdAt: service.createdAt.toISOString(),
        updatedAt: service.updatedAt.toISOString(),
        user: service.user ? {
            id: service.user.id,
            name: service.user.name,
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
router.get("/", async (req, res: Response) => {
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

        // Get total count
        const total = await prisma.service.count({ where });

        // Get services
        const services = await prisma.service.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatarUrl: true,
                        location: true,
                    },
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
        console.error("Error listing services:", error);
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
        console.error("Error getting categories:", error);
        return res.status(500).json({ error: "Failed to get categories" });
    }
});

/**
 * GET /api/services/:id
 * Get a single service by ID (public)
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
                        name: true,
                        email: true,
                        avatarUrl: true,
                        location: true,
                        bio: true,
                        _count: {
                            select: {
                                services: { where: { isActive: true } },
                                reels: true,
                            },
                        },
                    },
                },
            },
        });

        if (!service) {
            return res.status(404).json({ error: "Service not found" });
        }

        const response = formatServiceResponse(service);
        // Add user stats
        if (service.user) {
            (response.user as any).servicesCount = service.user._count.services;
            (response.user as any).reelsCount = service.user._count.reels;
        }

        return res.json(response);
    } catch (error) {
        console.error("Error getting service:", error);
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
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatarUrl: true,
                        location: true,
                    },
                },
            },
        });

        return res.status(201).json(formatServiceResponse(service));
    } catch (error) {
        console.error("Error creating service:", error);
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
                        name: true,
                        email: true,
                        avatarUrl: true,
                        location: true,
                    },
                },
            },
        });

        return res.json(formatServiceResponse(service));
    } catch (error) {
        console.error("Error updating service:", error);
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
        console.error("Error deleting service:", error);
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
                        name: true,
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
        console.error("Error getting user services:", error);
        return res.status(500).json({ error: "Failed to get services" });
    }
});

export default router;
