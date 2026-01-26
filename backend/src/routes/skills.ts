import { Router } from "express";
import { prisma } from "../index";

const router = Router();

/**
 * GET /api/skills
 * List all available skills
 */
router.get("/", async (_req, res) => {
    try {
        const skills = await prisma.skill.findMany({
            orderBy: { name: "asc" },
            select: {
                id: true,
                name: true,
                slug: true,
            },
        });

        res.json(skills);
    } catch (error) {
        console.error("Get skills error:", error);
        res.status(500).json({ error: "Failed to get skills" });
    }
});

/**
 * POST /api/skills/seed
 * Seed initial skills (dev only)
 */
router.post("/seed", async (_req, res) => {
    if (process.env.NODE_ENV === "production") {
        return res.status(403).json({ error: "Not available in production" });
    }

    const defaultSkills = [
        "Photography",
        "Videography",
        "Graphic Design",
        "Web Development",
        "Mobile Development",
        "UI/UX Design",
        "Illustration",
        "Animation",
        "Music Production",
        "Voice Over",
        "Writing",
        "Translation",
        "Marketing",
        "Social Media",
        "Video Editing",
        "3D Modeling",
        "Game Development",
        "Data Science",
        "Machine Learning",
        "DevOps",
    ];

    try {
        const skills = await Promise.all(
            defaultSkills.map((name) =>
                prisma.skill.upsert({
                    where: { name },
                    update: {},
                    create: {
                        name,
                        slug: name.toLowerCase().replace(/\s+/g, "-"),
                    },
                })
            )
        );

        res.json({ created: skills.length, skills });
    } catch (error) {
        console.error("Seed skills error:", error);
        res.status(500).json({ error: "Failed to seed skills" });
    }
});

export default router;
