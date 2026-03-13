import { NextResponse } from "next/server";
import { requireStudent } from "@/lib/auth";
import { prisma } from "@repo/db";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { studentProfile } = await requireStudent();

    const testExam = await prisma.testExam.findUnique({
      where: { id: params.id },
      include: {
        courseAssignment: {
          include: {
            enrollments: {
              where: { studentId: studentProfile.id, status: "enrolled" },
            },
          },
        },
        questions: {
          include: {
            question: true,
          },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!testExam) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    // Verify enrollment
    if (testExam.courseAssignment.enrollments.length === 0) {
      return NextResponse.json(
        { error: "You are not enrolled in this course" },
        { status: 403 }
      );
    }

    // Check time window
    const now = new Date();
    if (new Date(testExam.startTime) > now) {
      return NextResponse.json(
        { error: "This test has not started yet" },
        { status: 400 }
      );
    }
    if (new Date(testExam.endTime) < now) {
      return NextResponse.json(
        { error: "This test window has closed" },
        { status: 400 }
      );
    }

    // Check for existing attempt
    let attempt = await prisma.testExamAttempt.findFirst({
      where: {
        testExamId: params.id,
        studentId: studentProfile.id,
      },
      orderBy: { startedAt: "desc" },
    });

    if (attempt && (attempt.status === "submitted" || attempt.status === "graded")) {
      return NextResponse.json(
        { error: "You have already completed this test" },
        { status: 400 }
      );
    }

    // Create new attempt if none exists
    if (!attempt) {
      attempt = await prisma.testExamAttempt.create({
        data: {
          testExamId: params.id,
          studentId: studentProfile.id,
          maxScore: testExam.totalMarks,
          status: "in_progress",
        },
      });
    }

    // Calculate remaining time
    const elapsedSeconds = Math.floor(
      (now.getTime() - attempt.startedAt.getTime()) / 1000
    );
    const totalDurationSeconds = testExam.durationMinutes * 60;
    const remainingSeconds = Math.max(0, totalDurationSeconds - elapsedSeconds);

    // Also cap by end time
    const endTimeRemaining = Math.floor(
      (new Date(testExam.endTime).getTime() - now.getTime()) / 1000
    );
    const durationSeconds = Math.min(remainingSeconds, Math.max(0, endTimeRemaining));

    // Prepare questions (strip correct answers)
    let questionItems = testExam.questions.map((tq) => ({
      id: tq.question.id,
      questionText: tq.question.questionText,
      questionType: tq.question.questionType,
      options: tq.question.options
        ? (tq.question.options as { text: string; isCorrect: boolean }[]).map(
            (o) => ({ text: o.text, isCorrect: false }) // Strip isCorrect
          )
        : null,
      points: tq.question.points,
      sortOrder: tq.sortOrder,
    }));

    // Shuffle if configured
    if (testExam.shuffleQuestions) {
      questionItems = questionItems.sort(() => Math.random() - 0.5);
    }

    // Get existing answers if resuming
    const existingAnswers = await prisma.testExamAnswer.findMany({
      where: { attemptId: attempt.id },
    });

    return NextResponse.json({
      attemptId: attempt.id,
      questions: questionItems,
      durationSeconds,
      existingAnswers: existingAnswers.map((a) => ({
        questionId: a.questionId,
        selectedOption: a.selectedOption,
        answerText: a.answerText,
      })),
    });
  } catch (error) {
    console.error("Test start error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message === "Unauthorized" ? 401 : message.includes("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
