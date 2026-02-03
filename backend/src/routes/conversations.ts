import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../index";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

// ============================================
// VALIDATION SCHEMAS
// ============================================

const createConversationSchema = z.object({
    participantId: z.string().min(1, "Participant ID is required"),
});

const sendMessageSchema = z.object({
    text: z.string().min(1, "Message cannot be empty").max(2000, "Message too long"),
});

const paginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50),
});

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if user is a participant in a conversation
 */
async function isParticipant(conversationId: string, userId: string): Promise<boolean> {
    const participant = await prisma.conversationParticipant.findUnique({
        where: {
            conversationId_userId: {
                conversationId,
                userId,
            },
        },
    });
    return !!participant;
}

/**
 * Get user display info for responses
 */
function formatUserForResponse(user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
}) {
    return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
    };
}

// ============================================
// ROUTES
// ============================================

/**
 * POST /api/conversations
 * Create a new conversation between current user and another user
 * Or return existing conversation if one already exists
 */
router.post("/", authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const validation = createConversationSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                error: "Invalid request",
                details: validation.error.flatten().fieldErrors,
            });
        }

        const { participantId } = validation.data;
        const currentUserId = req.user!.userId;

        // Can't create conversation with yourself
        if (participantId === currentUserId) {
            return res.status(400).json({ error: "Cannot create conversation with yourself" });
        }

        // Check if other user exists
        const otherUser = await prisma.user.findUnique({
            where: { id: participantId },
        });

        if (!otherUser) {
            return res.status(404).json({ error: "User not found" });
        }

        // Check if conversation already exists between these two users
        const existingConversation = await prisma.conversation.findFirst({
            where: {
                AND: [
                    { participants: { some: { userId: currentUserId } } },
                    { participants: { some: { userId: participantId } } },
                ],
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                name: true,
                                role: true,
                            },
                        },
                    },
                },
                messages: {
                    orderBy: { createdAt: "desc" },
                    take: 1,
                    include: {
                        sender: {
                            select: {
                                id: true,
                                email: true,
                                name: true,
                                role: true,
                            },
                        },
                    },
                },
            },
        });

        if (existingConversation) {
            // Return existing conversation
            const formatted = {
                id: existingConversation.id,
                createdAt: existingConversation.createdAt.toISOString(),
                updatedAt: existingConversation.updatedAt.toISOString(),
                participants: existingConversation.participants.map((p) => ({
                    id: p.id,
                    userId: p.user.id,
                    user: formatUserForResponse(p.user),
                    joinedAt: p.joinedAt.toISOString(),
                })),
                lastMessage: existingConversation.messages[0]
                    ? {
                          id: existingConversation.messages[0].id,
                          text: existingConversation.messages[0].text,
                          senderId: existingConversation.messages[0].senderId,
                          createdAt: existingConversation.messages[0].createdAt.toISOString(),
                          sender: formatUserForResponse(existingConversation.messages[0].sender),
                      }
                    : null,
            };

            return res.status(200).json(formatted);
        }

        // Create new conversation with both participants
        const conversation = await prisma.conversation.create({
            data: {
                participants: {
                    create: [{ userId: currentUserId }, { userId: participantId }],
                },
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                name: true,
                                role: true,
                            },
                        },
                    },
                },
            },
        });

        const formatted = {
            id: conversation.id,
            createdAt: conversation.createdAt.toISOString(),
            updatedAt: conversation.updatedAt.toISOString(),
            participants: conversation.participants.map((p) => ({
                id: p.id,
                userId: p.user.id,
                user: formatUserForResponse(p.user),
                joinedAt: p.joinedAt.toISOString(),
            })),
            lastMessage: null,
        };

        return res.status(201).json(formatted);
    } catch (error) {
        console.error("Error creating conversation:", error);
        return res.status(500).json({ error: "Failed to create conversation" });
    }
});

/**
 * GET /api/conversations
 * List all conversations for the current user
 */
router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const currentUserId = req.user!.userId;

        const conversations = await prisma.conversation.findMany({
            where: {
                participants: {
                    some: { userId: currentUserId },
                },
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                name: true,
                                role: true,
                            },
                        },
                    },
                },
                messages: {
                    orderBy: { createdAt: "desc" },
                    take: 1,
                    include: {
                        sender: {
                            select: {
                                id: true,
                                email: true,
                                name: true,
                                role: true,
                            },
                        },
                    },
                },
            },
            orderBy: { updatedAt: "desc" },
        });

        const formatted = conversations.map((conv) => ({
            id: conv.id,
            createdAt: conv.createdAt.toISOString(),
            updatedAt: conv.updatedAt.toISOString(),
            participants: conv.participants.map((p) => ({
                id: p.id,
                userId: p.user.id,
                user: formatUserForResponse(p.user),
                joinedAt: p.joinedAt.toISOString(),
            })),
            lastMessage: conv.messages[0]
                ? {
                      id: conv.messages[0].id,
                      text: conv.messages[0].text,
                      senderId: conv.messages[0].senderId,
                      createdAt: conv.messages[0].createdAt.toISOString(),
                      sender: formatUserForResponse(conv.messages[0].sender),
                  }
                : null,
        }));

        return res.json({ conversations: formatted });
    } catch (error) {
        console.error("Error listing conversations:", error);
        return res.status(500).json({ error: "Failed to list conversations" });
    }
});

