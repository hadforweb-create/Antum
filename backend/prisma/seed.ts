/**
 * Database Seed Script
 * Creates demo data for testing the app
 * 
 * Usage: npm run prisma:seed
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Starting database seed...\n");

    // Clean existing data (optional - comment out if you want to preserve data)
    console.log("🧹 Cleaning existing data...");
    await prisma.message.deleteMany();
    await prisma.conversationParticipant.deleteMany();
    await prisma.conversation.deleteMany();
    await prisma.shortlist.deleteMany();
    await prisma.service.deleteMany();
    await prisma.reel.deleteMany();
    await prisma.userSkill.deleteMany();
    await prisma.skill.deleteMany();
    await prisma.user.deleteMany();

    // Create skills
    console.log("📚 Creating skills...");
    const skills = await Promise.all([
        prisma.skill.create({ data: { name: "Photography" } }),
        prisma.skill.create({ data: { name: "Videography" } }),
        prisma.skill.create({ data: { name: "DJ" } }),
        prisma.skill.create({ data: { name: "Event Planning" } }),
        prisma.skill.create({ data: { name: "Catering" } }),
        prisma.skill.create({ data: { name: "Bartending" } }),
        prisma.skill.create({ data: { name: "Security" } }),
        prisma.skill.create({ data: { name: "Hair & Makeup" } }),
    ]);
    console.log(`  Created ${skills.length} skills`);

    // Create demo users
    console.log("👥 Creating demo users...");
    const passwordHash = await bcrypt.hash("password123", 10);

    const freelancer = await prisma.user.create({
        data: {
            email: "freelancer@demo.com",
            passwordHash,
            name: "Alex Martinez",
            bio: "Professional event photographer with 8+ years of experience. Specializing in nightlife, concerts, and private events.",
            location: "Los Angeles, CA",
            role: "FREELANCER",
            avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
        },
    });

    const freelancer2 = await prisma.user.create({
        data: {
            email: "dj@demo.com",
            passwordHash,
            name: "Sarah Chen",
            bio: "DJ and music producer. Playing at clubs and festivals across the west coast. Available for private events.",
            location: "San Francisco, CA",
            role: "FREELANCER",
            avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
        },
    });

    const employer = await prisma.user.create({
        data: {
            email: "employer@demo.com",
            passwordHash,
            name: "Jordan Blake",
            bio: "Event manager at Skyline Events. Always looking for talented professionals to work with.",
            location: "New York, NY",
            role: "EMPLOYER",
            avatarUrl: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=200&h=200&fit=crop",
        },
    });

    console.log(`  Created users: ${freelancer.name}, ${freelancer2.name}, ${employer.name}`);

    // Assign skills to freelancers
    console.log("🔗 Assigning skills...");
    await prisma.userSkill.createMany({
        data: [
            { userId: freelancer.id, skillId: skills[0].id }, // Photography
            { userId: freelancer.id, skillId: skills[1].id }, // Videography
            { userId: freelancer2.id, skillId: skills[2].id }, // DJ
            { userId: freelancer2.id, skillId: skills[3].id }, // Event Planning
        ],
    });

    // Create reels
    console.log("🎬 Creating reels...");
    const reels = await Promise.all([
        prisma.reel.create({
            data: {
                userId: freelancer.id,
                caption: "Behind the scenes at last night's rooftop party 📸✨",
                mediaUrl: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&h=800&fit=crop",
                mediaType: "IMAGE",
            },
        }),
        prisma.reel.create({
            data: {
                userId: freelancer.id,
                caption: "Golden hour portraits at Venice Beach 🌅",
                mediaUrl: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=600&h=800&fit=crop",
                mediaType: "IMAGE",
            },
        }),
        prisma.reel.create({
            data: {
                userId: freelancer2.id,
                caption: "Dropping beats at Club Nova 🎵🔥",
                mediaUrl: "https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=600&h=800&fit=crop",
                mediaType: "IMAGE",
            },
        }),
        prisma.reel.create({
            data: {
                userId: freelancer2.id,
                caption: "Sunset set at the beach festival 🌊",
                mediaUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&h=800&fit=crop",
                mediaType: "IMAGE",
            },
        }),
    ]);
    console.log(`  Created ${reels.length} reels`);

    // Create services
    console.log("💼 Creating services...");
    const services = await Promise.all([
        prisma.service.create({
            data: {
                userId: freelancer.id,
                title: "Event Photography Package",
                description: "Full coverage of your event including candid shots, portraits, and group photos. Includes 200+ edited photos delivered within 48 hours.",
                price: 50000, // $500.00
                category: "Photography",
                deliveryDays: 2,
                imageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&h=400&fit=crop",
            },
        }),
        prisma.service.create({
            data: {
                userId: freelancer.id,
                title: "Portrait Session",
                description: "1-hour portrait session at a location of your choice. Perfect for headshots, social media content, or personal branding.",
                price: 15000, // $150.00
                category: "Photography",
                deliveryDays: 3,
                imageUrl: "https://images.unsplash.com/photo-1554048612-b6a482bc67e5?w=600&h=400&fit=crop",
            },
        }),
        prisma.service.create({
            data: {
                userId: freelancer2.id,
                title: "DJ Set - Club Night",
                description: "4-hour DJ set with professional equipment. Wide range of genres including house, techno, and hip-hop. Crowd reading guaranteed.",
                price: 80000, // $800.00
                category: "DJ",
                deliveryDays: 1,
                imageUrl: "https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=600&h=400&fit=crop",
            },
        }),
        prisma.service.create({
            data: {
                userId: freelancer2.id,
                title: "Private Party DJ",
                description: "Perfect for birthdays, corporate events, or house parties. Includes consultation to customize the playlist for your event.",
                price: 40000, // $400.00
                category: "DJ",
                deliveryDays: 1,
                imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=400&fit=crop",
            },
        }),
    ]);
    console.log(`  Created ${services.length} services`);

    // Create shortlist (employer saved freelancer)
    console.log("⭐ Creating shortlist...");
    await prisma.shortlist.create({
        data: {
            userId: employer.id,
            targetId: freelancer.id,
        },
    });
    console.log("  Employer saved freelancer to shortlist");

    // Create conversation with messages
    console.log("💬 Creating conversation...");
    const conversation = await prisma.conversation.create({
        data: {
            participants: {
                create: [
                    { userId: employer.id },
                    { userId: freelancer.id },
                ],
            },
        },
    });

    await prisma.message.createMany({
        data: [
            {
                conversationId: conversation.id,
                senderId: employer.id,
                text: "Hi Alex! I saw your portfolio and I'm really impressed with your work.",
            },
            {
                conversationId: conversation.id,
                senderId: freelancer.id,
                text: "Thank you so much! I'd love to hear more about your event.",
            },
            {
                conversationId: conversation.id,
                senderId: employer.id,
                text: "We're planning a rooftop party for 200 guests next month. Are you available?",
            },
            {
                conversationId: conversation.id,
                senderId: freelancer.id,
                text: "That sounds amazing! Let me check my calendar and get back to you with availability.",
            },
        ],
    });
    console.log("  Created conversation with 4 messages");

    console.log("\n✅ Seed completed successfully!");
    console.log("\n📋 Demo Accounts:");
    console.log("  Freelancer: freelancer@demo.com / password123");
    console.log("  DJ/Freelancer: dj@demo.com / password123");
    console.log("  Employer: employer@demo.com / password123");
}

main()
    .catch((e) => {
        console.error("❌ Seed failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
