import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { requireLecturer } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const lecturer = await requireLecturer();
    const body = await request.json();

    const { questionBankId, questionText, questionType, options, correctAnswer, points } = body;

    if (!questionBankId || !questionText || !questionType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify ownership
    const bank = await prisma.questionBank.findUnique({
      where: { id: questionBankId },
      include: { courseAssignment: true },
    });

    if (!bank) {
      return NextResponse.json({ error: "Question bank not found" }, { status: 404 });
    }

    if (bank.courseAssignment.lecturerId !== lecturer.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get next sort order
    const lastQuestion = await prisma.question.findFirst({
      where: { questionBankId },
      orderBy: { sortOrder: "desc" },
    });

    const question = await prisma.question.create({
      data: {
        questionBankId,
        questionText,
        questionType,
        options: options || null,
        correctAnswer: correctAnswer || null,
        points: points || 1,
        sortOrder: (lastQuestion?.sortOrder ?? -1) + 1,
      },
    });

    return NextResponse.json(question, { status: 201 });
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
      return NextResponse.json({ error: "Question id required" }, { status: 400 });
    }

    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        questionBank: {
          include: { courseAssignment: true },
        },
      },
    });

    if (!question) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (question.questionBank.courseAssignment.lecturerId !== lecturer.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const updated = await prisma.question.update({
      where: { id },
      data: {
        ...(updates.questionText !== undefined && { questionText: updates.questionText }),
        ...(updates.questionType !== undefined && { questionType: updates.questionType }),
        ...(updates.options !== undefined && { options: updates.options }),
        ...(updates.correctAnswer !== undefined && { correctAnswer: updates.correctAnswer }),
        ...(updates.points !== undefined && { points: updates.points }),
        ...(updates.sortOrder !== undefined && { sortOrder: updates.sortOrder }),
      },
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
      return NextResponse.json({ error: "Question id required" }, { status: 400 });
    }

    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        questionBank: {
          include: { courseAssignment: true },
        },
      },
    });

    if (!question) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (question.questionBank.courseAssignment.lecturerId !== lecturer.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await prisma.question.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
