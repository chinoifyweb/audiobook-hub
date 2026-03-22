import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();

    const assignments = await prisma.lmsAssignment.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        courseAssignment: {
          include: {
            course: { select: { code: true, title: true } },
            lecturer: {
              include: { user: { select: { fullName: true } } },
            },
            semester: {
              include: { session: { select: { name: true } } },
            },
          },
        },
        _count: {
          select: { submissions: true },
        },
      },
    });

    return NextResponse.json(assignments);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Failed to fetch assignments" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { courseAssignmentId, title, description, instructions, dueDate, maxScore, allowLateSubmission, fileRequired, isPublished } = body;

    if (!courseAssignmentId || !title || !dueDate || !maxScore) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const assignment = await prisma.lmsAssignment.create({
      data: {
        courseAssignmentId,
        title,
        description: description || null,
        instructions: instructions || null,
        dueDate: new Date(dueDate),
        maxScore: parseInt(maxScore, 10),
        allowLateSubmission: allowLateSubmission === true,
        fileRequired: fileRequired !== false,
        isPublished: isPublished === true,
      },
    });

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    console.error("Create assignment error:", error);
    const message = error instanceof Error ? error.message : "Server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Failed to create assignment" }, { status: 500 });
  }
}
