import { PrismaClient } from "@prisma/client";

export async function getBlockedUserIds(prisma: PrismaClient, userId: string): Promise<string[]> {
    const blocks = await prisma.block.findMany({
        where: {
            OR: [{ blockerId: userId }, { blockedId: userId }],
        },
        select: {
            blockerId: true,
            blockedId: true,
        },
    });

    const ids = new Set<string>();
    for (const block of blocks) {
        if (block.blockerId === userId) {
            ids.add(block.blockedId);
        }
        if (block.blockedId === userId) {
            ids.add(block.blockerId);
        }
    }

    return Array.from(ids);
}

export async function isBlockedBetween(
    prisma: PrismaClient,
    userA: string,
    userB: string
): Promise<boolean> {
    const block = await prisma.block.findFirst({
        where: {
            OR: [
                { blockerId: userA, blockedId: userB },
                { blockerId: userB, blockedId: userA },
            ],
        },
        select: { id: true },
    });

    return !!block;
}
