import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { requireLecturer, verifyLecturerCourseAccess } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const lecturer = await requireLecturer();
    const { searchParams } = new URL(request.url);

    // Get single attempt by id
    const attemptId = searchParams.get("attemptId");
    if (attemptId) {
      const attempt = await prisma.testExamAttempt.findUnique({
        where: { id: attemptId },
        include: {
          student: {
            include: { user: { select: { fullName: true } } },
          },
          testExam: {
            include: {
              courseAssignment: {
                include: { course: true },
              },
            },
          },
          answers: {
            include: {
              question: true,
            },
            orderBy: { question: { sortOrder: "asc" } },
          },
        },
      });

      if (!attempt) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      if (attempt.testExam.courseAssignment.lecturerId !== lecturer.id) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      return NextResponse.json(attempt);
    }

    // List tests for a course
    const courseAssignmentId = searchParams.get("courseAssignmentId");
    if (courseAssignmentId) {
      await verifyLecturerCourseAccess(lecturer.id, courseAssignmentId);

      const tests = await prisma.testExam.findMany({
        where: { courseAssignmentId },
        include: {
          attempts: true,
          questions: { include: { question: true } },
        },
        orderBy: { startTime: "desc" },
      });

      return NextResponse.json(tests);
    }

    return NextResponse.json({ error: "Parameter required" }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const lecturer = await requireLecturer();
    const body = await request.json();

    const {
      courseAssignmentId,
      title,
      type,
      description,
      durationMinutes,
      totalMarks,
      passMark,
      startTime,
      endTime,
      isProctored,
      shuffleQuestions,
      showResultsImmediately,
      isPublished,
      questionIds,
    } = body;

    if (
      !courseAssignmentId ||
      !title ||
      !type ||
      !durationMinutes ||
      !totalMarks ||
      !startTime ||
      !endTime
    ) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!questionIds || questionIds.length === 0) {
      return NextResponse.json({ error: "Select at least one question" }, { status: 400 });
    }

    await verifyLecturerCourseAccess(lecturer.id, courseAssignmentId);

    const testExam = await prisma.testExam.create({
      data: {
        courseAssignmentId,
        title,
        type,
        description: description || null,
        durationMinutes,
        totalMarks,
        passMark: passMark || 0,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        isProctored: isProctored ?? false,
        shuffleQuestions: shuffleQuestions ?? false,
        showResultsImmediately: showResultsImmediately ?? false,
        isPublished: isPublished ?? false,
        questions: {
          create: questionIds.map((qId: string, index: number) => ({
            questionId: qId,
            sortOrder: index,
          })),
        },
      },
    });

    return NextResponse.json(testExam, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const lecturer = await requireLecturer();
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Test id required" }, { status: 400 });
    }

    const test = await prisma.testExam.findUnique({
      where: { id },
      include: { courseAssignment: true },
    });

    if (!test) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (test.courseAssignment.lecturerId !== lecturer.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const data: Record<string, unknown> = {};
    if (updates.title !== undefined) data.title = updates.title;
    if (updates.description !== undefined) data.description = updates.description;
    if (updates.type !== undefined) data.type = updates.type;
    if (updates.durationMinutes !== undefined) data.durationMinutes = Number(updates.durationMinutes);
    if (updates.totalMarks !== undefined) data.totalMarks = Number(updates.totalMarks);
    if (updates.passMark !== undefined) data.passMark = Number(updates.passMark);
    if (updates.startTime !== undefined) data.startTime = new Date(updates.startTime);
    if (updates.endTime !== undefined) data.endTime = new Date(updates.endTime);
    if (updates.isPublished !== undefined) data.isPublished = updates.isPublished;
    if (updates.shuffleQuestions !== undefined) data.shuffleQuestions = updates.shuffleQuestions;
    if (updates.showResultsImmediately !== undefined) data.showResultsImmediately = updates.showResultsImmediately;
    if (updates.maxAttempts !== undefined) data.maxAttempts = Number(updates.maxAttempts);

    const updated = await prisma.testExam.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const lecturer = await requireLecturer();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Test id required" }, { status: 400 });
    }

    const test = await prisma.testExam.findUnique({
      where: { id },
      include: { courseAssignment: true },
    });

    if (!test) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (test.courseAssignment.lecturerId !== lecturer.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await prisma.testExam.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
