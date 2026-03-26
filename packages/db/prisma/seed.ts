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

  // ─── LMS: Academic Sessions & Semesters ─────────────────────────────

  const existingSession = await prisma.academicSession.findFirst({
    where: { name: "2025/2026" },
  });

  if (!existingSession) {
    const session = await prisma.academicSession.create({
      data: {
        name: "2025/2026",
        startDate: new Date("2025-09-01"),
        endDate: new Date("2026-08-31"),
        isActive: true,
      },
    });

    await prisma.semester.createMany({
      data: [
        {
          sessionId: session.id,
          name: "First Semester",
          number: 1,
          startDate: new Date("2025-09-01"),
          endDate: new Date("2026-01-31"),
          examStartDate: new Date("2026-01-15"),
          examEndDate: new Date("2026-01-31"),
        },
        {
          sessionId: session.id,
          name: "Second Semester",
          number: 2,
          startDate: new Date("2026-02-01"),
          endDate: new Date("2026-06-30"),
          examStartDate: new Date("2026-06-15"),
          examEndDate: new Date("2026-06-30"),
        },
      ],
    });

    console.log("Academic session 2025/2026 seeded with semesters.");
  }

  // ─── LMS: Faculties & Departments ──────────────────────────────────

  const existingFaculty = await prisma.faculty.findFirst({
    where: { code: "THEO" },
  });

  if (!existingFaculty) {
    const faculties = [
      {
        name: "Faculty of Theology",
        code: "THEO",
        description: "Biblical and Theological Studies",
        departments: [
          { name: "Department of Biblical Studies", code: "BIB" },
          { name: "Department of Systematic Theology", code: "SYS" },
          { name: "Department of Church History", code: "CHH" },
        ],
      },
      {
        name: "Faculty of Ministry",
        code: "MIN",
        description: "Pastoral and Ministry Studies",
        departments: [
          { name: "Department of Pastoral Studies", code: "PAS" },
          { name: "Department of Missions & Evangelism", code: "MIS" },
          { name: "Department of Christian Education", code: "CED" },
        ],
      },
      {
        name: "Faculty of Leadership",
        code: "LEAD",
        description: "Leadership and Management Studies",
        departments: [
          { name: "Department of Christian Leadership", code: "CLD" },
          { name: "Department of Church Administration", code: "CAD" },
        ],
      },
    ];

    for (const fac of faculties) {
      const faculty = await prisma.faculty.create({
        data: {
          name: fac.name,
          code: fac.code,
          description: fac.description,
        },
      });

      for (const dept of fac.departments) {
        await prisma.department.create({
          data: {
            facultyId: faculty.id,
            name: dept.name,
            code: dept.code,
          },
        });
      }
    }

    console.log("Faculties and departments seeded.");
  }

  // ─── LMS: Programs & Courses ───────────────────────────────────────

  const existingProgram = await prisma.program.findFirst({
    where: { code: "CERT-BIB" },
  });

  if (!existingProgram) {
    const bibDept = await prisma.department.findFirst({ where: { code: "BIB" } });
    const pasDept = await prisma.department.findFirst({ where: { code: "PAS" } });
    const cldDept = await prisma.department.findFirst({ where: { code: "CLD" } });

    if (bibDept && pasDept && cldDept) {
      const programs = [
        {
          departmentId: bibDept.id,
          name: "Certificate in Biblical Studies",
          code: "CERT-BIB",
          degreeType: "certificate" as const,
          durationSemesters: 2,
          totalCredits: 30,
          tuitionPerSemester: 5000000, // ₦50,000
          description: "A foundational certificate program covering Old and New Testament studies, biblical interpretation, and basic theology.",
        },
        {
          departmentId: bibDept.id,
          name: "Diploma in Theology",
          code: "DIP-THEO",
          degreeType: "diploma" as const,
          durationSemesters: 4,
          totalCredits: 60,
          tuitionPerSemester: 7500000, // ₦75,000
          description: "A comprehensive diploma program in theology covering systematic theology, biblical languages, and church history.",
        },
        {
          departmentId: pasDept.id,
          name: "Bachelor of Ministry",
          code: "BMIN",
          degreeType: "bachelors" as const,
          durationSemesters: 8,
          totalCredits: 120,
          tuitionPerSemester: 10000000, // ₦100,000
          description: "A four-year degree program preparing students for effective ministry in churches and parachurch organizations.",
        },
        {
          departmentId: cldDept.id,
          name: "Certificate in Christian Leadership",
          code: "CERT-CLD",
          degreeType: "certificate" as const,
          durationSemesters: 2,
          totalCredits: 24,
          tuitionPerSemester: 4500000, // ₦45,000
          description: "A focused program developing leadership skills for church and ministry contexts.",
        },
      ];

      for (const prog of programs) {
        await prisma.program.create({ data: prog });
      }

      // Add sample courses for Certificate in Biblical Studies
      const certBib = await prisma.program.findFirst({ where: { code: "CERT-BIB" } });
      if (certBib) {
        const courses = [
          { code: "BIB101", title: "Introduction to the Old Testament", creditUnits: 3, semesterNumber: 1 },
          { code: "BIB102", title: "Introduction to the New Testament", creditUnits: 3, semesterNumber: 1 },
          { code: "THE101", title: "Foundations of Christian Theology", creditUnits: 3, semesterNumber: 1 },
          { code: "BIB103", title: "Biblical Hermeneutics", creditUnits: 3, semesterNumber: 1 },
          { code: "MIN101", title: "Introduction to Christian Ministry", creditUnits: 3, semesterNumber: 1 },
          { code: "BIB201", title: "Pentateuch Studies", creditUnits: 3, semesterNumber: 2 },
          { code: "BIB202", title: "Gospels & Acts", creditUnits: 3, semesterNumber: 2 },
          { code: "THE201", title: "Christian Ethics", creditUnits: 3, semesterNumber: 2 },
          { code: "BIB203", title: "Pauline Epistles", creditUnits: 3, semesterNumber: 2 },
          { code: "MIN201", title: "Homiletics (Preaching)", creditUnits: 3, semesterNumber: 2 },
        ];

        for (const course of courses) {
          await prisma.course.create({
            data: {
              departmentId: bibDept.id,
              ...course,
            },
          });
        }
      }

      console.log("Programs and courses seeded.");
    }
  }

  // ─── LMS: Rector/Admin User ────────────────────────────────────────

  const rectorEmail = "rector@bba.org.ng";
  const existingRector = await prisma.user.findUnique({
    where: { email: rectorEmail },
  });

  if (!existingRector) {
    const hashedPassword = await bcrypt.hash("rector123456", 12);
    await prisma.user.create({
      data: {
        email: rectorEmail,
        passwordHash: hashedPassword,
        fullName: "Dr. Emmanuel Adeyemi",
        role: "rector",
        isVerified: true,
        isActive: true,
      },
    });
    console.log("Rector user created (rector@bba.org.ng / rector123456)");
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
