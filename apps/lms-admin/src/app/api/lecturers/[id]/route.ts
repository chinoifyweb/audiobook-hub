import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { requireAdmin } from "@/lib/auth";
import bcrypt from "bcryptjs";

// GET single lecturer
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const lecturer = await prisma.lecturerProfile.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { fullName: true, email: true, phone: true, isActive: true } },
        department: { select: { id: true, name: true, code: true } },
        courseAssignments: {
          where: { isActive: true },
          include: {
            course: { select: { code: true, title: true } },
            semester: { include: { session: true } },
          },
        },
      },
    });

    if (!lecturer) {
      return NextResponse.json({ error: "Lecturer not found" }, { status: 404 });
    }

    return NextResponse.json(lecturer);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Failed to fetch lecturer" }, { status: 500 });
  }
}

// PATCH — update lecturer details
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { fullName, email, phone, departmentId, title, specialization } = body;

    const lecturer = await prisma.lecturerProfile.findUnique({
      where: { id: params.id },
      include: { user: true },
    });

    if (!lecturer) {
      return NextResponse.json({ error: "Lecturer not found" }, { status: 404 });
    }

    // Check email uniqueness if changed
    if (email && email !== lecturer.user.email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return NextResponse.json({ error: "A user with this email already exists" }, { status: 400 });
      }
    }

    // Update user and lecturer profile in transaction
    await prisma.$transaction(async (tx) => {
      // Update user fields
      const userData: any = {};
      if (fullName !== undefined) userData.fullName = fullName;
      if (email !== undefined) userData.email = email;
      if (phone !== undefined) userData.phone = phone || null;

      if (Object.keys(userData).length > 0) {
        await tx.user.update({
          where: { id: lecturer.userId },
          data: userData,
        });
      }

      // Update lecturer profile fields
      const lecturerData: any = {};
      if (departmentId !== undefined) lecturerData.departmentId = departmentId;
      if (title !== undefined) lecturerData.title = title || null;
      if (specialization !== undefined) lecturerData.specialization = specialization || null;

      if (Object.keys(lecturerData).length > 0) {
        await tx.lecturerProfile.update({
          where: { id: params.id },
          data: lecturerData,
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update lecturer error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Failed to update lecturer" }, { status: 500 });
  }
}

// PUT — suspend/activate/reset password
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { action, newPassword } = body;

    const lecturer = await prisma.lecturerProfile.findUnique({
      where: { id: params.id },
      include: { user: { select: { id: true, fullName: true } } },
    });

    if (!lecturer) {
      return NextResponse.json({ error: "Lecturer not found" }, { status: 404 });
    }

    switch (action) {
      case "suspend": {
        await prisma.$transaction([
          prisma.lecturerProfile.update({
            where: { id: params.id },
            data: { isActive: false },
          }),
          prisma.user.update({
            where: { id: lecturer.userId },
            data: { isActive: false },
          }),
        ]);
        return NextResponse.json({ success: true, message: "Lecturer suspended" });
      }

      case "activate": {
        await prisma.$transaction([
          prisma.lecturerProfile.update({
            where: { id: params.id },
            data: { isActive: true },
          }),
          prisma.user.update({
            where: { id: lecturer.userId },
            data: { isActive: true },
          }),
        ]);
        return NextResponse.json({ success: true, message: "Lecturer activated" });
      }

      case "reset-password": {
        if (!newPassword || newPassword.length < 6) {
          return NextResponse.json(
            { error: "Password must be at least 6 characters" },
            { status: 400 }
          );
        }
        const passwordHash = await bcrypt.hash(newPassword, 12);
        await prisma.user.update({
          where: { id: lecturer.userId },
          data: { passwordHash },
        });
        return NextResponse.json({ success: true, message: "Password reset" });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Lecturer action error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Failed to perform action" }, { status: 500 });
  }
}
