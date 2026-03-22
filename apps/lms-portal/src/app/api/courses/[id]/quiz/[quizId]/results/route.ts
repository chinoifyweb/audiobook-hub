import { NextResponse } from "next/server";
import { requireStudent } from "@/lib/auth";
import { prisma } from "@repo/db";

export async function GET(
  _request: Request,
  { params }: { params: { id: string; quizId: string } }
) {
  try {
    const { studentProfile } = await requireStudent();

    // Get the quiz with attempts for this student
    const testExam = await prisma.testExam.findUnique({
      where: { id: params.quizId },
      include: {
        courseAssignment: {
          include: {
            course: { select: { code: true, title: true } },
          },
        },
        attempts: {
          where: {
            studentId: studentProfile.id,
            status: { in: ["submitted", "graded"] },
          },
          orderBy: { startedAt: "desc" },
          include: {
            answers: {
              include: {
                question: {
                  select: {
                    id: true,
                    questionText: true,
                    questionType: true,
                    options: true,
                    correctAnswer: true,
                    points: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!testExam) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    if (testExam.attempts.length === 0) {
      return NextResponse.json(
        { error: "No completed attempts found" },
        { status: 404 }
      );
    }

    // Get best attempt
    const bestAttempt = testExam.attempts.reduce((best, current) => {
      if (!best) return current;
      if (
        current.totalScore !== null &&
        (best.totalScore === null || current.totalScore > best.totalScore)
      ) {
        return current;
      }
      return best;
    }, testExam.attempts[0]);

    // Format results
    const results = testExam.attempts.map((attempt) => ({
      id: attempt.id,
      status: attempt.status,
      totalScore: attempt.totalScore,
      maxScore: attempt.maxScore,
      isPassed: attempt.isPassed,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      percentage:
        attempt.totalScore !== null
          ? Math.round((attempt.totalScore / attempt.maxScore) * 100)
          : null,
      answers: testExam.showResultsImmediately
        ? attempt.answers.map((a) => ({
            questionId: a.questionId,
            questionText: a.question.questionText,
            questionType: a.question.questionType,
            options: a.question.options,
            correctAnswer: a.question.correctAnswer,
            selectedOption: a.selectedOption,
            answerText: a.answerText,
            isCorrect: a.isCorrect,
            pointsAwarded: a.pointsAwarded,
            maxPoints: a.question.points,
          }))
        : [],
    }));

    return NextResponse.json({
      quiz: {
        id: testExam.id,
        title: testExam.title,
        type: testExam.type,
        totalMarks: testExam.totalMarks,
        passMark: testExam.passMark,
        showResults: testExam.showResultsImmediately,
        course: testExam.courseAssignment.course,
      },
      results,
      bestAttempt: {
        id: bestAttempt.id,
        totalScore: bestAttempt.totalScore,
        maxScore: bestAttempt.maxScore,
        isPassed: bestAttempt.isPassed,
      },
    });
  } catch (error) {
    console.error("Quiz results GET error:", error);
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