/**
 * GET /api/conversations/:id
 * Get a single conversation's details
 * Only accessible by participants
 */
router.get("/:id", authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const currentUserId = req.user!.userId;

        // Check ownership
        if (!(await isParticipant(id, currentUserId))) {
            return res.status(403).json({ error: "Access denied" });
        }

        const conversation = await prisma.conversation.findUnique({
            where: { id },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                name: true,
                                role: true,
                            },
                        },
                    },
                },
                messages: {
                    orderBy: { createdAt: "desc" },
                    take: 1,
                    include: {
                        sender: {
                            select: {
                                id: true,
                                email: true,
                                name: true,
                                role: true,
                            },
                        },
                    },
                },
            },
        });

        if (!conversation) {
            return res.status(404).json({ error: "Conversation not found" });
        }

        const formatted = {
            id: conversation.id,
            createdAt: conversation.createdAt.toISOString(),
            updatedAt: conversation.updatedAt.toISOString(),
            participants: conversation.participants.map((p) => ({
                id: p.id,
                userId: p.user.id,
                user: formatUserForResponse(p.user),
                joinedAt: p.joinedAt.toISOString(),
            })),
            lastMessage: conversation.messages[0]
                ? {
                      id: conversation.messages[0].id,
                      text: conversation.messages[0].text,
                      senderId: conversation.messages[0].senderId,
                      createdAt: conversation.messages[0].createdAt.toISOString(),
                      sender: formatUserForResponse(conversation.messages[0].sender),
                  }
                : null,
        };

        return res.json(formatted);
    } catch (error) {
        console.error("Error getting conversation:", error);
        return res.status(500).json({ error: "Failed to get conversation" });
    }
});

/**
 * GET /api/conversations/:id/messages
 * Get messages for a conversation (paginated, newest first)
 * Only accessible by participants
 */
router.get("/:id/messages", authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const currentUserId = req.user!.userId;

        // Validate pagination
        const paginationResult = paginationSchema.safeParse(req.query);
        if (!paginationResult.success) {
            return res.status(400).json({
                error: "Invalid pagination parameters",
                details: paginationResult.error.flatten().fieldErrors,
            });
        }

        const { page, limit } = paginationResult.data;

        // Check ownership
        if (!(await isParticipant(id, currentUserId))) {
            return res.status(403).json({ error: "Access denied" });
        }

        // Check conversation exists
        const conversation = await prisma.conversation.findUnique({
            where: { id },
        });

        if (!conversation) {
            return res.status(404).json({ error: "Conversation not found" });
        }

        // Get total count for pagination
        const total = await prisma.message.count({
            where: { conversationId: id },
        });

        // Get messages
        const messages = await prisma.message.findMany({
            where: { conversationId: id },
            include: {
                sender: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        role: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        });

        const formatted = messages.map((msg) => ({
            id: msg.id,
            conversationId: msg.conversationId,
            senderId: msg.senderId,
            text: msg.text,
            createdAt: msg.createdAt.toISOString(),
            sender: formatUserForResponse(msg.sender),
        }));

        return res.json({
            messages: formatted,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Error getting messages:", error);
        return res.status(500).json({ error: "Failed to get messages" });
    }
});

/**
 * POST /api/conversations/:id/messages
 * Send a message to a conversation
 * Only accessible by participants
 */
router.post("/:id/messages", authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const currentUserId = req.user!.userId;

        // Validate body
        const validation = sendMessageSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                error: "Invalid request",
                details: validation.error.flatten().fieldErrors,
            });
        }

        const { text } = validation.data;

        // Check ownership
        if (!(await isParticipant(id, currentUserId))) {
            return res.status(403).json({ error: "Access denied" });
        }

        // Check conversation exists
        const conversation = await prisma.conversation.findUnique({
            where: { id },
        });

        if (!conversation) {
            return res.status(404).json({ error: "Conversation not found" });
        }

        // Create message and update conversation timestamp in a transaction
        const [message] = await prisma.$transaction([
            prisma.message.create({
                data: {
                    conversationId: id,
                    senderId: currentUserId,
                    text: text.trim(),
                },
                include: {
                    sender: {
                        select: {
                            id: true,
                            email: true,
                            name: true,
                            role: true,
                        },
                    },
                },
            }),
            prisma.conversation.update({
                where: { id },
                data: { updatedAt: new Date() },
            }),
        ]);

        const formatted = {
            id: message.id,
            conversationId: message.conversationId,
            senderId: message.senderId,
            text: message.text,
            createdAt: message.createdAt.toISOString(),
            sender: formatUserForResponse(message.sender),
        };

        return res.status(201).json(formatted);
    } catch (error) {
        console.error("Error sending message:", error);
        return res.status(500).json({ error: "Failed to send message" });
    }
});

export default router;
