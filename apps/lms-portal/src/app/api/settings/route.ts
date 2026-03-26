import { NextResponse } from "next/server";
import { requireStudent } from "@/lib/auth";
import { prisma } from "@repo/db";
import bcrypt from "bcryptjs";

// GET: Fetch profile
export async function GET() {
  try {
    const { studentProfile } = await requireStudent();

    const user = await prisma.user.findUnique({
      where: { id: studentProfile.userId },
      select: { fullName: true, email: true, phone: true, avatarUrl: true },
    });

    return NextResponse.json({
      profile: {
        fullName: user?.fullName || "",
        email: user?.email || "",
        phone: user?.phone || "",
        avatarUrl: user?.avatarUrl || "",
        studentId: studentProfile.studentId,
        program: studentProfile.program.name,
        department: studentProfile.program.department.name,
        currentSemester: studentProfile.currentSemester,
        enrollmentDate: studentProfile.enrollmentDate,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message === "Unauthorized" ? 401 : message.includes("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

// PATCH: Update profile
export async function PATCH(request: Request) {
  try {
    const { studentProfile } = await requireStudent();
    const { fullName, phone, avatarUrl } = await request.json();

    await prisma.user.update({
      where: { id: studentProfile.userId },
      data: {
        fullName: fullName?.trim() || undefined,
        phone: phone?.trim() || null,
        avatarUrl: avatarUrl?.trim() || null,
      },
    });

    return NextResponse.json({ message: "Profile updated successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message === "Unauthorized" ? 401 : message.includes("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

// PUT: Change password
export async function PUT(request: Request) {
  try {
    const { studentProfile } = await requireStudent();
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: studentProfile.userId },
      select: { passwordHash: true },
    });

    if (!user?.passwordHash) {
      return NextResponse.json(
        { error: "Cannot change password for this account type" },
        { status: 400 }
      );
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: studentProfile.userId },
      data: { passwordHash },
    });

    return NextResponse.json({ message: "Password changed successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message === "Unauthorized" ? 401 : message.includes("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
