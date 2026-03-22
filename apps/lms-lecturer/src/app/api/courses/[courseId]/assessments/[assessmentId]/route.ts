import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { requireLecturer, verifyLecturerCourseAccess } from "@/lib/auth";

/**
 * PATCH /api/courses/[courseId]/assessments/[assessmentId]
 * Update assessment details (title, description, timing, settings).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { courseId: string; assessmentId: string } }
) {
  try {
    const lecturer = await requireLecturer();
    await verifyLecturerCourseAccess(lecturer.id, params.courseId);

    const testExam = await prisma.testExam.findUnique({
      where: { id: params.assessmentId },
    });

    if (!testExam || testExam.courseAssignmentId !== params.courseId) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (body.title !== undefined) data.title = body.title;
    if (body.description !== undefined) data.description = body.description || null;
    if (body.type !== undefined) data.type = body.type;
    if (body.startTime !== undefined) data.startTime = new Date(body.startTime);
    if (body.endTime !== undefined) data.endTime = new Date(body.endTime);
    if (body.durationMinutes !== undefined) data.durationMinutes = body.durationMinutes;
    if (body.passMark !== undefined) data.passMark = body.passMark;
    if (body.isPublished !== undefined) data.isPublished = body.isPublished;
    if (body.shuffleQuestions !== undefined) data.shuffleQuestions = body.shuffleQuestions;
    if (body.showResultsImmediately !== undefined) data.showResultsImmediately = body.showResultsImmediately;

    const updated = await prisma.testExam.update({
      where: { id: params.assessmentId },
      data,
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
