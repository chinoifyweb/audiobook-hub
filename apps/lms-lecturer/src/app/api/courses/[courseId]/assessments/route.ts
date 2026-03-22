import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { requireLecturer, verifyLecturerCourseAccess } from "@/lib/auth";

/**
 * GET /api/courses/[courseId]/assessments
 * List all tests/exams for a course with question counts and attempt stats.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const lecturer = await requireLecturer();
    await verifyLecturerCourseAccess(lecturer.id, params.courseId);

    const tests = await prisma.testExam.findMany({
      where: { courseAssignmentId: params.courseId },
      include: {
        questions: { include: { question: true } },
        attempts: {
          include: {
            student: {
              include: { user: { select: { fullName: true } } },
            },
          },
        },
      },
      orderBy: { startTime: "desc" },
    });

    return NextResponse.json(tests);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/courses/[courseId]/assessments
 * Create a new quiz/exam with inline questions.
 * Body: {
 *   title, description, type ("test"|"exam"),
 *   startTime, endTime, durationMinutes, totalMarks, passMark,
 *   maxAttempts, isPublished,
 *   questions: [{ questionText, questionType, options, correctAnswer, points }]
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const lecturer = await requireLecturer();
    await verifyLecturerCourseAccess(lecturer.id, params.courseId);

    const body = await request.json();
    const {
      title,
      description,
      type,
      startTime,
      endTime,
      durationMinutes,
      totalMarks,
      passMark,
      isPublished,
      shuffleQuestions,
      showResultsImmediately,
      questions,
    } = body;

    if (!title || !type || !startTime || !endTime || !durationMinutes) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // First create or find a question bank for this course
    let questionBank = await prisma.questionBank.findFirst({
      where: { courseAssignmentId: params.courseId },
    });

    if (!questionBank) {
      questionBank = await prisma.questionBank.create({
        data: {
          courseAssignmentId: params.courseId,
          title: `${title} - Questions`,
        },
      });
    }

    // Create questions in the bank
    const createdQuestions = [];
    if (questions && Array.isArray(questions)) {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const created = await prisma.question.create({
          data: {
            questionBankId: questionBank.id,
            questionText: q.questionText,
            questionType: q.questionType,
            options: q.options || null,
            correctAnswer: q.correctAnswer || null,
            points: q.points || 1,
            sortOrder: i,
          },
        });
        createdQuestions.push(created);
      }
    }

    // Calculate total marks from questions
    const calculatedTotal =
      createdQuestions.reduce((sum, q) => sum + q.points, 0) || totalMarks || 100;

    // Create the test/exam
    const testExam = await prisma.testExam.create({
      data: {
        courseAssignmentId: params.courseId,
        title,
        description: description || null,
        type,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        durationMinutes,
        totalMarks: calculatedTotal,
        passMark: passMark || Math.floor(calculatedTotal * 0.4),
        isPublished: isPublished ?? false,
        shuffleQuestions: shuffleQuestions ?? false,
        showResultsImmediately: showResultsImmediately ?? false,
        questions: {
          create: createdQuestions.map((q, idx) => ({
            questionId: q.id,
            sortOrder: idx,
          })),
        },
      },
      include: {
        questions: { include: { question: true } },
      },
    });

    return NextResponse.json(testExam, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
