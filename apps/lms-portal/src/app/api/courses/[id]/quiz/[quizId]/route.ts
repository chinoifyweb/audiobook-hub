import { NextResponse } from "next/server";
import { requireStudent } from "@/lib/auth";
import { prisma } from "@repo/db";

export async function GET(
  _request: Request,
  { params }: { params: { id: string; quizId: string } }
) {
  try {
    const { studentProfile } = await requireStudent();

    // Verify enrollment
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        studentId_courseAssignmentId: {
          studentId: studentProfile.id,
          courseAssignmentId: params.id,
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "Not enrolled in this course" },
        { status: 403 }
      );
    }

    const testExam = await prisma.testExam.findUnique({
      where: { id: params.quizId },
      include: {
        courseAssignment: {
          include: {
            course: { select: { code: true, title: true } },
          },
        },
        questions: {
          orderBy: { sortOrder: "asc" },
          select: { id: true }, // Just count them
        },
        attempts: {
          where: { studentId: studentProfile.id },
          orderBy: { startedAt: "desc" },
        },
      },
    });

    if (!testExam) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Verify quiz belongs to this course
    if (testExam.courseAssignmentId !== params.id) {
      return NextResponse.json(
        { error: "Quiz does not belong to this course" },
        { status: 400 }
      );
    }

    const now = new Date();
    const isOpen = new Date(testExam.startTime) <= now && new Date(testExam.endTime) >= now;
    const isClosed = new Date(testExam.endTime) < now;
    const isUpcoming = new Date(testExam.startTime) > now;

    return NextResponse.json({
      quiz: {
        id: testExam.id,
        title: testExam.title,
        type: testExam.type,
        description: testExam.description,
        durationMinutes: testExam.durationMinutes,
        totalMarks: testExam.totalMarks,
        passMark: testExam.passMark,
        startTime: testExam.startTime,
        endTime: testExam.endTime,
        shuffleQuestions: testExam.shuffleQuestions,
        showResultsImmediately: testExam.showResultsImmediately,
        questionCount: testExam.questions.length,
        course: testExam.courseAssignment.course,
      },
      attempts: testExam.attempts.map((a) => ({
        id: a.id,
        status: a.status,
        totalScore: a.totalScore,
        maxScore: a.maxScore,
        isPassed: a.isPassed,
        startedAt: a.startedAt,
        submittedAt: a.submittedAt,
      })),
      status: {
        isOpen,
        isClosed,
        isUpcoming,
      },
      maxAttempts: 2, // Configurable - default 2 attempts
    });
  } catch (error) {
    console.error("Quiz GET error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    const status = message === "Unauthorized"
      ? 401
      : message.includes("Forbidden")
        ? 403
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
