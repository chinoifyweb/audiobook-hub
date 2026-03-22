import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { requireLecturer, verifyLecturerCourseAccess } from "@/lib/auth";

/**
 * GET /api/courses/[courseId]/assessments/[assessmentId]/attempts
 * Get all student attempts for an assessment with detailed scores.
 */
export async function GET(
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

    const attempts = await prisma.testExamAttempt.findMany({
      where: { testExamId: params.assessmentId },
      include: {
        student: {
          include: {
            user: { select: { fullName: true, email: true } },
          },
        },
        answers: {
          include: { question: true },
          orderBy: { question: { sortOrder: "asc" } },
        },
      },
      orderBy: { startedAt: "desc" },
    });

    return NextResponse.json({
      testExam,
      attempts,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
