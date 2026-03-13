import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { requireAdmin } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await requireAdmin();
    const body = await request.json();
    const { action, semesterId } = body;

    if (action === "release") {
      if (!semesterId) {
        return NextResponse.json({ error: "Semester ID is required" }, { status: 400 });
      }

      const result = await prisma.grade.updateMany({
        where: {
          semesterId,
          isReleased: false,
        },
        data: {
          isReleased: true,
          releasedById: session.user.id,
          releasedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        releasedCount: result.count,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Results action error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Failed to process results action" }, { status: 500 });
  }
}
