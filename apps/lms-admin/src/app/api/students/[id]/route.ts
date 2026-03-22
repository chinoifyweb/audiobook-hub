import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { requireAdmin } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { status, fullName, email, phone, programId, currentSemester } = body;

    const student = await prisma.studentProfile.findUnique({
      where: { id: params.id },
      include: { user: true },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // If only status change (legacy behavior)
    if (status && !fullName && !email) {
      if (!["active", "suspended"].includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }

      await prisma.studentProfile.update({
        where: { id: params.id },
        data: { status },
      });

      await prisma.user.update({
        where: { id: student.userId },
        data: { isActive: status === "active" },
      });

      return NextResponse.json({ success: true });
    }

    // Full profile update
    const userUpdate: Record<string, unknown> = {};
    const studentUpdate: Record<string, unknown> = {};

    if (fullName) userUpdate.fullName = fullName;
    if (email) {
      // Check email uniqueness
      if (email !== student.user.email) {
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
          return NextResponse.json({ error: "Email already in use" }, { status: 400 });
        }
        userUpdate.email = email;
      }
    }
    if (phone !== undefined) userUpdate.phone = phone || null;

    if (programId) studentUpdate.programId = programId;
    if (currentSemester) studentUpdate.currentSemester = parseInt(currentSemester, 10);
    if (status) {
      if (!["active", "suspended", "graduated", "withdrawn", "deferred"].includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      studentUpdate.status = status;
      userUpdate.isActive = status === "active";
    }

    if (Object.keys(userUpdate).length > 0) {
      await prisma.user.update({
        where: { id: student.userId },
        data: userUpdate,
      });
    }

    if (Object.keys(studentUpdate).length > 0) {
      await prisma.studentProfile.update({
        where: { id: params.id },
        data: studentUpdate,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update student error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Failed to update student" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { action, newPassword } = body;

    const student = await prisma.studentProfile.findUnique({
      where: { id: params.id },
      include: { user: true },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    if (action === "reset-password") {
      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
      }
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      await prisma.user.update({
        where: { id: student.userId },
        data: { passwordHash: hashedPassword },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Student action error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Failed to perform action" }, { status: 500 });
  }
}
