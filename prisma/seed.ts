import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // ─── Platform Settings ──────────────────────────────────────────────────

  const settings = [
    {
      key: "default_author_commission_rate",
      value: "0.70",
      description: "Default commission rate for authors (authors keep 70%)",
    },
    {
      key: "platform_fee_percentage",
      value: "0.30",
      description: "Platform fee percentage (platform keeps 30%)",
    },
    {
      key: "min_book_price",
      value: "50000",
      description: "Minimum book price in kobo (₦500)",
    },
    {
      key: "max_upload_size_mb",
      value: "500",
      description: "Maximum upload file size in MB",
    },
    {
      key: "supported_audio_formats",
      value: JSON.stringify(["mp3", "aac", "m4a", "m4b"]),
      description: "Supported audio file formats",
    },
    {
      key: "supported_ebook_formats",
      value: JSON.stringify(["epub", "pdf"]),
      description: "Supported ebook file formats",
    },
  ];

  for (const setting of settings) {
    await prisma.platformSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value, description: setting.description },
      create: setting,
    });
  }

  console.log("Platform settings seeded.");

  // ─── Subscription Plans ─────────────────────────────────────────────────

  const plans = [
    {
      name: "Basic",
      description:
        "Perfect for casual listeners. Access 5 audiobooks and unlimited ebooks every month.",
      price: 150000, // ₦1,500 in kobo
      interval: "monthly" as const,
      maxBooksPerMonth: 5,
      features: JSON.stringify([
        "5 audiobooks per month",
        "Unlimited ebooks",
        "Standard audio quality",
        "Web & mobile access",
      ]),
    },
    {
      name: "Premium",
      description:
        "For avid readers. Access 15 audiobooks with HD audio quality and offline downloads.",
      price: 300000, // ₦3,000 in kobo
      interval: "monthly" as const,
      maxBooksPerMonth: 15,
      features: JSON.stringify([
        "15 audiobooks per month",
        "Unlimited ebooks",
        "HD audio quality",
        "Offline downloads",
        "Priority support",
      ]),
    },
    {
      name: "VIP",
      description:
        "Unlimited access to our entire catalog. The ultimate listening experience.",
      price: 500000, // ₦5,000 in kobo
      interval: "monthly" as const,
      maxBooksPerMonth: null,
      features: JSON.stringify([
        "Unlimited audiobooks",
        "Unlimited ebooks",
        "HD audio quality",
        "Offline downloads",
        "Priority support",
        "Early access to new releases",
      ]),
    },
    {
      name: "Basic Annual",
      description: "Basic plan billed annually. Save 20%!",
      price: 1440000, // ₦14,400 in kobo (₦1,200/mo effective)
      interval: "annually" as const,
      maxBooksPerMonth: 5,
      features: JSON.stringify([
        "5 audiobooks per month",
        "Unlimited ebooks",
        "Standard audio quality",
        "Web & mobile access",
        "Save 20% vs monthly",
      ]),
    },
    {
      name: "Premium Annual",
      description: "Premium plan billed annually. Save 20%!",
      price: 2880000, // ₦28,800 in kobo (₦2,400/mo effective)
      interval: "annually" as const,
      maxBooksPerMonth: 15,
      features: JSON.stringify([
        "15 audiobooks per month",
        "Unlimited ebooks",
        "HD audio quality",
        "Offline downloads",
        "Priority support",
        "Save 20% vs monthly",
      ]),
    },
  ];

  for (const plan of plans) {
    const existing = await prisma.subscriptionPlan.findFirst({
      where: { name: plan.name },
    });
    if (!existing) {
      await prisma.subscriptionPlan.create({ data: plan });
    }
  }

  console.log("Subscription plans seeded.");

  // ─── Admin User ─────────────────────────────────────────────────────────

  const adminEmail = "admin@audiobookhub.com";
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash("admin123456", 12);
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: hashedPassword,
        fullName: "Platform Admin",
        role: "admin",
        isVerified: true,
        isActive: true,
      },
    });
    console.log("Admin user created (admin@audiobookhub.com / admin123456)");
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
