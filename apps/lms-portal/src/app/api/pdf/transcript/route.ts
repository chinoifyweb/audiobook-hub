import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { requireStudent } from "@/lib/auth";
import { prisma } from "@repo/db";
import { TranscriptPDF } from "@repo/pdf";
import type { TranscriptData, TranscriptSemester, TranscriptGrade } from "@repo/pdf";
import { format } from "date-fns";
import React from "react";

export async function GET() {
  try {
    const { studentProfile } = await requireStudent();

    // Fetch all released grades with course and semester info
    const grades = await prisma.grade.findMany({
      where: {
        studentId: studentProfile.id,
        isReleased: true,
      },
      include: {
        courseEnrollment: {
          include: {
            courseAssignment: {
              include: {
                course: {
                  select: {
                    code: true,
                    title: true,
                    creditUnits: true,
                  },
                },
              },
            },
          },
        },
        semester: {
          include: {
            session: true,
          },
        },
      },
      orderBy: [
        { semester: { session: { startDate: "asc" } } },
        { semester: { number: "asc" } },
        { courseEnrollment: { courseAssignment: { course: { code: "asc" } } } },
      ],
    });

    // Group grades by semester
    const semesterMap = new Map<string, {
      sessionName: string;
      semesterName: string;
      grades: TranscriptGrade[];
    }>();

    let cumulativeTotalCredits = 0;
    let cumulativeTotalWeightedPoints = 0;

    for (const grade of grades) {
      const semesterId = grade.semesterId;
      const course = grade.courseEnrollment.courseAssignment.course;

      if (!semesterMap.has(semesterId)) {
        semesterMap.set(semesterId, {
          sessionName: grade.semester.session.name,
          semesterName: grade.semester.name,
          grades: [],
        });
      }

      const gradePoint = Number(grade.gradePoint);
      const creditUnits = course.creditUnits;

      semesterMap.get(semesterId)!.grades.push({
        courseCode: course.code,
        courseTitle: course.title,
        creditUnits,
        letterGrade: grade.letterGrade || "N/A",
        gradePoint,
      });
    }

    // Build semester data with calculated totals
    const semesters: TranscriptSemester[] = [];

    for (const semData of Array.from(semesterMap.values())) {
      const totalCredits = semData.grades.reduce(
        (sum, g) => sum + g.creditUnits,
        0
      );
      const totalWeightedPoints = semData.grades.reduce(
        (sum, g) => sum + g.creditUnits * g.gradePoint,
        0
      );
      const gpa = totalCredits > 0 ? totalWeightedPoints / totalCredits : 0;

      cumulativeTotalCredits += totalCredits;
      cumulativeTotalWeightedPoints += totalWeightedPoints;

      semesters.push({
        sessionName: semData.sessionName,
        semesterName: semData.semesterName,
        grades: semData.grades,
        totalCredits,
        totalWeightedPoints,
        gpa,
      });
    }

    const cumulativeGPA =
      cumulativeTotalCredits > 0
        ? cumulativeTotalWeightedPoints / cumulativeTotalCredits
        : 0;

    // Get faculty name through program -> department -> faculty
    const programWithFaculty = await prisma.program.findUnique({
      where: { id: studentProfile.programId },
      include: {
        department: {
          include: { faculty: true },
        },
      },
    });

    const data: TranscriptData = {
      studentName: studentProfile.user.fullName || "N/A",
      studentId: studentProfile.studentId,
      programName: studentProfile.program.name,
      degreeType: programWithFaculty?.degreeType || "N/A",
      departmentName: studentProfile.program.department.name,
      facultyName: programWithFaculty?.department.faculty.name || "N/A",
      enrollmentDate: format(
        new Date(studentProfile.enrollmentDate),
        "MMMM d, yyyy"
      ),
      status: studentProfile.status,
      semesters,
      cumulativeCredits: cumulativeTotalCredits,
      cumulativeGPA,
      generatedDate: format(new Date(), "MMMM d, yyyy"),
    };

    const buffer = await renderToBuffer(
      React.createElement(TranscriptPDF, { data }) as any
    );

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="transcript-${studentProfile.studentId}.pdf"`,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    const status =
      message === "Unauthorized"
        ? 401
        : message.includes("Forbidden")
          ? 403
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
