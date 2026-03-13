import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { status } = body;

    if (!status || !["active", "suspended"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const student = await prisma.studentProfile.findUnique({
      where: { id: params.id },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    await prisma.studentProfile.update({
      where: { id: params.id },
      data: { status },
    });

    // Also activate/deactivate the user account
    await prisma.user.update({
      where: { id: student.userId },
      data: { isActive: status === "active" },
    });

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
