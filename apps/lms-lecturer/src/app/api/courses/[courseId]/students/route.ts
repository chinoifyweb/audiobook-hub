import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { requireLecturer, verifyLecturerCourseAccess } from "@/lib/auth";

/**
 * GET /api/courses/[courseId]/students
 * Get enrolled students with their grades, test scores, assignment scores.
 * Supports ?format=csv for CSV export.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const lecturer = await requireLecturer();
    await verifyLecturerCourseAccess(lecturer.id, params.courseId);

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format");

    const courseAssignment = await prisma.courseAssignment.findUnique({
      where: { id: params.courseId },
      include: {
        course: true,
        enrollments: {
          where: { status: "enrolled" },
          include: {
            student: {
              include: {
                user: { select: { fullName: true, email: true } },
              },
            },
            grade: true,
          },
          orderBy: { student: { user: { fullName: "asc" } } },
        },
        testExams: {
          include: {
            attempts: {
              where: { status: "graded" },
              include: {
                student: true,
              },
            },
          },
        },
        assignments: {
          include: {
            submissions: {
              where: { score: { not: null } },
              include: {
                student: true,
              },
            },
          },
        },
      },
    });

    if (!courseAssignment) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Build performance data per student
    const students = courseAssignment.enrollments.map((enrollment) => {
      const studentId = enrollment.studentId;

      // Find best test attempts for this student
      const testScores = courseAssignment.testExams
        .filter((te) => te.type === "test")
        .map((te) => {
          const studentAttempts = te.attempts.filter((a) => a.studentId === studentId);
          const best = studentAttempts.reduce(
            (max, a) => (a.totalScore !== null && (a.totalScore ?? 0) > (max ?? 0) ? a.totalScore : max),
            null as number | null
          );
          return { testTitle: te.title, score: best, maxScore: te.totalMarks };
        });

      // Find exam scores
      const examScores = courseAssignment.testExams
        .filter((te) => te.type === "exam")
        .map((te) => {
          const studentAttempts = te.attempts.filter((a) => a.studentId === studentId);
          const best = studentAttempts.reduce(
            (max, a) => (a.totalScore !== null && (a.totalScore ?? 0) > (max ?? 0) ? a.totalScore : max),
            null as number | null
          );
          return { examTitle: te.title, score: best, maxScore: te.totalMarks };
        });

      // Find assignment scores
      const assignmentScores = courseAssignment.assignments.map((a) => {
        const sub = a.submissions.find((s) => s.studentId === studentId);
        return { assignmentTitle: a.title, score: sub?.score ?? null, maxScore: a.maxScore };
      });

      return {
        studentId: enrollment.student.studentId,
        name: enrollment.student.user.fullName,
        email: enrollment.student.user.email,
        grade: enrollment.grade
          ? {
              testScore: Number(enrollment.grade.testScore),
              examScore: Number(enrollment.grade.examScore),
              assignmentScore: Number(enrollment.grade.assignmentScore),
              totalScore: Number(enrollment.grade.totalScore),
              letterGrade: enrollment.grade.letterGrade,
              isReleased: enrollment.grade.isReleased,
            }
          : null,
        testScores,
        examScores,
        assignmentScores,
      };
    });

    if (format === "csv") {
      // Generate CSV
      const headers = [
        "Student ID",
        "Name",
        "Email",
        "Test Score",
        "Exam Score",
        "Assignment Score",
        "Total Score",
        "Letter Grade",
      ];

      const rows = students.map((s) => [
        s.studentId,
        s.name || "",
        s.email || "",
        s.grade?.testScore?.toString() || "",
        s.grade?.examScore?.toString() || "",
        s.grade?.assignmentScore?.toString() || "",
        s.grade?.totalScore?.toString() || "",
        s.grade?.letterGrade || "",
      ]);

      const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${courseAssignment.course.code}_grades.csv"`,
        },
      });
    }

    return NextResponse.json({
      course: courseAssignment.course,
      students,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
