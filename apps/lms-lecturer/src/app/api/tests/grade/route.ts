import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { requireLecturer } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const lecturer = await requireLecturer();
    const body = await request.json();

    const { attemptId, grades } = body;

    if (!attemptId) {
      return NextResponse.json({ error: "attemptId required" }, { status: 400 });
    }

    // Fetch attempt and verify access
    const attempt = await prisma.testExamAttempt.findUnique({
      where: { id: attemptId },
      include: {
        testExam: {
          include: { courseAssignment: true },
        },
        answers: {
          include: { question: true },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    if (attempt.testExam.courseAssignment.lecturerId !== lecturer.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Update manually graded answers
    const updatePromises = [];
    for (const [answerId, gradeData] of Object.entries(
      grades as Record<string, { points: number; feedback: string }>
    )) {
      updatePromises.push(
        prisma.testExamAnswer.update({
          where: { id: answerId },
          data: {
            pointsAwarded: gradeData.points,
            feedback: gradeData.feedback || null,
            isCorrect: gradeData.points > 0,
          },
        })
      );
    }
    await Promise.all(updatePromises);

    // Recalculate total score
    const updatedAnswers = await prisma.testExamAnswer.findMany({
      where: { attemptId },
    });

    const totalScore = updatedAnswers.reduce(
      (sum, ans) => sum + (ans.pointsAwarded ?? 0),
      0
    );

    const isPassed = totalScore >= attempt.testExam.passMark;

    // Update attempt
    await prisma.testExamAttempt.update({
      where: { id: attemptId },
      data: {
        totalScore,
        isPassed,
        status: "graded",
        gradedById: lecturer.userId,
        gradedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, totalScore, isPassed });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
