import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { requireLecturer, getActiveSemester, verifyLecturerCourseAccess } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const lecturer = await requireLecturer();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    // Return lecturer's course assignments
    if (action === "courses") {
      const activeSemester = await getActiveSemester();
      if (!activeSemester) {
        return NextResponse.json([]);
      }

      const courseAssignments = await prisma.courseAssignment.findMany({
        where: {
          lecturerId: lecturer.id,
          semesterId: activeSemester.id,
          isActive: true,
        },
        include: {
          course: { select: { code: true, title: true } },
        },
        orderBy: { course: { code: "asc" } },
      });

      return NextResponse.json(courseAssignments);
    }

    // Return grades for a specific course
    if (action === "grades") {
      const courseAssignmentId = searchParams.get("courseAssignmentId");
      if (!courseAssignmentId) {
        return NextResponse.json({ error: "courseAssignmentId required" }, { status: 400 });
      }

      await verifyLecturerCourseAccess(lecturer.id, courseAssignmentId);

      const activeSemester = await getActiveSemester();
      if (!activeSemester) {
        return NextResponse.json([]);
      }

      // Get all enrolled students with their grades
      const enrollments = await prisma.courseEnrollment.findMany({
        where: {
          courseAssignmentId,
          status: "enrolled",
        },
        include: {
          student: {
            include: {
              user: { select: { fullName: true } },
            },
          },
          grade: true,
        },
        orderBy: {
          student: { user: { fullName: "asc" } },
        },
      });

      const gradeData = enrollments.map((enrollment) => ({
        enrollmentId: enrollment.id,
        studentId: enrollment.studentId,
        studentName: enrollment.student.user.fullName || "Unknown",
        studentNumber: enrollment.student.studentId,
        testScore: enrollment.grade ? Number(enrollment.grade.testScore) : 0,
        examScore: enrollment.grade ? Number(enrollment.grade.examScore) : 0,
        assignmentScore: enrollment.grade
          ? Number(enrollment.grade.assignmentScore)
          : 0,
        totalScore: enrollment.grade ? Number(enrollment.grade.totalScore) : 0,
        letterGrade: enrollment.grade?.letterGrade || "F",
        gradeId: enrollment.grade?.id || null,
      }));

      return NextResponse.json(gradeData);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const lecturer = await requireLecturer();
    const body = await request.json();

    const { courseAssignmentId, grades } = body;

    if (!courseAssignmentId || !grades || !Array.isArray(grades)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await verifyLecturerCourseAccess(lecturer.id, courseAssignmentId);

    const activeSemester = await getActiveSemester();
    if (!activeSemester) {
      return NextResponse.json({ error: "No active semester" }, { status: 400 });
    }

    // Process each grade
    const upsertPromises = grades.map(
      async (grade: {
        enrollmentId: string;
        studentId: string;
        testScore: number;
        examScore: number;
        assignmentScore: number;
        totalScore: number;
        letterGrade: string;
        gradePoint: number;
      }) => {
        // Check if grade already exists for this enrollment
        const existingGrade = await prisma.grade.findUnique({
          where: { courseEnrollmentId: grade.enrollmentId },
        });

        if (existingGrade) {
          // Update existing grade
          return prisma.grade.update({
            where: { id: existingGrade.id },
            data: {
              testScore: grade.testScore,
              examScore: grade.examScore,
              assignmentScore: grade.assignmentScore,
              totalScore: grade.totalScore,
              letterGrade: grade.letterGrade,
              gradePoint: grade.gradePoint,
            },
          });
        } else {
          // Create new grade
          return prisma.grade.create({
            data: {
              studentId: grade.studentId,
              courseEnrollmentId: grade.enrollmentId,
              semesterId: activeSemester.id,
              testScore: grade.testScore,
              examScore: grade.examScore,
              assignmentScore: grade.assignmentScore,
              totalScore: grade.totalScore,
              letterGrade: grade.letterGrade,
              gradePoint: grade.gradePoint,
            },
          });
        }
      }
    );

    await Promise.all(upsertPromises);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
