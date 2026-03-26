import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { requireAdmin } from "@/lib/auth";

/**
 * GET /api/grades
 * Get grade reports. Query params: ?semester=&program=&course=&format=csv
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const semesterFilter = searchParams.get("semester");
    const programFilter = searchParams.get("program");
    const courseFilter = searchParams.get("course");
    const format = searchParams.get("format");

    const where: Record<string, unknown> = {};
    if (semesterFilter) where.semesterId = semesterFilter;
    if (programFilter) {
      where.student = { programId: programFilter };
    }
    if (courseFilter) {
      where.courseEnrollment = {
        courseAssignment: { courseId: courseFilter },
      };
    }

    const grades = await prisma.grade.findMany({
      where,
      include: {
        student: {
          include: {
            user: { select: { fullName: true, email: true } },
            program: { select: { name: true, code: true } },
          },
        },
        courseEnrollment: {
          include: {
            courseAssignment: {
              include: { course: { select: { code: true, title: true } } },
            },
          },
        },
        semester: {
          include: { session: { select: { name: true } } },
        },
      },
      orderBy: [
        { semester: { session: { name: "desc" } } },
        { student: { user: { fullName: "asc" } } },
      ],
    });

    if (format === "csv") {
      const headers = [
        "Student ID",
        "Student Name",
        "Email",
        "Program",
        "Course Code",
        "Course Title",
        "Semester",
        "Test Score",
        "Exam Score",
        "Assignment Score",
        "Total Score",
        "Letter Grade",
        "Released",
      ];

      const rows = grades.map((g) => [
        g.student.studentId,
        g.student.user.fullName || "",
        g.student.user.email || "",
        g.student.program.code,
        g.courseEnrollment.courseAssignment.course.code,
        g.courseEnrollment.courseAssignment.course.title,
        `${g.semester.session.name} - ${g.semester.name}`,
        String(g.testScore),
        String(g.examScore),
        String(g.assignmentScore),
        String(g.totalScore),
        g.letterGrade || "",
        g.isReleased ? "Yes" : "No",
      ]);

      const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": "attachment; filename=grade_report.csv",
        },
      });
    }

    // Compute summary stats
    const totalGrades = grades.length;
    const gradedCount = grades.filter((g) => g.letterGrade).length;
    const releasedCount = grades.filter((g) => g.isReleased).length;
    const avgScore =
      gradedCount > 0
        ? grades.reduce((sum, g) => sum + Number(g.totalScore), 0) / gradedCount
        : 0;

    // Grade distribution
    const distribution: Record<string, number> = {};
    grades.forEach((g) => {
      const letter = g.letterGrade || "Ungraded";
      distribution[letter] = (distribution[letter] || 0) + 1;
    });

    // Students at risk (below 40)
    const atRisk = grades
      .filter((g) => Number(g.totalScore) > 0 && Number(g.totalScore) < 40)
      .map((g) => ({
        studentId: g.student.studentId,
        name: g.student.user.fullName,
        program: g.student.program.code,
        course: g.courseEnrollment.courseAssignment.course.code,
        totalScore: Number(g.totalScore),
        letterGrade: g.letterGrade,
      }));

    return NextResponse.json({
      grades: grades.map((g) => ({
        id: g.id,
        studentId: g.student.studentId,
        studentName: g.student.user.fullName,
        email: g.student.user.email,
        program: g.student.program.code,
        courseCode: g.courseEnrollment.courseAssignment.course.code,
        courseTitle: g.courseEnrollment.courseAssignment.course.title,
        semester: `${g.semester.session.name} - ${g.semester.name}`,
        semesterId: g.semesterId,
        testScore: Number(g.testScore),
        examScore: Number(g.examScore),
        assignmentScore: Number(g.assignmentScore),
        totalScore: Number(g.totalScore),
        letterGrade: g.letterGrade,
        isReleased: g.isReleased,
      })),
      summary: {
        totalGrades,
        gradedCount,
        releasedCount,
        avgScore: avgScore.toFixed(1),
        distribution,
        atRiskCount: atRisk.length,
      },
      atRisk,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
