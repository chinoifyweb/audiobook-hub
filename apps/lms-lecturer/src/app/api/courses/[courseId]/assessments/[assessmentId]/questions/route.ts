import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { requireLecturer, verifyLecturerCourseAccess } from "@/lib/auth";

/**
 * POST /api/courses/[courseId]/assessments/[assessmentId]/questions
 * Add a question to an existing assessment.
 * Body: { questionText, questionType, options, correctAnswer, points }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { courseId: string; assessmentId: string } }
) {
  try {
    const lecturer = await requireLecturer();
    await verifyLecturerCourseAccess(lecturer.id, params.courseId);

    const testExam = await prisma.testExam.findUnique({
      where: { id: params.assessmentId },
      include: { questions: { orderBy: { sortOrder: "desc" }, take: 1 } },
    });

    if (!testExam || testExam.courseAssignmentId !== params.courseId) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    const body = await request.json();
    const { questionText, questionType, options, correctAnswer, points } = body;

    if (!questionText || !questionType) {
      return NextResponse.json({ error: "questionText and questionType required" }, { status: 400 });
    }

    // Find or create a question bank
    let questionBank = await prisma.questionBank.findFirst({
      where: { courseAssignmentId: params.courseId },
    });

    if (!questionBank) {
      questionBank = await prisma.questionBank.create({
        data: {
          courseAssignmentId: params.courseId,
          title: `${testExam.title} - Questions`,
        },
      });
    }

    const maxSort = testExam.questions[0]?.sortOrder ?? -1;

    // Create the question
    const question = await prisma.question.create({
      data: {
        questionBankId: questionBank.id,
        questionText,
        questionType,
        options: options || null,
        correctAnswer: correctAnswer || null,
        points: points || 1,
        sortOrder: maxSort + 1,
      },
    });

    // Link to test exam
    await prisma.testExamQuestion.create({
      data: {
        testExamId: params.assessmentId,
        questionId: question.id,
        sortOrder: maxSort + 1,
      },
    });

    // Update total marks
    const allQuestions = await prisma.testExamQuestion.findMany({
      where: { testExamId: params.assessmentId },
      include: { question: true },
    });

    const newTotal = allQuestions.reduce((sum, tq) => sum + tq.question.points, 0);
    await prisma.testExam.update({
      where: { id: params.assessmentId },
      data: { totalMarks: newTotal },
    });

    return NextResponse.json(question, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/courses/[courseId]/assessments/[assessmentId]/questions
 * Remove a question from an assessment. Query: ?questionId=xxx
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { courseId: string; assessmentId: string } }
) {
  try {
    const lecturer = await requireLecturer();
    await verifyLecturerCourseAccess(lecturer.id, params.courseId);

    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get("questionId");

    if (!questionId) {
      return NextResponse.json({ error: "questionId required" }, { status: 400 });
    }

    await prisma.testExamQuestion.deleteMany({
      where: {
        testExamId: params.assessmentId,
        questionId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
