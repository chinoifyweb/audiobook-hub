import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { requireAdmin } from "@/lib/auth";

/**
 * GET /api/assessments
 * List all assessments across all courses with stats.
 * Query params: ?course=&lecturer=&type=test|exam
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const courseFilter = searchParams.get("course");
    const lecturerFilter = searchParams.get("lecturer");
    const typeFilter = searchParams.get("type");

    const where: Record<string, unknown> = {};
    if (typeFilter === "test" || typeFilter === "exam") {
      where.type = typeFilter;
    }
    if (courseFilter) {
      where.courseAssignment = {
        ...(where.courseAssignment as object || {}),
        courseId: courseFilter,
      };
    }
    if (lecturerFilter) {
      where.courseAssignment = {
        ...(where.courseAssignment as object || {}),
        lecturerId: lecturerFilter,
      };
    }

    const assessments = await prisma.testExam.findMany({
      where,
      include: {
        courseAssignment: {
          include: {
            course: true,
            lecturer: {
              include: {
                user: { select: { fullName: true } },
              },
            },
            enrollments: { where: { status: "enrolled" } },
          },
        },
        attempts: {
          select: {
            id: true,
            status: true,
            totalScore: true,
            isPassed: true,
          },
        },
      },
      orderBy: { startTime: "desc" },
    });

    const result = assessments.map((a) => {
      const totalStudents = a.courseAssignment.enrollments.length;
      const attemptCount = a.attempts.length;
      const gradedCount = a.attempts.filter((at) => at.status === "graded").length;
      const passedCount = a.attempts.filter((at) => at.isPassed === true).length;
      const isOverdue =
        new Date(a.endTime) < new Date() && a.isPublished && attemptCount < totalStudents;

      return {
        id: a.id,
        title: a.title,
        type: a.type,
        courseCode: a.courseAssignment.course.code,
        courseTitle: a.courseAssignment.course.title,
        lecturerName: a.courseAssignment.lecturer.user.fullName,
        startTime: a.startTime,
        endTime: a.endTime,
        durationMinutes: a.durationMinutes,
        totalMarks: a.totalMarks,
        isPublished: a.isPublished,
        totalStudents,
        attemptCount,
        gradedCount,
        passedCount,
        completionRate: totalStudents > 0 ? Math.round((attemptCount / totalStudents) * 100) : 0,
        isOverdue,
      };
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
