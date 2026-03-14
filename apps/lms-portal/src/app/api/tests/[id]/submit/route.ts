import { NextResponse } from "next/server";
import { requireStudent } from "@/lib/auth";
import { prisma } from "@repo/db";

interface SubmittedAnswer {
  questionId: string;
  selectedOption: number | null;
  answerText: string | null;
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { studentProfile } = await requireStudent();
    const { attemptId, answers } = (await request.json()) as {
      attemptId: string;
      answers: SubmittedAnswer[];
    };

    // Verify attempt belongs to this student
    const attempt = await prisma.testExamAttempt.findFirst({
      where: {
        id: attemptId,
        testExamId: params.id,
        studentId: studentProfile.id,
        status: "in_progress",
      },
    });

    if (!attempt) {
      return NextResponse.json(
        { error: "Invalid or already submitted attempt" },
        { status: 400 }
      );
    }

    // Get test questions with correct answers for auto-grading
    const testExam = await prisma.testExam.findUnique({
      where: { id: params.id },
      include: {
        questions: {
          include: { question: true },
        },
      },
    });

    if (!testExam) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    // Build question lookup
    const questionMap = new Map(
      testExam.questions.map((tq) => [tq.question.id, tq.question])
    );

    let totalScore = 0;
    let autoGradedAll = true;

    // Save answers and auto-grade where possible
    for (const answer of answers) {
      const question = questionMap.get(answer.questionId);
      if (!question) continue;

      let isCorrect: boolean | null = null;
      let pointsAwarded: number | null = null;

      // Auto-grade MCQ
      if (question.questionType === "mcq" && answer.selectedOption !== null) {
        const options = question.options as {
          text: string;
          isCorrect: boolean;
        }[];
        if (options && options[answer.selectedOption]) {
          isCorrect = options[answer.selectedOption].isCorrect;
          pointsAwarded = isCorrect ? question.points : 0;
          totalScore += pointsAwarded;
        }
      }
      // Auto-grade True/False
      else if (
        question.questionType === "true_false" &&
        answer.selectedOption !== null
      ) {
        const correctAnswer = question.correctAnswer?.toLowerCase();
        const selectedAnswer = answer.selectedOption === 0 ? "true" : "false";
        isCorrect = selectedAnswer === correctAnswer;
        pointsAwarded = isCorrect ? question.points : 0;
        totalScore += pointsAwarded;
      }
      // Auto-grade short answer (exact match, case-insensitive)
      else if (
        question.questionType === "short_answer" &&
        answer.answerText &&
        question.correctAnswer
      ) {
        isCorrect =
          answer.answerText.trim().toLowerCase() ===
          question.correctAnswer.trim().toLowerCase();
        pointsAwarded = isCorrect ? question.points : 0;
        totalScore += pointsAwarded;
      }
      // Auto-grade fill in the blank (exact match, case-insensitive)
      else if (
        question.questionType === "fill_in_the_blank" &&
        answer.answerText &&
        question.correctAnswer
      ) {
        isCorrect =
          answer.answerText.trim().toLowerCase() ===
          question.correctAnswer.trim().toLowerCase();
        pointsAwarded = isCorrect ? question.points : 0;
        totalScore += pointsAwarded;
      }
      // Essay — needs manual grading
      else if (question.questionType === "essay") {
        autoGradedAll = false;
      }

      // Upsert answer
      await prisma.testExamAnswer.upsert({
        where: {
          attemptId_questionId: {
            attemptId,
            questionId: answer.questionId,
          },
        },
        create: {
          attemptId,
          questionId: answer.questionId,
          selectedOption: answer.selectedOption !== null ? answer.selectedOption : undefined,
          answerText: answer.answerText || null,
          isCorrect,
          pointsAwarded,
        },
        update: {
          selectedOption: answer.selectedOption !== null ? answer.selectedOption : undefined,
          answerText: answer.answerText || null,
          isCorrect,
          pointsAwarded,
        },
      });
    }

    // Update attempt
    const updatedAttempt = await prisma.testExamAttempt.update({
      where: { id: attemptId },
      data: {
        submittedAt: new Date(),
        totalScore: autoGradedAll ? totalScore : null,
        isPassed: autoGradedAll ? totalScore >= testExam.passMark : null,
        status: autoGradedAll ? "graded" : "submitted",
      },
    });

    return NextResponse.json({
      message: "Test submitted successfully",
      attempt: updatedAttempt,
      autoGraded: autoGradedAll,
    });
  } catch (error) {
    console.error("Test submit error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message === "Unauthorized" ? 401 : message.includes("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
