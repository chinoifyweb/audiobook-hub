import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { requireAdmin } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    await requireAdmin();
    const lecturers = await prisma.lecturerProfile.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { fullName: true, email: true } },
        department: { select: { name: true, code: true } },
      },
    });
    return NextResponse.json(lecturers);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Failed to fetch lecturers" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { fullName, email, password, departmentId, title, specialization } = body;

    if (!fullName || !email || !password || !departmentId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 400 });
    }

    // Generate staff ID: BBA/LEC/YYYY/NNN
    const year = new Date().getFullYear();
    const lastLecturer = await prisma.lecturerProfile.findFirst({
      where: { staffId: { startsWith: `BBA/LEC/${year}/` } },
      orderBy: { staffId: "desc" },
    });

    let nextNum = 1;
    if (lastLecturer) {
      const parts = lastLecturer.staffId.split("/");
      nextNum = parseInt(parts[3], 10) + 1;
    }
    const staffId = `BBA/LEC/${year}/${String(nextNum).padStart(3, "0")}`;

    const passwordHash = await bcrypt.hash(password, 12);

    // Transaction: create user + lecturer profile
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          fullName,
          passwordHash,
          role: "lecturer",
          isVerified: true,
          isActive: true,
        },
      });

      const lecturer = await tx.lecturerProfile.create({
        data: {
          userId: user.id,
          staffId,
          departmentId,
          title: title || null,
          specialization: specialization || null,
        },
      });

      return { user, lecturer };
    });

    return NextResponse.json(
      { success: true, staffId: result.lecturer.staffId },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create lecturer error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Failed to create lecturer" }, { status: 500 });
  }
}
