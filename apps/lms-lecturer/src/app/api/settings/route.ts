import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import bcrypt from "bcryptjs";
import { requireLecturer } from "@/lib/auth";

// GET: Fetch lecturer profile
export async function GET() {
  try {
    const lecturer = await requireLecturer();
    return NextResponse.json(lecturer);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH: Update profile fields (title, specialization, qualifications)
export async function PATCH(request: NextRequest) {
  try {
    const lecturer = await requireLecturer();
    const body = await request.json();

    const { title, specialization, qualifications } = body;

    const updated = await prisma.lecturerProfile.update({
      where: { id: lecturer.id },
      data: {
        ...(title !== undefined && { title }),
        ...(specialization !== undefined && { specialization }),
        ...(qualifications !== undefined && { qualifications }),
      },
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT: Change password
export async function PUT(request: NextRequest) {
  try {
    const lecturer = await requireLecturer();
    const body = await request.json();

    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Get user with password hash
    const user = await prisma.user.findUnique({
      where: { id: lecturer.userId },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: "Cannot change password for this account" },
        { status: 400 }
      );
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    }

    // Hash new password and update
    const newHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: lecturer.userId },
      data: { passwordHash: newHash },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
