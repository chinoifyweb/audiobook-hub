import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { requireLecturer, verifyLecturerCourseAccess } from "@/lib/auth";

/**
 * POST /api/courses/[courseId]/sessions/[sessionId]/content
 * Add a content item to a session. sessionId is the session number (0, 1, 2...).
 * Body: { title, description, type, contentUrl, isPublished }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { courseId: string; sessionId: string } }
) {
  try {
    const lecturer = await requireLecturer();
    await verifyLecturerCourseAccess(lecturer.id, params.courseId);

    const body = await request.json();
    const { title, description, type, contentUrl, isPublished } = body;

    if (!title || !type || !contentUrl) {
      return NextResponse.json({ error: "title, type, and contentUrl required" }, { status: 400 });
    }

    const sessionNum = parseInt(params.sessionId, 10);
    if (isNaN(sessionNum)) {
      return NextResponse.json({ error: "Invalid session number" }, { status: 400 });
    }

    const baseOrder = sessionNum * 100;

    // Find the max sortOrder within this session range
    const maxInSession = await prisma.courseMaterial.aggregate({
      where: {
        courseAssignmentId: params.courseId,
        sortOrder: { gte: baseOrder, lt: baseOrder + 100 },
      },
      _max: { sortOrder: true },
    });

    const nextOrder = (maxInSession._max.sortOrder ?? baseOrder - 1) + 1;

    const material = await prisma.courseMaterial.create({
      data: {
        courseAssignmentId: params.courseId,
        title,
        description: description || null,
        type,
        contentUrl,
        sortOrder: nextOrder,
        isPublished: isPublished ?? false,
      },
    });

    return NextResponse.json(material, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/courses/[courseId]/sessions/[sessionId]/content
 * Reorder content items within a session.
 * Body: { items: [{ id, sortOrder }] }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { courseId: string; sessionId: string } }
) {
  try {
    const lecturer = await requireLecturer();
    await verifyLecturerCourseAccess(lecturer.id, params.courseId);

    const body = await request.json();
    const { items } = body;

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: "items array required" }, { status: 400 });
    }

    // Update sortOrders in a transaction
    await prisma.$transaction(
      items.map((item: { id: string; sortOrder: number }) =>
        prisma.courseMaterial.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
