import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const assignment = await prisma.lmsAssignment.findUnique({
      where: { id: params.id },
      include: {
        courseAssignment: {
          include: {
            course: { select: { code: true, title: true } },
            lecturer: {
              include: { user: { select: { fullName: true } } },
            },
          },
        },
        submissions: {
          include: {
            student: {
              include: {
                user: { select: { fullName: true, email: true } },
              },
            },
          },
          orderBy: { submittedAt: "desc" },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    return NextResponse.json(assignment);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Failed to fetch assignment" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { title, description, instructions, dueDate, maxScore, allowLateSubmission, fileRequired, isPublished } = body;

    const existing = await prisma.lmsAssignment.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description || null;
    if (instructions !== undefined) updateData.instructions = instructions || null;
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);
    if (maxScore !== undefined) updateData.maxScore = parseInt(maxScore, 10);
    if (allowLateSubmission !== undefined) updateData.allowLateSubmission = allowLateSubmission;
    if (fileRequired !== undefined) updateData.fileRequired = fileRequired;
    if (isPublished !== undefined) updateData.isPublished = isPublished;

    const updated = await prisma.lmsAssignment.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update assignment error:", error);
    const message = error instanceof Error ? error.message : "Server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Failed to update assignment" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const existing = await prisma.lmsAssignment.findUnique({
      where: { id: params.id },
      include: { _count: { select: { submissions: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    if (existing._count.submissions > 0) {
      return NextResponse.json({ error: "Cannot delete assignment with submissions" }, { status: 400 });
    }

    await prisma.lmsAssignment.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Failed to delete assignment" }, { status: 500 });
  }
}
