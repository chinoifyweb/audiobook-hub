import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { requireLecturer, verifyLecturerCourseAccess } from "@/lib/auth";

/**
 * PATCH /api/courses/[courseId]/sessions/[sessionId]/content/[contentId]
 * Update a content item.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { courseId: string; sessionId: string; contentId: string } }
) {
  try {
    const lecturer = await requireLecturer();
    await verifyLecturerCourseAccess(lecturer.id, params.courseId);

    const material = await prisma.courseMaterial.findUnique({
      where: { id: params.contentId },
    });

    if (!material || material.courseAssignmentId !== params.courseId) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.title !== undefined) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;
    if (body.contentUrl !== undefined) updates.contentUrl = body.contentUrl;
    if (body.type !== undefined) updates.type = body.type;
    if (body.sortOrder !== undefined) updates.sortOrder = body.sortOrder;
    if (body.isPublished !== undefined) updates.isPublished = body.isPublished;

    const updated = await prisma.courseMaterial.update({
      where: { id: params.contentId },
      data: updates,
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/courses/[courseId]/sessions/[sessionId]/content/[contentId]
 * Remove a content item.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { courseId: string; sessionId: string; contentId: string } }
) {
  try {
    const lecturer = await requireLecturer();
    await verifyLecturerCourseAccess(lecturer.id, params.courseId);

    const material = await prisma.courseMaterial.findUnique({
      where: { id: params.contentId },
    });

    if (!material || material.courseAssignmentId !== params.courseId) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    await prisma.courseMaterial.delete({ where: { id: params.contentId } });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
